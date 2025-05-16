"use server";

import type { AnalysisResult } from "@/components/argument-analyzer";

const SYSTEM_PROMPT = `You are an expert in logic and argument analysis. Your task is to break down arguments into their logical components and provide rich supporting information.

IMPORTANT: You MUST respond with ONLY a valid JSON object and nothing else. No explanations, no text before or after the JSON.

The JSON must follow this exact format:
{
  "premises": [
    {
      "id": "p1",
      "text": "All humans are mortal",
      "title": "Humans are mortal", // Short title summary (5 words or less)
      "type": "axiom", // can be "axiom", "assumption", or "intermediate"
      "citations": [
        {
          "lineNumbers": "1-2", // Line numbers in the source text that support this premise
          "text": "The text from those lines, verbatim"
        }
      ],
      "supportingTheories": [
        {
          "name": "Law of Identity", // Name of relevant philosophical or logical theory
          "description": "Brief explanation of how this theory supports the premise"
        }
      ],
      "childAssumptions": ["a1", "a2"] // IDs of sub-assumptions that make up this premise, if applicable
    }
    // more premises...
  ],
  "connections": [
    {
      "id": "c1",
      "source": "p1", // premise id that serves as the source
      "target": "p2", // premise id that serves as the target
      "strength": "strong" // can be "strong", "moderate", or "weak"
    }
    // more connections...
  ],
  "conclusion": "Socrates is mortal" // The main conclusion of the argument
}

Definitions:
- Axioms: Self-evident truths that need no proof
- Assumptions: Statements accepted as true for the sake of argument
- Intermediate conclusions: Logical steps that lead to the final conclusion
- Title: A concise summary (5 words or less) capturing the essence of the premise
- Citations: References to specific parts of the source text that support the premise
- Supporting Theories: Relevant philosophical, logical, or scientific theories that validate the premise
- Child Assumptions: For complex premises, these are the smaller components or sub-claims
- Connection Strength: How strongly one premise supports another (strong, moderate, weak)

Make sure all connections form a directed acyclic graph (DAG) that leads to the conclusion.
The conclusion should be included as the final node in the premises array with type "conclusion" and id "conclusion".
Ensure that every premise is connected to at least one other premise or the conclusion.

For philosophical arguments, reference established theories like Aristotelian logic, Kantian ethics, utilitarianism, etc.
For evidence-based arguments, indicate the strength of connections based on the quality of evidence.

When assigning IDs, use meaningful prefixes:
- A(number)_(name) for assumptions (e.g., "A1_FreeWill")
- L(number)_(name) for logical statements (e.g., "L2_CausalRelation")
- C(number)_(name) for claims (e.g., "C3_MindsetForOto1")`;

export async function analyzeArgument(
    argumentText: string
): Promise<AnalysisResult> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured");
    }

    try {
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://vercel.com",
                    "X-Title": "Argument Analysis Visualizer",
                },
                body: JSON.stringify({
                    model: "openrouter/auto",
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT,
                        },
                        {
                            role: "user",
                            content: `Analyze this argument and respond ONLY with the JSON format specified in the instructions: "${argumentText}"`,
                        },
                    ],
                    response_format: { type: "json_object" },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: "Unknown error" }));
            console.error("OpenRouter API error:", errorData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", JSON.stringify(data));

        // Check if the expected properties exist
        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error("Unexpected API response structure:", data);
            throw new Error("Invalid response format from API");
        }

        // Get the content from the response
        const content = data.choices[0].message.content;
        if (!content) {
            throw new Error("Empty response from API");
        }

        // Try to parse the JSON from the content
        let result;
        try {
            // First, try direct parsing in case it's already JSON
            if (typeof content === "object") {
                result = content;
            } else {
                // If it's a string, try to extract JSON from it
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON object found in response");
                }
            }
        } catch (parseError) {
            console.error(
                "Error parsing JSON response:",
                parseError,
                "Content:",
                content
            );
            throw new Error("Failed to parse the analysis result");
        }

        // Validate the result has the expected structure
        if (
            !result.premises ||
            !Array.isArray(result.premises) ||
            !result.connections ||
            !Array.isArray(result.connections) ||
            !result.conclusion
        ) {
            console.error("Invalid result structure:", result);
            throw new Error(
                "The analysis result is not in the expected format"
            );
        }

        // Ensure the conclusion is included in the premises array
        const conclusionExists = result.premises.some(
            (p: any) => p.id === "conclusion" || p.type === "conclusion"
        );

        if (!conclusionExists && result.conclusion) {
            result.premises.push({
                id: "conclusion",
                text: result.conclusion,
                type: "conclusion",
            });
        }

        return result as AnalysisResult;
    } catch (error) {
        console.error("Error analyzing argument:", error);
        throw new Error(
            `Failed to analyze the argument: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
