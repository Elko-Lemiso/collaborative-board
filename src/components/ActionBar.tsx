// src/components/ActionBar.tsx

import React from "react";
import { FaPen, FaStickyNote, FaHandPaper } from "react-icons/fa";

interface ActionBarProps {
  mode: string;
  setMode: (mode: string) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ mode, setMode }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMode("draw")}
        className={`px-4 py-2 rounded-md ${
          mode === "draw" ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        Draw
      </button>
      <button
        onClick={() => setMode("move")}
        className={`px-4 py-2 rounded-md ${
          mode === "move" ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        Move
      </button>
      <button
        onClick={() => setMode("select")}
        className={`px-4 py-2 rounded-md ${
          mode === "select" ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        Select
      </button>
      <button
        onClick={() => setMode("sticker")}
        className={`px-4 py-2 rounded-md ${
          mode === "sticker" ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        Sticker
      </button>
    </div>
  );
};

export default ActionBar;
