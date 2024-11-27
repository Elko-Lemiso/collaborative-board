import { useState, useCallback } from "react";
import { Board } from "@/lib/types/db";

interface UseBoardsReturn {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  createBoard: (name: string) => Promise<Board | null>;
  fetchBoards: () => Promise<void>;
}

export function useBoards(): UseBoardsReturn {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/boards");

      if (!response.ok) {
        throw new Error("Failed to fetch boards");
      }

      const data = await response.json();
      setBoards(data.boards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch boards");
      console.error("Error fetching boards:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBoard = useCallback(
    async (name: string): Promise<Board | null> => {
      try {
        setError(null);

        const response = await fetch("/api/boards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error("Failed to create board");
        }

        const data = await response.json();
        setBoards((prev) => [...prev, data.board]);
        return data.board;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create board");
        console.error("Error creating board:", err);
        return null;
      }
    },
    []
  );

  return {
    boards,
    isLoading,
    error,
    createBoard,
    fetchBoards,
  };
}
