export type Premise = {
    id: string;
    text: string;
    title: string;
    type: "axiom" | "assumption" | "intermediate" | "conclusion";
    citations?: Citation[];
    supportingTheories?: Theory[];
    childAssumptions?: string[]; // IDs of child assumptions if this is broken down
};

export type Citation = {
    lineNumbers: string; // Format like "142-143, 148-151"
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
