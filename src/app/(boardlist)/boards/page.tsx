"use client";

import { useEffect } from "react";
import { useBoards } from "@/lib/hooks/useBoards";
import { CreateBoard } from "./CreateBoard";
import { BoardCard } from "./BoardCard";
import Image from "next/image";

export default function BoardsPage() {
  const { boards, isLoading, error, createBoard, fetchBoards } = useBoards();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Image
          src="/error.svg"
          alt="Error"
          width={400}
          height={400}
          className="dark:hidden"
        />
        <h2 className="text-2xl font-semibold mt-6">Something went wrong!</h2>
        <p className="text-muted-foreground mt-2">Failed to load boards</p>
      </div>
    );
  }

  if (!boards?.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Image
          src="/elements.svg"
          alt="Empty"
          width={400}
          height={400}
          className="dark:hidden"
        />
        <h2 className="text-2xl font-semibold mt-6">No boards found!</h2>
        <p className="text-muted-foreground mt-2">
          Create a board to get started
        </p>
        <CreateBoard />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-semibold text-gray-900">Team Boards</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
        <CreateBoard />
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            id={board.id}
            title={board.name}
            userCount={board._count?.User || 0}
            strokeCount={board._count?.strokes || 0}
            stickerCount={board._count?.stickers || 0}
          />
        ))}
      </div>
    </div>
  );
}
