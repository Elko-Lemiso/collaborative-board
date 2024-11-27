import { useCallback, useRef, useState, useEffect } from "react";
import { Transform, Point, CanvasConfig } from "../types/canvas";
import { StickerData, LoadedSticker } from "../types/sticker";
import { SocketHook } from "@/lib/types";

interface UseStickersProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: SocketHook;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onUpdate?: () => void;
}

export function useStickers({
  boardId,
  transform,
  config,
  socket,
  canvasRef,
  onUpdate,
}: UseStickersProps) {
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(
    null
  );
  const [isResizing, setIsResizing] = useState(false);
  const loadedStickersRef = useRef<Map<string, LoadedSticker>>(new Map());
  const isDragging = useRef(false);
  const dragStartPos = useRef<Point>({ x: 0, y: 0 });
  const originalStickerPos = useRef<Point>({ x: 0, y: 0 });

  // Load initial stickers
  useEffect(() => {
    const loadInitialStickers = async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}/stickers`);
        if (!response.ok) return;
        const stickers = await response.json();
        await Promise.all(stickers.map(loadStickerImage));
        if (onUpdate) requestAnimationFrame(onUpdate);
      } catch (error) {
        console.error("Failed to load stickers:", error);
      }
    };

    loadInitialStickers();
  }, [boardId]);

  const loadStickerImage = useCallback(
    async (sticker: StickerData): Promise<LoadedSticker> => {
      return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
          const loadedSticker: LoadedSticker = {
            ...sticker,
            imageElement: image,
          };
          loadedStickersRef.current.set(sticker.id, loadedSticker);
          resolve(loadedSticker);
        };

        image.onerror = () => {
          console.error(`Failed to load sticker image: ${sticker.imageUrl}`);
          resolve(sticker);
        };

        image.src = sticker.imageUrl;
      });
    },
    []
  );
  // Socket event handlers
  useEffect(() => {
    const handleNewSticker = async (sticker: StickerData) => {
      await loadStickerImage(sticker);
      if (onUpdate) requestAnimationFrame(onUpdate);
    };

    const handleUpdateSticker = (sticker: StickerData) => {
      const existing = loadedStickersRef.current.get(sticker.id);
      if (existing) {
        loadedStickersRef.current.set(sticker.id, {
          ...sticker,
          imageElement: existing.imageElement,
        });
        if (selectedSticker?.id === sticker.id) {
          setSelectedSticker(sticker);
        }
        if (onUpdate) requestAnimationFrame(onUpdate);
      }
    };

    const handleDeleteSticker = (stickerId: string) => {
      loadedStickersRef.current.delete(stickerId);
      if (selectedSticker?.id === stickerId) {
        setSelectedSticker(null);
      }
      if (onUpdate) requestAnimationFrame(onUpdate);
    };

    socket.onSticker(handleNewSticker);
    socket.onUpdateSticker(handleUpdateSticker);
    socket.onDeleteSticker(handleDeleteSticker);

    return () => {
      socket.offSticker(handleNewSticker);
      socket.offUpdateSticker(handleUpdateSticker);
      socket.offDeleteSticker(handleDeleteSticker);
    };
  }, [socket, selectedSticker, onUpdate, loadStickerImage]);

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      return {
        x:
          (screenX - rect.left - transform.x) / transform.scale +
          config.CENTER_OFFSET,
        y:
          (screenY - rect.top - transform.y) / transform.scale +
          config.CENTER_OFFSET,
      };
    },
    [canvasRef, transform, config.CENTER_OFFSET]
  );

  const handleStickerDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedSticker || isResizing || e.button !== 0) return;

      e.stopPropagation();
      isDragging.current = true;

      const canvasPoint = screenToCanvas(e.clientX, e.clientY);
      dragStartPos.current = canvasPoint;
      originalStickerPos.current = {
        x: selectedSticker.x,
        y: selectedSticker.y,
      };

      const handleDragMove = (moveEvent: MouseEvent) => {
        if (!selectedSticker || !isDragging.current) return;

        const currentPoint = screenToCanvas(
          moveEvent.clientX,
          moveEvent.clientY
        );
        const dx = currentPoint.x - dragStartPos.current.x;
        const dy = currentPoint.y - dragStartPos.current.y;

        const updatedSticker = {
          ...selectedSticker,
          x: originalStickerPos.current.x + dx,
          y: originalStickerPos.current.y + dy,
        };

        loadedStickersRef.current.set(selectedSticker.id, {
          ...loadedStickersRef.current.get(selectedSticker.id)!,
          ...updatedSticker,
        });

        setSelectedSticker(updatedSticker);
        socket.updateSticker(boardId, updatedSticker);

        if (onUpdate) requestAnimationFrame(onUpdate);
      };

      const handleDragEnd = () => {
        if (!selectedSticker) return;

        isDragging.current = false;
        const finalSticker = loadedStickersRef.current.get(selectedSticker.id);
        if (finalSticker) {
          socket.updateSticker(boardId, finalSticker);
        }

        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };

      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
    },
    [selectedSticker, isResizing, screenToCanvas, boardId, socket, onUpdate]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing || isDragging.current) return;

      const point = screenToCanvas(e.clientX, e.clientY);
      let clickedSticker: StickerData | null = null;

      // Try to find a sticker under the click point
      Array.from(loadedStickersRef.current.values())
        .reverse()
        .some((sticker) => {
          const stickerCenter = {
            x: sticker.x,
            y: sticker.y,
          };

          const rotation = sticker.rotation || 0;
          const rad = (rotation * Math.PI) / 180;
          const cos = Math.cos(-rad);
          const sin = Math.sin(-rad);

          const dx = point.x - stickerCenter.x;
          const dy = point.y - stickerCenter.y;

          const rotatedX = dx * cos - dy * sin;
          const rotatedY = dx * sin + dy * cos;

          if (
            Math.abs(rotatedX) <= sticker.width / 2 &&
            Math.abs(rotatedY) <= sticker.height / 2
          ) {
            clickedSticker = sticker;
            return true;
          }
          return false;
        });

      // If we clicked empty space or a different sticker, update the selection
      setSelectedSticker(clickedSticker);
    },
    [isResizing, screenToCanvas]
  );

  const handleStickerResize = useCallback(
    (
      corner: string,
      initialBounds: { width: number; height: number; x: number; y: number },
      e: React.PointerEvent
    ) => {
      if (!selectedSticker) return;

      setIsResizing(true);
      const startPoint = screenToCanvas(e.clientX, e.clientY);
      const initialSticker = { ...selectedSticker };

      const handleMove = (moveEvent: MouseEvent) => {
        if (!selectedSticker) return;

        const currentPoint = screenToCanvas(
          moveEvent.clientX,
          moveEvent.clientY
        );
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;

        const newBounds = { ...initialSticker };

        switch (corner) {
          case "nw":
            newBounds.width = Math.max(50, initialSticker.width - dx);
            newBounds.height = Math.max(50, initialSticker.height - dy);
            newBounds.x = initialSticker.x + dx / 2;
            newBounds.y = initialSticker.y + dy / 2;
            break;
          case "n":
            newBounds.height = Math.max(50, initialSticker.height - dy * 2);
            newBounds.y = initialSticker.y + dy;
            break;
          case "ne":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.height = Math.max(50, initialSticker.height - dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "e":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.x = initialSticker.x + dx;
            break;
          case "se":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "s":
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.y = initialSticker.y + dy;
            break;
          case "sw":
            newBounds.width = Math.max(50, initialSticker.width - dx * 2);
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "w":
            newBounds.width = Math.max(50, initialSticker.width - dx * 2);
            newBounds.x = initialSticker.x + dx;
            break;
        }

        loadedStickersRef.current.set(selectedSticker.id, {
          ...loadedStickersRef.current.get(selectedSticker.id)!,
          ...newBounds,
        });

        socket.updateSticker(boardId, newBounds);
        setSelectedSticker(newBounds);
        if (onUpdate) requestAnimationFrame(onUpdate);
      };

      const handleUp = () => {
        if (!selectedSticker) return;

        setIsResizing(false);
        const finalSticker = loadedStickersRef.current.get(selectedSticker.id);
        if (finalSticker) {
          socket.updateSticker(boardId, finalSticker);
        }

        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [selectedSticker, screenToCanvas, boardId, socket, onUpdate]
  );

  const addSticker = useCallback(
    async (e: React.MouseEvent) => {
      try {
        const point = screenToCanvas(e.clientX, e.clientY);
        const imageUrl = await getStickerImageUrl(boardId);

        if (!imageUrl) return;

        const newSticker: StickerData = {
          id: generateUniqueId(),
          boardId,
          imageUrl,
          x: point.x,
          y: point.y,
          width: 100,
          height: 100,
          rotation: 0,
        };

        await loadStickerImage(newSticker);
        socket.addSticker(boardId, newSticker);
        setSelectedSticker(newSticker);
        if (onUpdate) requestAnimationFrame(onUpdate);
      } catch (error) {
        console.error("Error adding sticker:", error);
      }
    },
    [boardId, screenToCanvas, loadStickerImage, socket, onUpdate]
  );

  const handleDeleteSticker = useCallback(() => {
    if (!selectedSticker) return;

    loadedStickersRef.current.delete(selectedSticker.id);
    socket.deleteSticker(boardId, selectedSticker.id);
    setSelectedSticker(null);
    if (onUpdate) requestAnimationFrame(onUpdate);
  }, [selectedSticker, boardId, socket, onUpdate]);

  return {
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
  };
}

// Helper functions
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getStickerImageUrl(boardId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        if (file.size > 5 * 1024 * 1024) {
          console.error("File too large (max 5MB)");
          resolve(null);
          return;
        }

        if (!file.type.startsWith("image/")) {
          console.error("Invalid file type");
          resolve(null);
          return;
        }

        const formData = new FormData();
        formData.append("sticker", file);

        const response = await fetch(`/api/boards/${boardId}/stickers/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        resolve(data.imageUrl);
      } catch (error) {
        console.error("Error uploading sticker image:", error);
        resolve(null);
      }
    };

    input.click();
  });
}
