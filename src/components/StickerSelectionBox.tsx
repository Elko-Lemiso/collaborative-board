import React from "react";
import { Transform } from "@/lib/types/canvas";
import { StickerData } from "@/lib/types/sticker";
import { Trash2 } from "lucide-react";

const HANDLE_SIZE = 8;
const CENTER_OFFSET = 5000; // Matching the canvas config

interface StickerSelectionBoxProps {
  sticker: StickerData;
  transform: Transform;
  onResize: (corner: string, initialBounds: any, e: React.PointerEvent) => void;
  onDelete: () => void;
}

export const StickerSelectionBox: React.FC<StickerSelectionBoxProps> = ({
  sticker,
  transform,
  onResize,
  onDelete,
}) => {
  // Calculate screen coordinates
  const screenX =
    (sticker.x - CENTER_OFFSET - sticker.width / 2) * transform.scale +
    transform.x;
  const screenY =
    (sticker.y - CENTER_OFFSET - sticker.height / 2) * transform.scale +
    transform.y;
  const screenWidth = sticker.width * transform.scale;
  const screenHeight = sticker.height * transform.scale;

  const handleStyle: React.CSSProperties = {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: "white",
    border: "1px solid #666",
    position: "absolute",
    borderRadius: "50%",
    cursor: "pointer",
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        transform: `translate(${screenX}px, ${screenY}px) 
                   rotate(${sticker.rotation || 0}deg)`,
        width: screenWidth,
        height: screenHeight,
      }}
    >
      {/* Selection border */}
      <div
        className="absolute inset-0 border-2 border-blue-500"
        style={{ backgroundColor: "rgba(66, 153, 225, 0.1)" }}
      />

      {/* Resize handles */}
      {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((position) => {
        const handlePosition: React.CSSProperties = {
          ...handleStyle,
          ...getHandlePosition(
            position,
            screenWidth,
            screenHeight,
            HANDLE_SIZE
          ),
        };

        return (
          <div
            key={position}
            className="pointer-events-auto"
            style={handlePosition}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResize(
                position,
                {
                  x: screenX,
                  y: screenY,
                  width: screenWidth,
                  height: screenHeight,
                },
                e
              );
            }}
          />
        );
      })}

      {/* Delete button */}
      <button
        className="absolute -top-8 right-0 p-1 bg-red-500 rounded-full text-white 
                   pointer-events-auto hover:bg-red-600 transition-colors"
        onClick={onDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// Helper function to calculate handle positions
function getHandlePosition(
  position: string,
  width: number,
  height: number,
  handleSize: number
): React.CSSProperties {
  const offset = -handleSize / 2;
  const center = handleSize / 2;

  switch (position) {
    case "nw":
      return { top: offset, left: offset, cursor: "nw-resize" };
    case "n":
      return {
        top: offset,
        left: `calc(50% - ${center}px)`,
        cursor: "n-resize",
      };
    case "ne":
      return { top: offset, right: offset, cursor: "ne-resize" };
    case "e":
      return {
        top: `calc(50% - ${center}px)`,
        right: offset,
        cursor: "e-resize",
      };
    case "se":
      return { bottom: offset, right: offset, cursor: "se-resize" };
    case "s":
      return {
        bottom: offset,
        left: `calc(50% - ${center}px)`,
        cursor: "s-resize",
      };
    case "sw":
      return { bottom: offset, left: offset, cursor: "sw-resize" };
    case "w":
      return {
        top: `calc(50% - ${center}px)`,
        left: offset,
        cursor: "w-resize",
      };
    default:
      return {};
  }
}

export default StickerSelectionBox;
