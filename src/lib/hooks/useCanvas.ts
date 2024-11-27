/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { useTransform } from "./useTransform";
import { useDrawing } from "./useDrawing";
import { useStickers } from "./useStickers";
import { CanvasRenderer } from "../services/CanvasRenderer";
import { UseCanvasReturn } from "@/lib/types/hooks";
import { StickerData } from "../types";

const config = {
  VIRTUAL_SIZE: 10000,
  CENTER_OFFSET: 5000,
  GRID_SIZE: 40,
};

export const useCanvas = (
  boardId: string,
  username: string
): UseCanvasReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const isInitialized = useRef(false);

  const socket = useSocket();

  // Initialize sub-hook for transform handling
  const { transform, handleWheel, handlePanStart, handlePanMove } =
    useTransform({
      canvasRef,
    });

  // Grid drawing and main render loop function
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !rendererRef.current) return;

    rendererRef.current.clear();
    rendererRef.current.drawGrid(transform);

    if (drawingCanvasRef.current) {
      rendererRef.current.drawStrokes(drawingCanvasRef.current, transform);
    }

    rendererRef.current.drawStickers(loadedStickersRef.current, transform);
  }, [transform]);

  // Initialize sub-hook for drawing
  const { isDrawing, drawingCanvasRef, startDrawing, draw, stopDrawing } =
    useDrawing({
      boardId,
      transform,
      config,
      socket,
      canvasRef,
      onDraw: drawGrid,
    });

  // Initialize sub-hook for stickers
  const {
    selectedSticker,
    setSelectedSticker,
    isResizing,
    loadedStickersRef,
    handleStickerDragStart,
    handleStickerResize,
    handleDeleteSticker,
    addSticker,
    loadStickerImage,
    handleCanvasClick,
  } = useStickers({
    boardId,
    transform,
    config,
    socket,
    canvasRef,
    onUpdate: drawGrid,
  });

  // Initialize canvas and socket connection
  useEffect(() => {
    if (!canvasRef.current || isInitialized.current) return;

    isInitialized.current = true;
    socket.joinBoard(boardId, username);

    return () => {
      socket.leaveBoard(boardId);
    };
  }, [boardId, username, socket]);

  // Handle sticker socket events
  useEffect(() => {
    const handleSticker = async (sticker: StickerData) => {
      await loadStickerImage(sticker);
      requestAnimationFrame(drawGrid);
    };

    const handleStickerUpdate = (sticker: StickerData) => {
      const existing = loadedStickersRef.current.get(sticker.id);
      if (existing) {
        loadedStickersRef.current.set(sticker.id, {
          ...sticker,
          imageElement: existing.imageElement,
        });
        requestAnimationFrame(drawGrid);
      }
    };

    const handleStickerDelete = (stickerId: string) => {
      loadedStickersRef.current.delete(stickerId);
      requestAnimationFrame(drawGrid);
    };

    socket.onSticker(handleSticker);
    socket.onUpdateSticker(handleStickerUpdate);
    socket.onDeleteSticker(handleStickerDelete);

    return () => {
      socket.offSticker(handleSticker);
      socket.offUpdateSticker(handleStickerUpdate);
      socket.offDeleteSticker(handleStickerDelete);
    };
  }, [socket, loadStickerImage, drawGrid]);

  // Canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    rendererRef.current = new CanvasRenderer(ctx, config);

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawGrid();
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 200);
    };

    window.addEventListener("resize", debouncedResize);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    drawGrid();

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [drawGrid, handleWheel]);

  return {
    canvasRef,
    transform,
    isDrawing,
    selectedSticker,
    setSelectedSticker,
    isResizing,
    startDrawing,
    draw,
    stopDrawing,
    handlePanStart,
    handlePanMove,
    handleStickerDragStart,
    handleStickerResize,
    handleDeleteSticker,
    addSticker,
    drawGrid,
    loadedStickersRef,
    handleCanvasClick,
  };
};

export default useCanvas;
