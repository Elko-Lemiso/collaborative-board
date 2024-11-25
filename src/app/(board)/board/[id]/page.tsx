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
      <h1>Board: {"cm3vorsbv0000wlg4h4kge4jb"}</h1>
      <Canvas boardId={"cm3vorsbv0000wlg4h4kge4jb"} username={username} />
    </div>
  );
}
