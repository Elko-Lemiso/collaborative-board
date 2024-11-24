// app/boards/[id]/page.tsx
"use client";

import { Canvas } from "@/components/Canvas";
import { useStore } from "@/lib/store";
import React from "react";

export default function BoardPage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  // generate a random username
  const generateUsername = () => {
    return `User${Math.floor(Math.random() * 1000)}`;
  };

  const username = generateUsername();

  return (
    <div className="w-full h-full">
      <h1>Board: {id}</h1>
      <Canvas boardId={id} username={username} />
    </div>
  );
}
