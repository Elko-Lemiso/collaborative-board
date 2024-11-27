// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { DrawData } from "@/lib/types/canvas";
import { StickerData } from "../types/sticker";
import { SocketHook } from "@/lib/types/socket";

export const useSocket = (): SocketHook => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Initialize the socket connection only once per hook instance
  if (!socketRef.current) {
    socketRef.current = io(); // You can pass options here if needed
  }

  const socket = socketRef.current;

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial connection state
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect(); // Disconnect when the hook unmounts
    };
  }, [socket]);

  // Error handling
  useEffect(() => {
    const handleJoinError = (error: { message: string }) => {
      setJoinError(error.message);
      socket.disconnect(); // Disconnect socket on error
    };

    socket.on("join-error", handleJoinError);

    return () => {
      socket.off("join-error", handleJoinError);
    };
  }, [socket]);

  // Socket event handlers
  const joinBoard = useCallback(
    (boardId: string, username: string) => {
      if (!isConnected) {
        console.log("Socket not connected, attempting to reconnect...");
        socket.connect();
      }
      console.log(`Joining board ${boardId} as ${username}`);
      socket.emit("join-board", { boardId, username });
    },
    [socket, isConnected]
  );

  const leaveBoard = useCallback(
    (boardId: string) => {
      socket.emit("leave-board", { boardId });
    },
    [socket]
  );

  const drawOnBoard = useCallback(
    (boardId: string, data: DrawData) => {
      socket.emit("draw", boardId, data);
    },
    [socket]
  );

  const addSticker = useCallback(
    (boardId: string, data: StickerData) => {
      socket.emit("add-sticker", boardId, data);
    },
    [socket]
  );

  const updateSticker = useCallback(
    (boardId: string, data: StickerData) => {
      socket.emit("update-sticker", boardId, data);
    },
    [socket]
  );

  const deleteSticker = useCallback(
    (boardId: string, stickerId: string) => {
      socket.emit("delete-sticker", boardId, stickerId);
    },
    [socket]
  );

  // Adding event listeners
  const onDraw = useCallback(
    (callback: (data: DrawData) => void) => {
      socket.on("draw", callback);
    },
    [socket]
  );

  const onSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      socket.on("add-sticker", callback);
    },
    [socket]
  );

  const onUpdateSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      socket.on("update-sticker", callback);
    },
    [socket]
  );

  const onDeleteSticker = useCallback(
    (callback: (stickerId: string) => void) => {
      socket.on("delete-sticker", callback);
    },
    [socket]
  );

  const onUserJoined = useCallback(
    (callback: (data: { username: string }) => void) => {
      socket.on("user-joined", callback);
    },
    [socket]
  );

  const onUserLeft = useCallback(
    (callback: (data: { username: string }) => void) => {
      socket.on("user-left", callback);
    },
    [socket]
  );

  // Removing event listeners
  const offDraw = useCallback(
    (callback: (data: DrawData) => void) => {
      socket.off("draw", callback);
    },
    [socket]
  );

  const offSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      socket.off("add-sticker", callback);
    },
    [socket]
  );

  const offUpdateSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      socket.off("update-sticker", callback);
    },
    [socket]
  );

  const offDeleteSticker = useCallback(
    (callback: (stickerId: string) => void) => {
      socket.off("delete-sticker", callback);
    },
    [socket]
  );

  const offUserJoined = useCallback(
    (callback: (data: { username: string }) => void) => {
      socket.off("user-update", callback);
    },
    [socket]
  );

  const offUserLeft = useCallback(
    (callback: (data: { username: string }) => void) => {
      socket.off("user-left", callback);
    },
    [socket]
  );

  const onUsersUpdate = useCallback(
    (callback: (users: string[]) => void) => {
      socket.on("users-update", callback);
      console.log("Listening for users-update");
    },
    [socket]
  );

  const offUsersUpdate = useCallback(
    (callback: (users: string[]) => void) => {
      socket.off("users-update", callback);
    },
    [socket]
  );

  return {
    isConnected,
    joinBoard,
    leaveBoard,
    drawOnBoard,
    addSticker,
    updateSticker,
    deleteSticker,
    onDraw,
    offDraw,
    onSticker,
    offSticker,
    onUpdateSticker,
    offUpdateSticker,
    onDeleteSticker,
    offDeleteSticker,
    onUserJoined,
    offUserJoined,
    onUserLeft,
    offUserLeft,
    onUsersUpdate,
    offUsersUpdate,
    joinError,
  };
};
