import { Point } from "./canvas";

export interface StickerData {
  id: string;
  boardId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoadedSticker extends StickerData {
  imageElement?: HTMLImageElement;
}

export interface StickerEvents {
  onResize: (
    corner: StickerCorner,
    initialBounds: StickerBounds,
    e: React.PointerEvent
  ) => void;
  onRotate: (angle: number) => void;
  onDelete: () => void;
}

export interface StickerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StickerCorner = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface StickerDragState {
  isDragging: boolean;
  startPos: Point;
  originalPos: Point;
}

export interface StickerResizeState {
  isResizing: boolean;
  corner: StickerCorner | null;
  startPoint: Point | null;
  initialBounds: StickerBounds | null;
}
