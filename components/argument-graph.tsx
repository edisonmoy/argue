"use client";

import { useMemo, useState } from "react";
import ReactFlow, {
    type Node,
    type Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Premise, Connection, Citation } from "./argument-analyzer";

import { PremiseNode } from "@/components/ui/premise-node";
import { ConnectionEdge } from "./ui/graph-edge";

type ArgumentGraphProps = {
    premises: Premise[];
    connections: Connection[];
    conclusion: string;
};

// Custom node styles based on premise type
const getNodeStyle = (type: string) => {
    switch (type) {
        case "axiom":
            return {
                border: "2px solid #22c55e",
                backgroundColor: "#dcfce7",
                padding: "10px",
                borderRadius: "8px",
                width: "220px",
            };
        case "assumption":
            return {
                border: "2px solid #f59e0b",
                backgroundColor: "#fef3c7",
                padding: "10px",
                borderRadius: "8px",
                width: "220px",
            };
        case "intermediate":
            return {
                border: "2px solid #3b82f6",
                backgroundColor: "#dbeafe",
                padding: "10px",
                borderRadius: "8px",
                width: "220px",
            };
        case "conclusion":
            return {
                border: "2px solid #8b5cf6",
                backgroundColor: "#f3e8ff",
                fontWeight: "bold",
                padding: "10px",
                borderRadius: "8px",
                width: "220px",
            };
        default:
            return {
                padding: "10px",
                borderRadius: "8px",
                width: "220px",
            };
    }
};

const nodeTypes = {
    premiseNode: PremiseNode,
};

const edgeTypes = {
    custom: ConnectionEdge,
};

export function ArgumentGraph({
    premises,
    connections,
    conclusion,
    sourceText,
}: ArgumentGraphProps & { sourceText?: string }) {
    const [highlightedConnections, setHighlightedConnections] = useState<
        Set<string>
    >(new Set());
    const [focusedCitation, setFocusedCitation] = useState<Citation | null>(
        null
    );

    const highlightConnectionsForNode = (nodeId: string) => {
        const relatedConnections = new Set<string>();

        // Find all connections where this node is source or target
        connections.forEach((conn) => {
            if (conn.source === nodeId || conn.target === nodeId) {
                relatedConnections.add(conn.id);
            }
        });

        setHighlightedConnections(relatedConnections);
    };

    const handleCitationClick = (citation: Citation) => {
        setFocusedCitation(citation);
        // Implement scrolling to the citation in the source text view
    };

    // Create nodes from premises
    const initialNodes: Node[] = useMemo(() => {
        // First, create a map to track levels
        const nodeMap = new Map<string, { level: number; visited: boolean }>();

        // Initialize all nodes at level 0 and not visited
        premises.forEach((premise) => {
            nodeMap.set(premise.id, { level: 0, visited: false });
        });

        // Function to calculate node levels (depth-first)
        const calculateLevels = (nodeId: string, currentLevel: number) => {
            const nodeInfo = nodeMap.get(nodeId);
            if (!nodeInfo || nodeInfo.visited) return;

            // Update level if current path is deeper
            if (currentLevel > nodeInfo.level) {
                nodeInfo.level = currentLevel;
            }

            nodeInfo.visited = true;

            // Find all connections where this node is the source
            const outgoingConnections = connections.filter(
                (c) => c.source === nodeId
            );

            // Recursively calculate levels for target nodes
            outgoingConnections.forEach((conn) => {
                calculateLevels(conn.target, currentLevel + 1);
            });

            nodeInfo.visited = false; // Reset for potential other paths
        };

        // Calculate levels starting from nodes with no incoming connections
        const nodesWithNoIncoming = premises
            .filter((p) => !connections.some((c) => c.target === p.id))
            .map((p) => p.id);

        nodesWithNoIncoming.forEach((nodeId) => {
            calculateLevels(nodeId, 0);
        });

        // Get the maximum level
        let maxLevel = 0;
        nodeMap.forEach((info) => {
            if (info.level > maxLevel) maxLevel = info.level;
        });

        // Create nodes with positions based on levels
        return premises.map((premise) => {
            const nodeInfo = nodeMap.get(premise.id) || {
                level: 0,
                visited: false,
            };
            const isConclusion =
                premise.id === "conclusion" || premise.type === "conclusion";

            // If it's the conclusion, place it at the bottom
            const level = isConclusion ? maxLevel + 1 : nodeInfo.level;

            // Count nodes at this level for horizontal positioning
            const nodesAtSameLevel = premises.filter((p) => {
                const info = nodeMap.get(p.id);
                return info && info.level === level && p.type !== "conclusion";
            });

            // Position nodes in a grid based on their level
            const levelWidth = Math.min(nodesAtSameLevel.length, 4) * 250;
            const levelStart = 500 - levelWidth / 2;

            const indexAtLevel = isConclusion
                ? 0
                : nodesAtSameLevel.findIndex((p) => p.id === premise.id);

            // For conclusion, center it
            const xPosition = isConclusion
                ? 500 - 110 // Center the conclusion (half of node width)
                : levelStart + (indexAtLevel % 4) * 250;

            const yPosition = level * 150 + 50;

            return {
                id: premise.id,
                type: "premiseNode",
                data: {
                    premise,
                    onViewConnections: () =>
                        highlightConnectionsForNode(premise.id),
                    onCitationClick: handleCitationClick,
                },
                position: { x: xPosition, y: yPosition },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                style: getNodeStyle(premise.type),
            };
        });
    }, [premises, connections]);

    const initialEdges: Edge[] = useMemo(() => {
        const validNodeIds = new Set(premises.map((premise) => premise.id));
        console.log("validNodeIds", validNodeIds);

        return connections
            .filter(
                (connection) =>
                    validNodeIds.has(connection.source) &&
                    validNodeIds.has(connection.target)
            )
            .map((connection) => {
                const isHighlighted = highlightedConnections.has(connection.id);

                return {
                    id: connection.id,
                    source: connection.source,
                    target: connection.target,
                    animated: isHighlighted,
                    type: "custom",
                    data: {
                        strength: connection.strength || "moderate",
                        label: isHighlighted ? connection.strength || "" : "",
                    },
                    style: {
                        stroke: isHighlighted ? "#3b82f6" : "#64748b",
                        strokeWidth: isHighlighted ? 3 : 2,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: isHighlighted ? "#3b82f6" : "#64748b",
                    },
                };
            });
    }, [connections, highlightedConnections, premises]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <Background />
                <Controls />
            </ReactFlow>

            {focusedCitation && (
                <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-md shadow-lg border border-gray-200 max-h-32 overflow-y-auto">
                    <div className="flex justify-between">
                        <h4 className="text-sm font-semibold mb-1">
                            Citation - Lines {focusedCitation.lineNumbers}
                        </h4>
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setFocusedCitation(null)}
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-xs">{focusedCitation.text}</p>
                </div>
            )}
        </div>
    );
}
