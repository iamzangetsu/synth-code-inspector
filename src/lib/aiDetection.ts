export interface LineAnalysis {
  content: string;
  isAI: boolean;
  confidence: number;
  reasons: string[];
}

export interface AnalysisResult {
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  humanPercentage: number;
  overallConfidence: number;
  lineAnalysis: LineAnalysis[];
}

interface DetectionPattern {
  pattern: RegExp;
  weight: number;
  reason: string;
  aiIndicator: boolean;
}

// AI detection patterns based on common characteristics
const AI_PATTERNS: DetectionPattern[] = [
  // Overly verbose comments
  {
    pattern: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    weight: 0.3,
    reason: "Contains verbose or generic comments typical of AI generation",
    aiIndicator: true
  },
  
  // Generic variable names
  {
    pattern: /\b(result|response|data|item|element|value|temp|obj|arr)\d*\b/gi,
    weight: 0.4,
    reason: "Uses generic variable names common in AI-generated code",
    aiIndicator: true
  },
  
  // Excessive error handling
  {
    pattern: /(try\s*{|catch\s*\(|finally\s*{)/g,
    weight: 0.2,
    reason: "Contains comprehensive error handling patterns",
    aiIndicator: true
  },
  
  // Repetitive patterns
  {
    pattern: /(\w+)\s*=\s*\1/g,
    weight: 0.3,
    reason: "Contains repetitive assignment patterns",
    aiIndicator: true
  },
  
  // TODO/FIXME comments
  {
    pattern: /(TODO|FIXME|NOTE|HACK):/gi,
    weight: 0.5,
    reason: "Contains TODO/FIXME comments suggesting human planning",
    aiIndicator: false
  },
  
  // Complex regex or cryptic code
  {
    pattern: /\/(?:\\.|[^\/\\\n])*\/[gimuy]*/g,
    weight: 0.3,
    reason: "Contains complex regex patterns",
    aiIndicator: false
  },
  
  // Inconsistent spacing/formatting
  {
    pattern: /\s{3,}|\t\s+|\s+\t/g,
    weight: 0.2,
    reason: "Has inconsistent spacing typical of human editing",
    aiIndicator: false
  },
  
  // Domain-specific abbreviations
  {
    pattern: /\b(btn|txt|img|nav|auth|admin|cfg|opts|params|args|ctx|req|res|db|api)\b/gi,
    weight: 0.3,
    reason: "Uses domain-specific abbreviations common in human code",
    aiIndicator: false
  }
];

// Language-specific patterns
const LANGUAGE_PATTERNS: Record<string, DetectionPattern[]> = {
  javascript: [
    {
      pattern: /console\.log\([^)]*\)/g,
      weight: 0.2,
      reason: "Contains debug console.log statements",
      aiIndicator: false
    },
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s*{/g,
      weight: 0.1,
      reason: "Uses function declarations",
      aiIndicator: true
    }
  ],
  python: [
    {
      pattern: /print\([^)]*\)/g,
      weight: 0.2,
      reason: "Contains debug print statements",
      aiIndicator: false
    },
    {
      pattern: /def\s+\w+\s*\([^)]*\):/g,
      weight: 0.1,
      reason: "Uses function definitions",
      aiIndicator: true
    }
  ],
  typescript: [
    {
      pattern: /:\s*(string|number|boolean|any|unknown|void|never)\b/g,
      weight: 0.2,
      reason: "Contains explicit type annotations",
      aiIndicator: true
    }
  ]
};

function analyzeCodeStructure(code: string): number {
  // Analyze overall code structure for AI patterns
  let aiScore = 0;
  
  // Check for perfect indentation (AI tends to be very consistent)
  const lines = code.split('\n').filter(line => line.trim());
  let consistentIndentation = 0;
  let indentPattern = '';
  
  for (const line of lines) {
    const indent = line.match(/^\s*/)?.[0] || '';
    if (!indentPattern && indent) {
      indentPattern = indent;
    }
    if (indent === indentPattern || indent === '' || indent.startsWith(indentPattern)) {
      consistentIndentation++;
    }
  }
  
  if (consistentIndentation / lines.length > 0.9) {
    aiScore += 0.3; // Very consistent indentation suggests AI
  }
  
  // Check for overly comprehensive documentation
  const commentLines = code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || [];
  const commentRatio = commentLines.length / lines.length;
  if (commentRatio > 0.3) {
    aiScore += 0.2;
  }
  
  // Check for excessive use of defensive programming
  const errorHandlingCount = (code.match(/(try|catch|throw|Error|Exception)/g) || []).length;
  if (errorHandlingCount > lines.length * 0.1) {
    aiScore += 0.2;
  }
  
  return Math.min(aiScore, 1);
}

