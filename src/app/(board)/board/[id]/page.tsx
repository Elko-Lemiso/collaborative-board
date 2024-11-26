"use client";

import Canvas from "@/components/Canvas";
import { useStore } from "@/lib/store";
import React from "react";

export default function BoardPage({ params }: { params: { id: string } }) {
  // generate a random username
  const generateUsername = () => {
    return `User${Math.floor(Math.random() * 1000)}`;
  };

  const username = generateUsername();

  return (
    <div className="w-full h-full">
      <h1>Board: {"cm3z2sokz0000cw7b5fmt114k"}</h1>
      <Canvas boardId={"cm3z2sokz0000cw7b5fmt114k"} username={username} />
    </div>
  );
}
