"use client";
import React, { useState, useCallback } from "react";
import useCanvas from "@/lib/hooks/useCanvas";
import ActionBar from "@/components/ActionBar";
import { StickerData } from "@/lib/types/sticker";

interface SelectionBoxProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onResize: (corner: string, initialBounds: any, e: React.PointerEvent) => void;
  transform: {
    scale: number;
    x: number;
    y: number;
  };
}

// Selection Box Component
const StickerSelectionBox = ({ bounds, onResize, transform }: SelectionBoxProps) => {
  if (!bounds) return null;

  // Convert bounds to screen coordinates
  const screenBounds = {
    x: bounds.x * transform.scale + transform.x,
    y: bounds.y * transform.scale + transform.y,
    width: bounds.width * transform.scale,
    height: bounds.height * transform.scale,
  };

  return (
    <div 
      className="absolute pointer-events-none" 
      style={{
        transform: `translate(${screenBounds.x}px, ${screenBounds.y}px)`,
        width: `${screenBounds.width}px`,
        height: `${screenBounds.height}px`,
      }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-blue-500" />

      {/* Resize handles */}
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize pointer-events-auto"
        style={{ top: -6, left: -6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('top-left', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-n-resize pointer-events-auto"
        style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('top', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize pointer-events-auto"
        style={{ top: -6, right: -6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('top-right', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-e-resize pointer-events-auto"
        style={{ top: '50%', right: -6, transform: 'translateY(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('right', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize pointer-events-auto"
        style={{ bottom: -6, right: -6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('bottom-right', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-s-resize pointer-events-auto"
        style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('bottom', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize pointer-events-auto"
        style={{ bottom: -6, left: -6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('bottom-left', bounds, e);
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-w-resize pointer-events-auto"
        style={{ top: '50%', left: -6, transform: 'translateY(-50%)' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onResize('left', bounds, e);
        }}
      />
    </div>
  );
};

export const Canvas = ({
  boardId,
  username,
}: {
  boardId: string;
  username: string;
}) => {
  const [mode, setMode] = useState<"draw" | "move" | "select" | "sticker">("draw");
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [isResizing, setIsResizing] = useState(false);

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
    stickersRef,
    drawGrid,
  } = useCanvas(boardId, username);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'select') return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    
    // Check if we clicked on a sticker
    const clickedSticker = stickersRef.current.find(sticker => {
      const bounds = {
        left: sticker.x - sticker.width / 2,
        right: sticker.x + sticker.width / 2,
        top: sticker.y - sticker.height / 2,
        bottom: sticker.y + sticker.height / 2,
      };

      return (
        point.x >= bounds.left &&
        point.x <= bounds.right &&
        point.y >= bounds.top &&
        point.y <= bounds.bottom
      );
    });

    setSelectedSticker(clickedSticker || null);
  }, [mode, getCanvasPoint, stickersRef]);

  const handleStickerResize = useCallback((
    corner: string,
    initialBounds: any,
    e: React.PointerEvent
  ) => {
    if (!selectedSticker) return;

    const startPoint = { x: e.clientX, y: e.clientY };
    
    const handleMove = (moveEvent: MouseEvent) => {
      if (!selectedSticker) return;

      const dx = (moveEvent.clientX - startPoint.x) / transform.scale;
      const dy = (moveEvent.clientY - startPoint.y) / transform.scale;

      const newBounds = { ...selectedSticker };

      switch (corner) {
        case 'top-left':
          newBounds.width = Math.max(50, initialBounds.width - dx);
          newBounds.height = Math.max(50, initialBounds.height - dy);
          newBounds.x = initialBounds.x + (initialBounds.width - newBounds.width) / 2;
          newBounds.y = initialBounds.y + (initialBounds.height - newBounds.height) / 2;
          break;
        case 'top-right':
          newBounds.width = Math.max(50, initialBounds.width + dx);
          newBounds.height = Math.max(50, initialBounds.height - dy);
          newBounds.y = initialBounds.y + (initialBounds.height - newBounds.height) / 2;
          break;
        case 'bottom-left':
          newBounds.width = Math.max(50, initialBounds.width - dx);
          newBounds.height = Math.max(50, initialBounds.height + dy);
          newBounds.x = initialBounds.x + (initialBounds.width - newBounds.width) / 2;
          break;
        case 'bottom-right':
          newBounds.width = Math.max(50, initialBounds.width + dx);
          newBounds.height = Math.max(50, initialBounds.height + dy);
          break;
        case 'top':
          newBounds.height = Math.max(50, initialBounds.height - dy);
          newBounds.y = initialBounds.y + (initialBounds.height - newBounds.height) / 2;
          break;
        case 'right':
          newBounds.width = Math.max(50, initialBounds.width + dx);
          break;
        case 'bottom':
          newBounds.height = Math.max(50, initialBounds.height + dy);
          break;
        case 'left':
          newBounds.width = Math.max(50, initialBounds.width - dx);
          newBounds.x = initialBounds.x + (initialBounds.width - newBounds.width) / 2;
          break;
      }

      // Update the sticker
      stickersRef.current = stickersRef.current.map(s => 
        s.id === selectedSticker.id ? newBounds : s
      );
      setSelectedSticker(newBounds);

      // Redraw
      requestAnimationFrame(drawGrid);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    setIsResizing(true);
  }, [selectedSticker, transform.scale, drawGrid]);

  // Handle clicking outside of stickers to deselect
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode === "draw" && e.button === 0) {
      setSelectedSticker(null);
      startDrawing(e);
    } else if (mode === "sticker" && e.button === 0) {
      setSelectedSticker(null);
      addSticker(e);
    } else if (mode === "select" && e.button === 0) {
      handleCanvasClick(e);
    } else if (mode === "move" || e.button === 1 || e.button === 2) {
      setSelectedSticker(null);
      startPan(e);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Action Bar with Buttons */}
      <ActionBar mode={mode} setMode={(newMode) => {
        setMode(newMode as typeof mode);
        setSelectedSticker(null);
      }} />

      {/* Main Canvas */}
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
          stopDrawing();
          stopPan();
        }}
        onMouseLeave={() => {
          stopDrawing();
          stopPan();
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full touch-none"
        style={{
          cursor:
            mode === "draw"
              ? "crosshair"
              : mode === "move"
              ? isPanning.current
                ? "grabbing"
                : "grab"
              : mode === "select"
              ? "default"
              : "default",
        }}
      />

      {/* Selection Box */}
      {selectedSticker && !isResizing && mode === 'select' && (
        <StickerSelectionBox
          bounds={{
            x: selectedSticker.x - selectedSticker.width / 2,
            y: selectedSticker.y - selectedSticker.height / 2,
            width: selectedSticker.width,
            height: selectedSticker.height,
          }}
          onResize={handleStickerResize}
          transform={transform}
        />
      )}
    </div>
  );
};

export default Canvas;