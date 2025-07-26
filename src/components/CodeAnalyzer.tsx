import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, User, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { analyzeCode } from "@/lib/aiDetection";
import type { AnalysisResult } from "@/lib/aiDetection";

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

export function CodeAnalyzer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeCode(code, language);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getLineIndicator = (lineAnalysis: any) => {
    if (lineAnalysis.isAI) {
      return <Brain className="w-4 h-4 text-ai" />;
    } else if (lineAnalysis.confidence > 0.7) {
      return <User className="w-4 h-4 text-human" />;
    }
    return <AlertTriangle className="w-4 h-4 text-neutral" />;
  };

  const getConfidenceBadge = (confidence: number, isAI: boolean) => {
    const percentage = Math.round(confidence * 100);
    return (
      <Badge 
        variant="outline" 
        className={`${isAI ? 'border-ai text-ai' : 'border-human text-human'} text-xs`}
      >
        {percentage}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-code-border bg-gradient-to-br from-card to-code-bg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            AI Code Detection
          </CardTitle>
          <CardDescription>
            Paste your code below to analyze which lines are AI-generated vs human-written
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Programming Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-code-bg border-code-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={!code.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Code"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Code Input</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="min-h-[300px] font-mono text-sm bg-code-bg border-code-border"
            />
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Overall Statistics */}
          <Card className="border-code-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Brain className="w-4 h-4 text-ai" />
                        AI Generated
                      </span>
                      <span className="text-sm font-bold text-ai">
                        {Math.round(analysis.aiPercentage)}%
                      </span>
                    </div>
                    <Progress value={analysis.aiPercentage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4 text-human" />
                        Human Written
                      </span>
                      <span className="text-sm font-bold text-human">
                        {Math.round(analysis.humanPercentage)}%
                      </span>
                    </div>
                    <Progress value={analysis.humanPercentage} className="h-2" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Total Lines:</span> {analysis.totalLines}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">AI Lines:</span> {analysis.aiLines}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Human Lines:</span> {analysis.humanLines}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Overall Confidence:</span> {Math.round(analysis.overallConfidence * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line-by-line Analysis */}
          <Card className="border-code-border">
            <CardHeader>
              <CardTitle>Line-by-Line Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown with confidence scores and reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All Lines ({analysis.totalLines})
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Only ({analysis.aiLines})
                  </TabsTrigger>
                  <TabsTrigger value="human" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Human Only ({analysis.humanLines})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {analysis.lineAnalysis.map((lineAnalysis, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                          lineAnalysis.isAI ? 'border-ai/30 bg-ai/5' : 'border-human/30 bg-human/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground w-8">
                              {index + 1}
                            </span>
                            {getLineIndicator(lineAnalysis)}
                            {getConfidenceBadge(lineAnalysis.confidence, lineAnalysis.isAI)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                              {lineAnalysis.content}
                            </pre>
                            
                            {lineAnalysis.reasons.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {lineAnalysis.reasons.map((reason, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded"
                                  >
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-4">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {analysis.lineAnalysis.filter(line => line.isAI).map((lineAnalysis, index) => {
                      const originalIndex = analysis.lineAnalysis.findIndex(line => line === lineAnalysis);
                      return (
                        <div
                          key={originalIndex}
                          className="p-3 rounded-lg border transition-all hover:bg-muted/50 border-ai/30 bg-ai/5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground w-8">
                                {originalIndex + 1}
                              </span>
                              {getLineIndicator(lineAnalysis)}
                              {getConfidenceBadge(lineAnalysis.confidence, lineAnalysis.isAI)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                                {lineAnalysis.content}
                              </pre>
                              
                              {lineAnalysis.reasons.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {lineAnalysis.reasons.map((reason, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded"
                                    >
                                      {reason}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="human" className="mt-4">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {analysis.lineAnalysis.filter(line => !line.isAI).map((lineAnalysis, index) => {
                      const originalIndex = analysis.lineAnalysis.findIndex(line => line === lineAnalysis);
                      return (
                        <div
                          key={originalIndex}
                          className="p-3 rounded-lg border transition-all hover:bg-muted/50 border-human/30 bg-human/5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground w-8">
                                {originalIndex + 1}
                              </span>
                              {getLineIndicator(lineAnalysis)}
                              {getConfidenceBadge(lineAnalysis.confidence, lineAnalysis.isAI)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                                {lineAnalysis.content}
                              </pre>
                              
                              {lineAnalysis.reasons.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {lineAnalysis.reasons.map((reason, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded"
                                    >
                                      {reason}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}