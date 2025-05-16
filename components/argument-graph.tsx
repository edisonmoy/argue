"use client"

import { useEffect, useMemo } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import type { Premise, Connection } from "./argument-analyzer"

type ArgumentGraphProps = {
  premises: Premise[]
  connections: Connection[]
  conclusion: string
}

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
      }
    case "assumption":
      return {
        border: "2px solid #f59e0b",
        backgroundColor: "#fef3c7",
        padding: "10px",
        borderRadius: "8px",
        width: "220px",
      }
    case "intermediate":
      return {
        border: "2px solid #3b82f6",
        backgroundColor: "#dbeafe",
        padding: "10px",
        borderRadius: "8px",
        width: "220px",
      }
    case "conclusion":
      return {
        border: "2px solid #8b5cf6",
        backgroundColor: "#f3e8ff",
        fontWeight: "bold",
        padding: "10px",
        borderRadius: "8px",
        width: "220px",
      }
    default:
      return {
        padding: "10px",
        borderRadius: "8px",
        width: "220px",
      }
  }
}

export function ArgumentGraph({ premises, connections, conclusion }: ArgumentGraphProps) {
  // Create nodes from premises
  const initialNodes: Node[] = useMemo(() => {
    // First, create a map to track levels
    const nodeMap = new Map<string, { level: number; visited: boolean }>()

    // Initialize all nodes at level 0 and not visited
    premises.forEach((premise) => {
      nodeMap.set(premise.id, { level: 0, visited: false })
    })

    // Function to calculate node levels (depth-first)
    const calculateLevels = (nodeId: string, currentLevel: number) => {
      const nodeInfo = nodeMap.get(nodeId)
      if (!nodeInfo || nodeInfo.visited) return

      // Update level if current path is deeper
      if (currentLevel > nodeInfo.level) {
        nodeInfo.level = currentLevel
      }

      nodeInfo.visited = true

      // Find all connections where this node is the source
      const outgoingConnections = connections.filter((c) => c.source === nodeId)

      // Recursively calculate levels for target nodes
      outgoingConnections.forEach((conn) => {
        calculateLevels(conn.target, currentLevel + 1)
      })

      nodeInfo.visited = false // Reset for potential other paths
    }

    // Calculate levels starting from nodes with no incoming connections
    const nodesWithNoIncoming = premises.filter((p) => !connections.some((c) => c.target === p.id)).map((p) => p.id)

    nodesWithNoIncoming.forEach((nodeId) => {
      calculateLevels(nodeId, 0)
    })

    // Get the maximum level
    let maxLevel = 0
    nodeMap.forEach((info) => {
      if (info.level > maxLevel) maxLevel = info.level
    })

    // Create nodes with positions based on levels
    return premises.map((premise) => {
      const nodeInfo = nodeMap.get(premise.id) || { level: 0, visited: false }
      const isConclusion = premise.id === "conclusion" || premise.type === "conclusion"

      // If it's the conclusion, place it at the bottom
      const level = isConclusion ? maxLevel + 1 : nodeInfo.level

      // Count nodes at this level for horizontal positioning
      const nodesAtLevel =
        premises.filter((p) => {
          const info = nodeMap.get(p.id)
          return info && info.level === level && p.id !== premise.id && p.type !== "conclusion"
        }).length + 1

      // Position nodes in a grid based on their level
      const levelWidth = Math.min(nodesAtLevel, 4) * 250
      const levelStart = 500 - levelWidth / 2

      const nodesAtSameLevel = premises.filter((p) => {
        const info = nodeMap.get(p.id)
        return info && info.level === level && p.type !== "conclusion"
      })

      const indexAtLevel = isConclusion ? 0 : nodesAtSameLevel.findIndex((p) => p.id === premise.id)

      // For conclusion, center it
      const xPosition = isConclusion
        ? 500 - 110 // Center the conclusion (half of node width)
        : levelStart + (indexAtLevel % 4) * 250

      const yPosition = level * 150 + 50

      return {
        id: premise.id,
        type: "default",
        data: {
          label: (
            <div>
              <div className="text-sm font-medium">{premise.text}</div>
              <div className="text-xs mt-1 text-muted-foreground capitalize">{premise.type}</div>
            </div>
          ),
        },
        position: { x: xPosition, y: yPosition },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: getNodeStyle(premise.type),
      }
    })
  }, [premises, connections])

  // Create edges from connections
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      animated: true,
      style: { stroke: "#64748b", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#64748b",
      },
    }))
  }, [connections])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [premises, connections, conclusion, setNodes, setEdges, initialNodes, initialEdges])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={true}
      >
        <Background color="#f1f5f9" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
