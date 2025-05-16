import { useState } from "react";
import { Citation, Premise } from "../argument-analyzer";
import {
    ExternalLink,
    Info,
    List,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Handle, Position } from "reactflow";

export function PremiseNode({
    data,
}: {
    data: {
        premise: Premise;
        onViewConnections?: () => void;
        onCitationClick?: (citation: Citation) => void;
    };
}) {
    const { premise, onViewConnections, onCitationClick } = data;
    const [showTheories, setShowTheories] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="cursor-pointer rounded-md overflow-hidden">
            <div
                className="flex items-center justify-between p-2 border-b border-gray-200"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-1">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                        {premise.title || premise.text.substring(0, 50)}
                    </span>
                </div>
                {premise.supportingTheories &&
                    premise.supportingTheories.length > 0 && (
                        <Info
                            className="h-4 w-4 text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTheories(!showTheories);
                            }}
                        />
                    )}
            </div>

            {isExpanded && (
                <div className="p-2">
                    <div className="text-xs text-gray-700 mb-2">
                        {premise.text}
                    </div>

                    {premise.citations && premise.citations.length > 0 && (
                        <div className="mt-2">
                            <h4 className="text-xs font-semibold text-gray-600 mb-1">
                                Citations:
                            </h4>
                            <div className="space-y-1">
                                {premise.citations.map((citation, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCitationClick &&
                                                onCitationClick(citation);
                                        }}
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        <span>
                                            Lines {citation.lineNumbers}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {premise.childAssumptions &&
                        premise.childAssumptions.length > 0 && (
                            <div className="mt-2">
                                <h4 className="text-xs font-semibold text-gray-600 mb-1">
                                    Contains:
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {premise.childAssumptions.map((id) => (
                                        <Badge
                                            key={id}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {id}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                    <div className="flex justify-between mt-3">
                        <div className="text-xs py-1 px-2 bg-gray-100 rounded-full text-gray-600 capitalize">
                            {premise.type}
                        </div>

                        <button
                            className="text-xs py-1 px-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewConnections && onViewConnections();
                            }}
                        >
                            <List className="h-3 w-3" />
                            Viewing Connections
                        </button>
                    </div>
                </div>
            )}

            {showTheories && premise.supportingTheories && (
                <div className="p-2 bg-blue-50 text-xs border-t border-blue-200">
                    <h4 className="font-semibold mb-1">Supporting Theories:</h4>
                    {premise.supportingTheories.map((theory, idx) => (
                        <div key={idx} className="mb-1">
                            <span className="font-medium">{theory.name}: </span>
                            <span>{theory.description}</span>
                        </div>
                    ))}
                </div>
            )}
            <Handle
                type="target"
                position={Position.Top}
                // onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={true}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={true}
            />
        </div>
    );
}
