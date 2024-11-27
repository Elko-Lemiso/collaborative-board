import { useState, useCallback } from "react";
import { Board } from "@/lib/types/db";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/auth");
        return;
      }

      const response = await fetch("/api/boards", {
        headers: {
          "x-username": username,
        },
      });

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
        const username = localStorage.getItem("username");

        if (!username) {
          router.push("/auth");
          return null;
        }

        const response = await fetch("/api/boards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-username": username,
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error("Failed to create board");
        }

        const data = await response.json();
        router.push(`/board/${data.board.id}`);
        return data.board;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create board");
        console.error("Error creating board:", err);
        return null;
      }
    },
    [router]
  );

  return {
    boards,
    isLoading,
    error,
    createBoard,
    fetchBoards,
  };
}
