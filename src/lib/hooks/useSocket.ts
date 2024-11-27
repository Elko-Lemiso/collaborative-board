import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { DrawData } from "@/lib/types/canvas";
import { StickerData } from "../types/sticker";
import { SocketHook } from "@/lib/types/socket";

export const useSocket = (): SocketHook => {
  const socketRef = useRef<Socket | null>(null);

  // Initialize the socket connection only once
  if (!socketRef.current) {
    socketRef.current = io();
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

  const updateSticker = (boardId: string, data: StickerData) => {
    socket.emit("update-sticker", boardId, data);
  };

  const deleteSticker = (boardId: string, stickerId: string) => {
    
    socket.emit("delete-sticker", boardId, stickerId);
  };

  // Adding event listeners
  const onDraw = (callback: (data: DrawData) => void) => {
    socket.on("draw", callback);
  };

  const onSticker = (callback: (data: StickerData) => void) => {
    socket.on("add-sticker", callback);
  };

  const onUpdateSticker = (callback: (data: StickerData) => void) => {
    socket.on("update-sticker", callback);
  };

  const onDeleteSticker = (callback: (stickerId: string) => void) => {
    
    socket.on("delete-sticker", callback);
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

  const offUpdateSticker = (callback: (data: StickerData) => void) => {
    socket.off("update-sticker", callback);
  };

  const offDeleteSticker = (callback: (stickerId: string) => void) => {
    
    socket.off("delete-sticker", callback);
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
    emit,
  };
};
