import React, { useState, useRef, useEffect } from "react";
import useCanvas from "@/lib/hooks/useCanvas";
import ActionBar from "@/components/Canvas/ActionBar";
import { StickerSelectionBox } from "./StickerSelectionBox";
import { CanvasMode } from "@/lib/types/canvas";
import { Point } from "@/lib/types/canvas";

interface CanvasProps {
  boardId: string;
  username: string;
}

export const Canvas = ({ boardId, username }: CanvasProps) => {
  const [mode, setMode] = useState<CanvasMode>("draw");
  const isPanning = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const {
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
    handleCanvasClick,
    connectedUsers,
  } = useCanvas(boardId, username);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    if (mode === "select" && e.button === 0) {
      // Handle selection first
      handleCanvasClick(e);
      // Check if we clicked a sticker
      if (selectedSticker) {
        handleStickerDragStart(e);
      }
    } else if (mode === "draw" && e.button === 0) {
      setSelectedSticker(null);
      startDrawing(e);
    } else if (mode === "sticker" && e.button === 0) {
      setSelectedSticker(null);
      addSticker(e);
    } else if (mode === "move" || e.button === 1 || e.button === 2) {
      setSelectedSticker(null);
      isPanning.current = true;
      lastPoint.current = handlePanStart(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isPanning.current && lastPoint.current) {
      lastPoint.current = handlePanMove(lastPoint.current, e);
    } else if (mode === "draw" && isDrawing) {
      draw(e);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();

    if (mode === "draw") {
      stopDrawing();
    }
    isPanning.current = false;
    lastPoint.current = null;
  };

  const handleCanvasMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    handleCanvasMouseUp(e);
  };

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden">
        <ActionBar
          mode={mode}
          setMode={(newMode: CanvasMode) => {
            setMode(newMode as CanvasMode);
            setSelectedSticker(null);
          }}
        />

        {/* Users List */}
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg shadow-lg p-4 z-50">
          <div className="text-sm font-medium text-gray-900 mb-3">
            Connected Users ({connectedUsers?.length || 0})
          </div>
          <div className="space-y-2">
            {connectedUsers?.map((user) => (
              <div key={user} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">
                  {user} {user === username && "(you)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
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
            sticker={selectedSticker}
            transform={transform}
            onResize={handleStickerResize}
            onDelete={handleDeleteSticker}
          />
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
    </>
  );
};

export default Canvas;
