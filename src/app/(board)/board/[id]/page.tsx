"use client";

import Canvas from "@/components/Canvas";
import React, {use} from "react";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {

  const { id: boardId } = use(params);
  // generate a random username
  const generateUsername = () => {
    return `User${Math.floor(Math.random() * 1000)}`;
  };

  const username = generateUsername();

  return (
    <div className="w-full h-full">
      <h1>Board: {boardId}</h1>
      <Canvas boardId={boardId} username={username} />
    </div>
  );
}
