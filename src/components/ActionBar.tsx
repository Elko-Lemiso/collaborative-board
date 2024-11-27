import React from "react";
import { Pencil, Move, Pointer, Image, Eraser, TextQuoteIcon, Shapes } from "lucide-react";
import { CanvasMode } from "@/lib/types/canvas";

interface ActionBarProps {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ mode, setMode }) => {
  const tools = [
    { id: "select" as CanvasMode, icon: Pointer, label: "Select" },
    { id: "draw" as CanvasMode, icon: Pencil, label: "Draw" },
    { id: "move" as CanvasMode, icon: Move, label: "Move" },
    { id: "sticker" as CanvasMode, icon: Image, label: "Add Sticker" },
  ];

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center 
                    gap-2 bg-white rounded-lg shadow-md p-2 border border-gray-200 z-10"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            className={`p-2 rounded-lg transition-colors
              ${
                mode === tool.id
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            onClick={() => setMode(tool.id)}
            title={tool.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
};

export default ActionBar;
