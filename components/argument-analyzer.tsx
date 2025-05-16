"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArgumentGraph } from "@/components/argument-graph";
import { analyzeArgument } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export type Premise = {
    id: string;
    text: string;
    title: string;
    type: "axiom" | "assumption" | "intermediate" | "conclusion";
    citations?: Citation[];
    supportingTheories?: Theory[];
    childAssumptions?: string[];
};

export type Citation = {
    lineNumbers: string;
    text: string;
};

export type Theory = {
    name: string;
    description: string;
};

export type Connection = {
    id: string;
    source: string;
    target: string;
    strength?: "strong" | "moderate" | "weak"; // Indicates the logical strength of the connection
};

export type AnalysisResult = {
    premises: Premise[];
    connections: Connection[];
    conclusion: string;
    sourceText?: string; // The full source text for citations
};

export function ArgumentAnalyzer() {
    const [argument, setArgument] = useState("");
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
        null
    );
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("interactive-map");
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
    const sourceTextRef = useRef<HTMLDivElement>(null);

    const exampleArguments = [
        "All humans are mortal. Socrates is a human. Therefore, Socrates is mortal.",
        "If it's raining, the streets are wet. The streets are wet. Therefore, it must be raining.",
        "All birds can fly. Penguins are birds. Therefore, penguins can fly.",
    ];

    const handleAnalyze = async () => {
        if (!argument.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setActiveTab("interactive-map");

        try {
            const result = await analyzeArgument(argument);

            // Add source text to the result
            const sourceText = argument.split("\n").map((line, index) => ({
                number: index + 1,
                content: line,
            }));

            // Validate connections to ensure they have valid source and target
            const validPremiseIds = new Set(result.premises.map((p) => p.id));
            const validConnections = result.connections.filter((conn) => {
                const isValid =
                    validPremiseIds.has(conn.source) &&
                    validPremiseIds.has(conn.target);
                if (!isValid) {
                    console.warn(
                        `Invalid connection found:`,
                        conn,
                        `Valid IDs are:`,
                        Array.from(validPremiseIds)
                    );
                }
                return isValid;
            });

            // Add example citations to premises
            const enhancedResult: AnalysisResult = {
                ...result,
                sourceText: argument,
                connections: validConnections,
                premises: result.premises.map((premise) => {
                    // For this example, we're creating dummy citations
                    // In a real app, these would be generated from analysis
                    const lineStart = Math.floor(
                        Math.random() * sourceText.length
                    );
                    const lineEnd = Math.min(
                        lineStart + Math.floor(Math.random() * 5) + 1,
                        sourceText.length
                    );

                    // Also add example supporting theories to some premises
                    const shouldAddTheory = Math.random() > 0.5;

                    return {
                        ...premise,
                        citations: [
                            {
                                lineNumbers: `${lineStart + 1}-${lineEnd}`,
                                text: sourceText
                                    .slice(lineStart, lineEnd)
                                    .map((l) => l.content)
                                    .join(" "),
                            },
                        ],
                        supportingTheories: shouldAddTheory
                            ? [
                                  {
                                      name:
                                          premise.type === "axiom"
                                              ? "Logical Axiom"
                                              : premise.type === "assumption"
                                              ? "Assumption Theory"
                                              : "Inference Rule",
                                      description: `This ${premise.type} demonstrates a fundamental principle in logical reasoning and argumentation.`,
                                  },
                              ]
                            : undefined,
                    };
                }),
            };

            setAnalysisResult(enhancedResult);
        } catch (err) {
            console.error("Analysis error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to analyze the argument. Please try again."
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    const setExampleArgument = (index: number) => {
        setArgument(exampleArguments[index]);
        setAnalysisResult(null);
        setError(null);
    };

    const scrollToLine = (lineNumber: number) => {
        setHighlightedLine(lineNumber);

        if (sourceTextRef.current) {
            const lineElements =
                sourceTextRef.current.querySelectorAll<HTMLElement>(
                    "[data-line]"
                );
            const lineElement = Array.from(lineElements).find(
                (el) =>
                    el.dataset.line && parseInt(el.dataset.line) === lineNumber
            );

            if (lineElement) {
                lineElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }
    };

    // Handle citation range like "142-143"
    const handleCitationClick = (citation: Citation) => {
        const lineRanges = citation.lineNumbers
            .split(",")
            .map((range) => range.trim());

        // Just scroll to the first line of the first range for simplicity
        for (const range of lineRanges) {
            const [start] = range.split("-").map(Number);
            if (!isNaN(start)) {
                scrollToLine(start);
                break;
            }
        }

        // Switch to source text tab
        setActiveTab("source-text");
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Left column - Input */}
            <div className="w-1/3 border-r p-4 flex flex-col">
                <h2 className="text-lg font-medium mb-2">
                    Enter Your Argument
                </h2>
                <Textarea
                    placeholder="Type or paste your argument here..."
                    className="flex-1 min-h-[200px] mb-4 resize-none"
                    value={argument}
                    onChange={(e) => setArgument(e.target.value)}
                />
                <Button
                    onClick={handleAnalyze}
                    className="w-full"
                    disabled={!argument.trim() || isAnalyzing}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        "Analyze Argument"
                    )}
                </Button>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-4">
                    <h3 className="font-medium mb-2">Try an example:</h3>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExampleArgument(0)}
                            className="justify-start text-left"
                        >
                            Socrates Mortality
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExampleArgument(1)}
                            className="justify-start text-left"
                        >
                            Rain and Wet Streets
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExampleArgument(2)}
                            className="justify-start text-left"
                        >
                            Birds and Penguins
                        </Button>
                    </div>
                </div>

                {analysisResult && (
                    <div className="mt-4">
                        <h3 className="font-medium mb-2">Analysis Summary</h3>
                        <ul className="text-sm space-y-1">
                            <li>Premises: {analysisResult.premises.length}</li>
                            <li>
                                Connections: {analysisResult.connections.length}
                            </li>
                            <li>Conclusion: {analysisResult.conclusion}</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Right column - Visualization */}
            <div className="w-2/3 flex flex-col">
                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                    {analysisResult ? (
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="flex-1 flex flex-col"
                        >
                            <TabsList className="mb-4">
                                <TabsTrigger value="interactive-map">
                                    Interactive Map
                                </TabsTrigger>
                                <TabsTrigger value="source-text">
                                    Source Text
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="interactive-map"
                                className="flex-1 overflow-hidden"
                            >
                                <Card className="h-full overflow-hidden">
                                    <ArgumentGraph
                                        premises={analysisResult.premises}
                                        connections={analysisResult.connections}
                                        conclusion={analysisResult.conclusion}
                                        sourceText={analysisResult.sourceText}
                                    />
                                </Card>
                            </TabsContent>

                            <TabsContent
                                value="source-text"
                                className="flex-1 overflow-hidden"
                            >
                                <Card className="h-full overflow-hidden flex flex-col">
                                    <div
                                        className="p-4 flex-1 overflow-auto font-mono text-sm"
                                        ref={sourceTextRef}
                                    >
                                        {analysisResult.sourceText
                                            ?.split("\n")
                                            .map((line, idx) => (
                                                <div
                                                    key={idx}
                                                    data-line={idx + 1}
                                                    className={`flex hover:bg-gray-100 ${
                                                        highlightedLine ===
                                                        idx + 1
                                                            ? "bg-yellow-100"
                                                            : ""
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-12 mr-4 text-right select-none text-gray-400 ${
                                                            highlightedLine ===
                                                            idx + 1
                                                                ? "font-bold text-gray-600"
                                                                : ""
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        {line || " "}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <Card className="flex-1 flex items-center justify-center text-muted-foreground">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p>Breaking down the argument...</p>
                                </div>
                            ) : (
                                <p>
                                    Enter an argument and click "Analyze" to see
                                    the visualization
                                </p>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
