// components/Canvas/StickerSelectionBox.tsx

import { memo } from "react";

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

export const StickerSelectionBox = memo(
  ({ bounds, onResize, transform }: SelectionBoxProps) => {
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
            onResize("top-left", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-n-resize pointer-events-auto"
          style={{ top: -6, left: "50%", transform: "translateX(-50%)" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("top", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize pointer-events-auto"
          style={{ top: -6, right: -6 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("top-right", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-e-resize pointer-events-auto"
          style={{ top: "50%", right: -6, transform: "translateY(-50%)" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("right", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize pointer-events-auto"
          style={{ bottom: -6, right: -6 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("bottom-right", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-s-resize pointer-events-auto"
          style={{ bottom: -6, left: "50%", transform: "translateX(-50%)" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("bottom", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize pointer-events-auto"
          style={{ bottom: -6, left: -6 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("bottom-left", bounds, e);
          }}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-w-resize pointer-events-auto"
          style={{ top: "50%", left: -6, transform: "translateY(-50%)" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize("left", bounds, e);
          }}
        />
      </div>
    );
  }
);

StickerSelectionBox.displayName = "StickerSelectionBox";
