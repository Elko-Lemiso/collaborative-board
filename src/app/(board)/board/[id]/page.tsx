"use client";

import Canvas from "@/components/Canvas/Canvas";
import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function BoardPage({ params }: PageProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const boardId = params.id;

  useEffect(() => {
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
