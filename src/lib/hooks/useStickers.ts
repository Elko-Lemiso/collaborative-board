import { useCallback, useRef, useState, useEffect } from "react";
import { Point } from "../types/canvas";
import { StickerData, LoadedSticker } from "../types/sticker";
import { UseStickersProps } from "@/lib/types/hooks";

// Custom hook for managing stickers on a canvas
export function useStickers({
  boardId,
  transform,
  config,
  socket,
  canvasRef,
  onUpdate,
}: UseStickersProps) {
  // State for the currently selected sticker
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(
    null
  );

  // State to indicate if a sticker is being resized
  const [isResizing, setIsResizing] = useState(false);

  // Ref to store all loaded stickers
  const loadedStickersRef = useRef<Map<string, LoadedSticker>>(new Map());

  // Ref to track if a sticker is being dragged
  const isDragging = useRef(false);

  // Ref for drag start position
  const dragStartPos = useRef<Point>({ x: 0, y: 0 });

  // Ref for original sticker position before dragging
  const originalStickerPos = useRef<Point>({ x: 0, y: 0 });

  // Load initial stickers when the component mounts
  useEffect(() => {
    const loadInitialStickers = async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}/stickers`);
        if (!response.ok) return;
        const stickers = await response.json();
        // Load images for all stickers
        await Promise.all(stickers.map(loadStickerImage));
        // Request a canvas update
        if (onUpdate) requestAnimationFrame(onUpdate);
      } catch (error) {
        console.error("Failed to load stickers:", error);
      }
    };

    loadInitialStickers();
  }, [boardId]);

  // Function to load a sticker image
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
          resolve(sticker as LoadedSticker);
        };

        image.src = sticker.imageUrl;
      });
    },
    []
  );

  // Handle socket events related to stickers
  useEffect(() => {
    // When a new sticker is added
    const handleNewSticker = async (sticker: StickerData) => {
      await loadStickerImage(sticker);
      if (onUpdate) requestAnimationFrame(onUpdate);
    };

    // When a sticker is updated
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

    // When a sticker is deleted
    const handleDeleteSticker = (stickerId: string) => {
      loadedStickersRef.current.delete(stickerId);
      if (selectedSticker?.id === stickerId) {
        setSelectedSticker(null);
      }
      if (onUpdate) requestAnimationFrame(onUpdate);
    };

    // Register socket event handlers
    socket.onSticker(handleNewSticker);
    socket.onUpdateSticker(handleUpdateSticker);
    socket.onDeleteSticker(handleDeleteSticker);

    // Cleanup on unmount
    return () => {
      socket.offSticker(handleNewSticker);
      socket.offUpdateSticker(handleUpdateSticker);
      socket.offDeleteSticker(handleDeleteSticker);
    };
  }, [socket, selectedSticker, onUpdate, loadStickerImage]);

  // Convert screen coordinates to canvas coordinates
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

  // Handle the start of sticker dragging
  const handleStickerDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedSticker || isResizing || e.button !== 0) return;

      e.stopPropagation();
      isDragging.current = true;

      // Get initial drag position
      const canvasPoint = screenToCanvas(e.clientX, e.clientY);
      dragStartPos.current = canvasPoint;
      originalStickerPos.current = {
        x: selectedSticker.x,
        y: selectedSticker.y,
      };

      // Handle dragging movement
      const handleDragMove = (moveEvent: MouseEvent) => {
        if (!selectedSticker || !isDragging.current) return;

        const currentPoint = screenToCanvas(
          moveEvent.clientX,
          moveEvent.clientY
        );
        const dx = currentPoint.x - dragStartPos.current.x;
        const dy = currentPoint.y - dragStartPos.current.y;

        const updatedSticker: StickerData = {
          ...selectedSticker,
          x: originalStickerPos.current.x + dx,
          y: originalStickerPos.current.y + dy,
        };

        // Update local sticker state
        const existingSticker = loadedStickersRef.current.get(
          selectedSticker.id
        );
        if (existingSticker) {
          loadedStickersRef.current.set(selectedSticker.id, {
            ...existingSticker,
            ...updatedSticker,
          });
        }

        // Update the selected sticker
        setSelectedSticker(updatedSticker);

        // Emit update to server
        socket.updateSticker(boardId, updatedSticker);

        // Request canvas update
        if (onUpdate) requestAnimationFrame(onUpdate);
      };

      // Handle the end of dragging
      const handleDragEnd = () => {
        if (!selectedSticker) return;

        isDragging.current = false;

        // Ensure the final position is sent to the server
        const finalSticker = loadedStickersRef.current.get(selectedSticker.id);
        if (finalSticker) {
          socket.updateSticker(boardId, finalSticker);
          setSelectedSticker(finalSticker);
        }

        if (onUpdate) requestAnimationFrame(onUpdate);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };

      // Register event listeners
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
    },
    [selectedSticker, isResizing, screenToCanvas, boardId, socket, onUpdate]
  );

  // Handle clicks on the canvas to select stickers
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing || isDragging.current) return;

      const point = screenToCanvas(e.clientX, e.clientY);
      let clickedSticker: StickerData | null = null;

      // Iterate through stickers to find if one was clicked
      const stickers = Array.from(loadedStickersRef.current.values()).reverse();

      for (const sticker of stickers) {
        const stickerCenter = {
          x: sticker.x,
          y: sticker.y,
        };

        // Adjust for rotation
        const rotation = sticker.rotation || 0;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);

        const dx = point.x - stickerCenter.x;
        const dy = point.y - stickerCenter.y;

        // Rotate point to match sticker's coordinate system
        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        // Check if the point is within the sticker's bounds
        if (
          Math.abs(rotatedX) <= sticker.width / 2 &&
          Math.abs(rotatedY) <= sticker.height / 2
        ) {
          clickedSticker = sticker;
          break;
        }
      }

      // Set the clicked sticker as selected
      setSelectedSticker(clickedSticker);
    },
    [isResizing, screenToCanvas]
  );

  // Handle sticker resizing
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

        // Adjust size based on the corner being dragged
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

        // Update the sticker in local state
        loadedStickersRef.current.set(selectedSticker.id, {
          ...loadedStickersRef.current.get(selectedSticker.id)!,
          ...newBounds,
        });

        // Emit update to server
        socket.updateSticker(boardId, newBounds);
        // Update the selected sticker
        setSelectedSticker(newBounds);
        // Request canvas update
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

      // Register event listeners
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [selectedSticker, screenToCanvas, boardId, socket, onUpdate]
  );

  // Add a new sticker to the canvas
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

        // Load the sticker image
        await loadStickerImage(newSticker);
        // Emit add sticker event to server
        socket.addSticker(boardId, newSticker);
        // Set the new sticker as selected
        setSelectedSticker(newSticker);
        // Request canvas update
        if (onUpdate) requestAnimationFrame(onUpdate);
      } catch (error) {
        console.error("Error adding sticker:", error);
      }
    },
    [boardId, screenToCanvas, loadStickerImage, socket, onUpdate]
  );

  // Delete the selected sticker
  const handleDeleteSticker = useCallback(() => {
    if (!selectedSticker) return;

    // Remove from local state
    loadedStickersRef.current.delete(selectedSticker.id);
    // Emit delete event to server
    socket.deleteSticker(boardId, selectedSticker.id);
    // Clear selected sticker
    setSelectedSticker(null);
    // Request canvas update
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

// Helper function to generate a unique ID
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get the sticker image URL from the user
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
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error("File too large (max 5MB)");
          resolve(null);
          return;
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          console.error("Invalid file type");
          resolve(null);
          return;
        }

        const formData = new FormData();
        formData.append("sticker", file);

        // Upload the image to the server
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

    // Trigger file selection dialog
    input.click();
  });
}
