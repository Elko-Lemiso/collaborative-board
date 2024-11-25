// src/lib/hooks/useSocket.ts

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { DrawData } from "../types/socket";
import { StickerData } from "../types/sticker";

interface SocketHook {
  joinBoard: (boardId: string, username: string) => void;
  leaveBoard: (boardId: string) => void;
  drawOnBoard: (boardId: string, data: DrawData) => void;
  addSticker: (boardId: string, data: StickerData) => void;
  onDraw: (callback: (data: DrawData) => void) => void;
  offDraw: (callback: (data: DrawData) => void) => void;
  onSticker: (callback: (data: StickerData) => void) => void;
  offSticker: (callback: (data: StickerData) => void) => void;
  onUserJoined: (callback: (data: { username: string }) => void) => void;
  offUserJoined: (callback: (data: { username: string }) => void) => void;
  onUserLeft: (callback: (data: { username: string }) => void) => void;
  offUserLeft: (callback: (data: { username: string }) => void) => void;
  emit: (event: string, data: unknown) => void;
}

export const useSocket = (): SocketHook => {
  const socketRef = useRef<Socket | null>(null);

  // Initialize the socket connection only once
  if (!socketRef.current) {
    socketRef.current = io(); // You can pass the server URL here if different from the client
  }

  useEffect(() => {
    const socket = socketRef.current;

    // Cleanup function to disconnect socket on component unmount
    return () => {
      socket?.disconnect();
    };
  }, []);

  const socket = socketRef.current!; // Non-null assertion since we initialize it above

  // Socket event handlers
  const joinBoard = (boardId: string, username: string) => {
    socket.emit("join-board", { boardId, username });
  };

  const leaveBoard = (boardId: string) => {
    socket.emit("leave-board", { boardId });
  };

  const drawOnBoard = (boardId: string, data: DrawData) => {
    socket.emit("draw", boardId, data);
  };

  const addSticker = (boardId: string, data: StickerData) => {
    socket.emit("add-sticker", boardId, data);
  };

  // Adding event listeners
  const onDraw = (callback: (data: DrawData) => void) => {
    socket.on("draw", callback);
  };

  const onSticker = (callback: (data: StickerData) => void) => {
    socket.on("add-sticker", callback);
  };

  const onUserJoined = (callback: (data: { username: string }) => void) => {
    socket.on("user-joined", callback);
  };

  const onUserLeft = (callback: (data: { username: string }) => void) => {
    socket.on("user-left", callback);
  };

  // Removing event listeners
  const offDraw = (callback: (data: DrawData) => void) => {
    socket.off("draw", callback);
  };

  const offSticker = (callback: (data: StickerData) => void) => {
    socket.off("add-sticker", callback);
  };

  const offUserJoined = (callback: (data: { username: string }) => void) => {
    socket.off("user-joined", callback);
  };

  const offUserLeft = (callback: (data: { username: string }) => void) => {
    socket.off("user-left", callback);
  };

  const emit = (event: string, data: unknown) => {
    socket.emit(event, data);
  };

  return {
    joinBoard,
    leaveBoard,
    drawOnBoard,
    addSticker,
    onDraw,
    offDraw,
    onSticker,
    offSticker,
    onUserJoined,
    offUserJoined,
    onUserLeft,
    offUserLeft,
    emit,
  };
};
