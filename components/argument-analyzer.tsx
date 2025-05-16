"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArgumentGraph } from "@/components/argument-graph"
import { analyzeArgument } from "@/app/actions"
import { Loader2 } from "lucide-react"

export type Premise = {
  id: string
  text: string
  type: "axiom" | "assumption" | "intermediate" | "conclusion"
}

export type Connection = {
  id: string
  source: string
  target: string
}

export type AnalysisResult = {
  premises: Premise[]
  connections: Connection[]
  conclusion: string
}

export function ArgumentAnalyzer() {
  const [argument, setArgument] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exampleArguments = [
    "All humans are mortal. Socrates is a human. Therefore, Socrates is mortal.",
    "If it's raining, the streets are wet. The streets are wet. Therefore, it must be raining.",
    "All birds can fly. Penguins are birds. Therefore, penguins can fly.",
  ]

  const handleAnalyze = async () => {
    if (!argument.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzeArgument(argument)
      setAnalysisResult(result)
    } catch (err) {
      console.error("Analysis error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze the argument. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const setExampleArgument = (index: number) => {
    setArgument(exampleArguments[index])
    setAnalysisResult(null)
    setError(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left column - Input */}
      <div className="w-1/3 border-r p-4 flex flex-col">
        <h2 className="text-lg font-medium mb-2">Enter Your Argument</h2>
        <Textarea
          placeholder="Type or paste your argument here..."
          className="flex-1 min-h-[200px] mb-4 resize-none"
          value={argument}
          onChange={(e) => setArgument(e.target.value)}
        />
        <Button onClick={handleAnalyze} className="w-full" disabled={!argument.trim() || isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Argument"
          )}
        </Button>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

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
              <li>Connections: {analysisResult.connections.length}</li>
              <li>Conclusion: {analysisResult.conclusion}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Right column - Visualization */}
      <div className="w-2/3 p-4 flex flex-col">
        <h2 className="text-lg font-medium mb-2">Argument Visualization</h2>
        <Card className="flex-1">
          {analysisResult ? (
            <ArgumentGraph
              premises={analysisResult.premises}
              connections={analysisResult.connections}
              conclusion={analysisResult.conclusion}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {isAnalyzing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Breaking down the argument...</p>
                </div>
              ) : (
                <p>Enter an argument and click "Analyze" to see the visualization</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
