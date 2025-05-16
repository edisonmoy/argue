export const ConnectionEdge = ({
    id,
    style,
    data,
    sourceX,
    sourceY,
    targetX,
    targetY,
}: any) => {
    const strength = data?.strength || "moderate";

    if (
        sourceX == null ||
        sourceY == null ||
        targetX == null ||
        targetY == null
    ) {
        console.warn(
            `Missing positions for edge ${id}, source: ${sourceX},${sourceY}, target: ${targetX},${targetY}`
        );
        return null;
    }

    const getEdgeColor = () => {
        switch (strength) {
            case "strong":
                return "#22c55e";
            case "weak":
                return "#ef4444";
            default:
                return "#64748b";
        }
    };

    const getEdgeStyle = () => {
        switch (strength) {
            case "strong":
                return { strokeWidth: 3, stroke: getEdgeColor() };
            case "weak":
                return {
                    strokeWidth: 1,
                    stroke: getEdgeColor(),
                    strokeDasharray: "5,5",
                };
            default:
                return { strokeWidth: 2, stroke: getEdgeColor() };
        }
    };

    return (
        <g>
            <path
                id={id}
                style={{ ...style, ...getEdgeStyle() }}
                className="react-flow__edge-path"
                d={`M${sourceX},${sourceY} C${sourceX},${
                    sourceY + 50
                } ${targetX},${targetY - 50} ${targetX},${targetY}`}
            />
            <text>
                <textPath
                    href={`#${id}`}
                    style={{ fontSize: 10 }}
                    startOffset="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {data?.label}
                </textPath>
            </text>
        </g>
    );
};
