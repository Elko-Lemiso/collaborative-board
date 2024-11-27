"use client";

import Canvas from "@/components/Canvas/Canvas";
import React, { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";

export default function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id: boardId } = use(params);

  useEffect(() => {
    if (!window) return;
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !username) {
      redirect("/auth");
    }
  }, [username, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas boardId={boardId} username={username!} />
    </div>
  );
}
