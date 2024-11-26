"use client";
import React, { useState, useCallback, useRef } from "react";
import useCanvas from "@/lib/hooks/useCanvas";
import ActionBar from "@/components/ActionBar";
import { StickerData } from "@/lib/types/sticker";
import { StickerSelectionBox } from "./StickerSelectionBox";

type CanvasMode = "draw" | "move" | "select" | "sticker";
export const VIRTUAL_SIZE = 10000;
export const CENTER_OFFSET = VIRTUAL_SIZE / 2;
export const GRID_SIZE = 40;

export const Canvas = ({
  boardId,
  username,
}: {
  boardId: string;
  username: string;
}) => {
  const [mode, setMode] = useState<CanvasMode>("draw");
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(
    null
  );
  const [isResizing, setIsResizing] = useState(false);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const originalStickerPos = useRef({ x: 0, y: 0 });

  const {
    canvasRef,
    isPanning,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    startPan,
    pan,
    stopPan,
    addSticker,
    getCanvasPoint,
    transform,
    loadedStickersRef,
    isLoadingStickers,
    drawGrid,
  } = useCanvas(boardId, username);

  // Convert screen coordinates to virtual canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      return {
        x:
          (screenX - rect.left - transform.x) / transform.scale + CENTER_OFFSET,
        y: (screenY - rect.top - transform.y) / transform.scale + CENTER_OFFSET,
      };
    },
    [canvasRef, transform]
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
        requestAnimationFrame(drawGrid); // Request immediate redraw

        // Update server
        fetch(`/api/boards/${boardId}/stickers/${selectedSticker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedSticker),
        }).catch(console.error);
      };

      const handleDragEnd = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        requestAnimationFrame(drawGrid); // Ensure final position is drawn
      };

      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
    },
    [selectedSticker, isResizing, screenToCanvas, drawGrid, boardId]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "select" || isResizing || isDragging.current) return;

      const point = screenToCanvas(e.clientX, e.clientY);

      // Find clicked sticker from loadedStickersRef
      let clickedSticker: StickerData | null = null;
      loadedStickersRef.current.forEach((sticker) => {
        // Convert point to sticker's local coordinates
        const stickerCenter = {
          x: sticker.x,
          y: sticker.y,
        };

        const rotation = sticker.rotation || 0;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);

        // Translate point to origin
        const dx = point.x - stickerCenter.x;
        const dy = point.y - stickerCenter.y;

        // Rotate point
        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;

        // Check if rotated point is within bounds
        if (
          Math.abs(rotatedX) <= sticker.width / 2 &&
          Math.abs(rotatedY) <= sticker.height / 2
        ) {
          clickedSticker = sticker;
        }
      });

      setSelectedSticker(clickedSticker);
    },
    [mode, isResizing, screenToCanvas, loadedStickersRef]
  );

  
  const handleStickerResize = useCallback(
    (corner: string, initialBounds: any, e: React.PointerEvent) => {
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

        // Apply transformations based on corner being dragged
        switch (corner) {
          case "top-left":
            newBounds.width = Math.max(50, initialSticker.width - dx);
            newBounds.height = Math.max(50, initialSticker.height - dy);
            newBounds.x = initialSticker.x + dx / 2;
            newBounds.y = initialSticker.y + dy / 2;
            break;
          case "top":
            newBounds.height = Math.max(50, initialSticker.height - dy * 2);
            newBounds.y = initialSticker.y + dy;
            break;
          case "top-right":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.height = Math.max(50, initialSticker.height - dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "right":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.x = initialSticker.x + dx;
            break;
          case "bottom-right":
            newBounds.width = Math.max(50, initialSticker.width + dx * 2);
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "bottom":
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.y = initialSticker.y + dy;
            break;
          case "bottom-left":
            newBounds.width = Math.max(50, initialSticker.width - dx * 2);
            newBounds.height = Math.max(50, initialSticker.height + dy * 2);
            newBounds.x = initialSticker.x + dx;
            newBounds.y = initialSticker.y + dy;
            break;
          case "left":
            newBounds.width = Math.max(50, initialSticker.width - dx * 2);
            newBounds.x = initialSticker.x + dx;
            break;
        }

        // Maintain aspect ratio if shift is pressed
        if (moveEvent.shiftKey) {
          const ratio = initialSticker.width / initialSticker.height;
          if (["top", "bottom"].includes(corner)) {
            newBounds.width = newBounds.height * ratio;
          } else if (["left", "right"].includes(corner)) {
            newBounds.height = newBounds.width / ratio;
          } else {
            const deltaRatio = Math.abs(dx / dy);
            if (deltaRatio > ratio) {
              const height = newBounds.width / ratio;
              newBounds.height = height;
              newBounds.y =
                initialSticker.y + (height - initialSticker.height) / 2;
            } else {
              const width = newBounds.height * ratio;
              newBounds.width = width;
              newBounds.x =
                initialSticker.x + (width - initialSticker.width) / 2;
            }
          }
        }

        // Apply rotation transformation
        if (selectedSticker.rotation) {
          const angle = (selectedSticker.rotation * Math.PI) / 180;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const dx = newBounds.x - initialSticker.x;
          const dy = newBounds.y - initialSticker.y;

          newBounds.x = initialSticker.x + (dx * cos - dy * sin);
          newBounds.y = initialSticker.y + (dx * sin + dy * cos);
        }

        // Update in loadedStickersRef
        loadedStickersRef.current.set(selectedSticker.id, {
          ...loadedStickersRef.current.get(selectedSticker.id)!,
          ...newBounds,
        });

        // Update server
        fetch(`/api/boards/${boardId}/stickers/${selectedSticker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBounds),
        }).catch(console.error);

        setSelectedSticker(newBounds);
        drawGrid();
      };

      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        setIsResizing(false);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [selectedSticker, screenToCanvas, drawGrid, loadedStickersRef, boardId]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLoadingStickers) return;

      if (mode === "select" && e.button === 0) {
        if (selectedSticker) {
          handleStickerDragStart(e);
        } else {
          handleCanvasClick(e);
        }
      } else if (mode === "draw" && e.button === 0) {
        setSelectedSticker(null);
        startDrawing(e);
      } else if (mode === "sticker" && e.button === 0) {
        setSelectedSticker(null);
        addSticker(e);
      } else if (mode === "move" || e.button === 1 || e.button === 2) {
        setSelectedSticker(null);
        startPan(e);
      }
    },
    [
      mode,
      isLoadingStickers,
      selectedSticker,
      handleStickerDragStart,
      handleCanvasClick,
      startDrawing,
      addSticker,
      startPan,
    ]
  );

  const handleDeleteSticker = useCallback(() => {
    if (!selectedSticker) return;

    // Remove from loadedStickersRef
    loadedStickersRef.current.delete(selectedSticker.id);

    // Delete from server
    fetch(`/api/boards/${boardId}/stickers/${selectedSticker.id}`, {
      method: "DELETE",
    }).catch(console.error);

    setSelectedSticker(null);
    drawGrid();
  }, [selectedSticker, loadedStickersRef, boardId, drawGrid]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ActionBar
        mode={mode}
        setMode={(newMode) => {
          setMode(newMode as CanvasMode);
          setSelectedSticker(null);
        }}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          if (isPanning.current) {
            pan(e);
          } else if (isDrawing.current) {
            draw(e);
          }
        }}
        onMouseUp={() => {
          if (!isDragging.current) {
            stopDrawing();
            stopPan();
          }
        }}
        onMouseLeave={() => {
          if (!isDragging.current) {
            stopDrawing();
            stopPan();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full touch-none absolute"
        style={{
          cursor:
            mode === "draw"
              ? "crosshair"
              : mode === "move"
              ? isPanning.current
                ? "grabbing"
                : "grab"
              : mode === "select"
              ? "pointer"
              : mode === "sticker"
              ? "copy"
              : "default",
        }}
      />

      {selectedSticker && !isResizing && mode === "select" && (
        <StickerSelectionBox
          bounds={{
            x:
              (selectedSticker.x - CENTER_OFFSET - selectedSticker.width / 2) *
                transform.scale +
              transform.x,
            y:
              (selectedSticker.y - CENTER_OFFSET - selectedSticker.height / 2) *
                transform.scale +
              transform.y,
            width: selectedSticker.width * transform.scale,
            height: selectedSticker.height * transform.scale,
          }}
          rotation={selectedSticker.rotation}
          onResize={handleStickerResize}
          onRotate={(angle) => {
            const updatedSticker = {
              ...selectedSticker,
              rotation: angle,
            };
            loadedStickersRef.current.set(selectedSticker.id, {
              ...loadedStickersRef.current.get(selectedSticker.id)!,
              ...updatedSticker,
            });

            fetch(`/api/boards/${boardId}/stickers/${selectedSticker.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedSticker),
            }).catch(console.error);

            setSelectedSticker(updatedSticker);
            drawGrid();
          }}
          onDelete={handleDeleteSticker}
          transform={transform}
        />
      )}

      {isLoadingStickers && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">Loading stickers...</div>
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded">
          <div>Mode: {mode}</div>
          <div>Selected: {selectedSticker?.id}</div>
          <div>
            Transform: {transform.x.toFixed(0)}, {transform.y.toFixed(0)},{" "}
            {transform.scale.toFixed(2)}
          </div>
          {selectedSticker && (
            <div>
              Sticker Pos: {selectedSticker.x.toFixed(0)},{" "}
              {selectedSticker.y.toFixed(0)}
              <br />
              Size: {selectedSticker.width.toFixed(0)} x{" "}
              {selectedSticker.height.toFixed(0)}
              <br />
              Rotation: {selectedSticker.rotation || 0}°
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Canvas;
