import React, { useRef, useState } from "react";
import { Trash2, RotateCw } from "lucide-react";

interface SelectionBoxProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: number;
  onResize: (corner: string, initialBounds: any, e: React.PointerEvent) => void;
  onRotate: (angle: number) => void;
  onDelete?: () => void;
  transform: {
    scale: number;
    x: number;
    y: number;
  };
}

export const StickerSelectionBox = ({
  bounds,
  rotation = 0,
  onResize,
  onRotate,
  onDelete,
  transform,
}: SelectionBoxProps) => {
  const rotationHandle = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    const startAngle = Math.atan2(
      e.clientY - center.y,
      e.clientX - center.x
    ) * (180 / Math.PI);

    const initialRotation = rotation;

    const handleRotate = (moveEvent: MouseEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - center.y,
        moveEvent.clientX - center.x
      ) * (180 / Math.PI);

      let deltaAngle = currentAngle - startAngle;

      // Snap to 15-degree increments if holding Shift
      if (moveEvent.shiftKey) {
        deltaAngle = Math.round(deltaAngle / 15) * 15;
      }

      const newRotation = (initialRotation + deltaAngle) % 360;
      onRotate(newRotation);
    };

    const handleRotateEnd = () => {
      setIsRotating(false);
      window.removeEventListener('mousemove', handleRotate);
      window.removeEventListener('mouseup', handleRotateEnd);
    };

    window.addEventListener('mousemove', handleRotate);
    window.addEventListener('mouseup', handleRotateEnd);
  };

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
        transform: `translate(${bounds.x}px, ${bounds.y}px) rotate(${rotation}deg)`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        transformOrigin: "center center",
        // Add cursor for dragging
        cursor: 'move',
      }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-blue-500" />

      {/* Rotation handle */}
      <div
        ref={rotationHandle}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-4 h-4 
                   bg-white border-2 border-blue-500 rounded-full cursor-move pointer-events-auto
                   hover:bg-blue-100"
        onMouseDown={handleRotateStart}
      />

      {/* Control buttons */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-auto">
        <button
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => onRotate((rotation + 90) % 360)}
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>
        {onDelete && (
          <button
            className="p-2 bg-white rounded-full shadow-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={onDelete}
            title="Delete sticker"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Resize handles */}
      {!isRotating && [
        { position: "top-left", cursor: "nw-resize", top: -6, left: -6 },
        { position: "top", cursor: "n-resize", top: -6, left: "50%", transform: "translateX(-50%)" },
        { position: "top-right", cursor: "ne-resize", top: -6, right: -6 },
        { position: "right", cursor: "e-resize", top: "50%", right: -6, transform: "translateY(-50%)" },
        { position: "bottom-right", cursor: "se-resize", bottom: -6, right: -6 },
        { position: "bottom", cursor: "s-resize", bottom: -6, left: "50%", transform: "translateX(-50%)" },
        { position: "bottom-left", cursor: "sw-resize", bottom: -6, left: -6 },
        { position: "left", cursor: "w-resize", top: "50%", left: -6, transform: "translateY(-50%)" },
      ].map((handle) => (
        <div
          key={handle.position}
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 pointer-events-auto hover:bg-blue-100"
          style={{
            cursor: handle.cursor,
            top: handle.top,
            left: handle.left,
            right: handle.right,
            bottom: handle.bottom,
            transform: handle.transform,
            zIndex: 10,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResize(handle.position, bounds, e);
          }}
        />
      ))}
    </div>
  );
};

export default StickerSelectionBox;