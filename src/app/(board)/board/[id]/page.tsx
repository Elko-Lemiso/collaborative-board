// app/boards/[id]/page.tsx
"use client";

import { Canvas } from "@/components/Canvas";
import { useStore } from "@/lib/store";
import React from "react";

export default function BoardPage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const username = "Jimmy Boy";

  return (
    <div className="w-full h-full">
      <h1>Board: {id}</h1>
      <Canvas boardId={id} username={username} />
    </div>
  );
}