function analyzeLine(line: string, lineNumber: number, language: string): LineAnalysis {
  const content = line.trim();
  let aiScore = 0;
  let humanScore = 0;
  const reasons: string[] = [];
  
  // Skip empty lines
  if (!content) {
    return {
      content: line,
      isAI: false,
      confidence: 0.5,
      reasons: ["Empty line - neutral"]
    };
  }
  
  // Apply general patterns
  for (const pattern of AI_PATTERNS) {
    if (pattern.pattern.test(content)) {
      if (pattern.aiIndicator) {
        aiScore += pattern.weight;
      } else {
        humanScore += pattern.weight;
      }
      reasons.push(pattern.reason);
    }
  }
  
  // Apply language-specific patterns
  const langPatterns = LANGUAGE_PATTERNS[language] || [];
  for (const pattern of langPatterns) {
    if (pattern.pattern.test(content)) {
      if (pattern.aiIndicator) {
        aiScore += pattern.weight;
      } else {
        humanScore += pattern.weight;
      }
      reasons.push(pattern.reason);
    }
  }
  
  // Additional heuristics
  
  // Line length analysis
  if (content.length > 120) {
    aiScore += 0.2;
    reasons.push("Very long line length typical of AI generation");
  } else if (content.length < 20 && !content.match(/[{}();,]/)) {
    humanScore += 0.1;
    reasons.push("Short, concise line suggests human writing");
  }
  
  // Check for perfect syntax
  const hasPerfectSyntax = !content.match(/[^\w\s\(\)\[\]{};:,.<>!@#$%^&*+=|\\?/-]/);
  if (hasPerfectSyntax && content.length > 30) {
    aiScore += 0.1;
    reasons.push("Perfect syntax and structure");
  }
  
  // Check for creative/quirky naming
  if (content.match(/\b(foo|bar|baz|qux|quirky|magic|hack|wtf)\b/i)) {
    humanScore += 0.3;
    reasons.push("Uses creative or placeholder naming typical of humans");
  }
  
  // Calculate final scores
  const totalScore = aiScore + humanScore;
  let confidence = totalScore > 0 ? Math.max(aiScore, humanScore) / totalScore : 0.5;
  confidence = Math.min(Math.max(confidence, 0.1), 0.95); // Clamp between 10% and 95%
  
  const isAI = aiScore > humanScore;
  
  if (reasons.length === 0) {
    reasons.push("No significant patterns detected - neutral classification");
  }
  
  return {
    content: line,
    isAI,
    confidence,
    reasons
  };
}

export async function analyzeCode(code: string, language: string): Promise<AnalysisResult> {
  // Simulate processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lines = code.split('\n');
  const lineAnalysis: LineAnalysis[] = [];
  
  // Analyze overall structure
  const structureScore = analyzeCodeStructure(code);
  
  // Analyze each line
  for (let i = 0; i < lines.length; i++) {
    const analysis = analyzeLine(lines[i], i + 1, language);
    
    // Adjust confidence based on overall structure
    if (structureScore > 0.5) {
      if (analysis.isAI) {
        analysis.confidence = Math.min(analysis.confidence + 0.1, 0.95);
      }
    }
    
    lineAnalysis.push(analysis);
  }
  
  // Calculate statistics
  const nonEmptyLines = lineAnalysis.filter(l => l.content.trim());
  const aiLines = nonEmptyLines.filter(l => l.isAI).length;
  const humanLines = nonEmptyLines.length - aiLines;
  const totalLines = nonEmptyLines.length;
  
  const aiPercentage = totalLines > 0 ? (aiLines / totalLines) * 100 : 0;
  const humanPercentage = totalLines > 0 ? (humanLines / totalLines) * 100 : 0;
  
  // Calculate overall confidence as weighted average
  const overallConfidence = nonEmptyLines.length > 0 
    ? nonEmptyLines.reduce((sum, line) => sum + line.confidence, 0) / nonEmptyLines.length
    : 0.5;
  
  return {
    totalLines,
    aiLines,
    humanLines,
    aiPercentage,
    humanPercentage,
    overallConfidence,
    lineAnalysis
  };
}