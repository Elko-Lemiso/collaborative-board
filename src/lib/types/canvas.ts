export const VIRTUAL_SIZE = 10000;
export const CENTER_OFFSET = VIRTUAL_SIZE / 2;
export const GRID_SIZE = 40;

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasConfig {
  VIRTUAL_SIZE: number;
  CENTER_OFFSET: number;
  GRID_SIZE: number;
}

export type CanvasMode = "draw" | "move" | "select" | "sticker";

export interface DrawData {
  from: Point;
  to: Point;
  color: string;
  width: number;
}

export interface StrokeData {
  id: string;
  boardId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  createdAt?: Date;
}

export interface BoardData {
  id: string;
  name: string;
  strokes: StrokeData[];
  stickers: StickerData[];
  createdAt: Date;
  updatedAt: Date;
}

// Socket related types
export interface SocketDrawPayload {
  boardId: string;
  data: DrawData;
}

export interface SocketStickerPayload {
  boardId: string;
  data: StickerData;
}

export interface SocketUserPayload {
  boardId: string;
  username: string;
}

// Event handlers
export type DrawHandler = (data: DrawData) => void;
export type StickerHandler = (data: StickerData) => void;
export type UserHandler = (data: { username: string }) => void;

// Canvas event types
export interface CanvasEventHandlers {
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onWheel?: (e: WheelEvent) => void;
}

// Sticker related types
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

export interface StickerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Hook props interfaces
export interface UseTransformProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export interface UseDrawingProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: any; // Replace with proper Socket type if available
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onDraw?: () => void;
}

export interface UseStickersProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: any; // Replace with proper Socket type if available
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onUpdate?: () => void;
}

// Component props interfaces
export interface CanvasProps {
  boardId: string;
  username: string;
  initialScale?: number;
}

export interface ActionBarProps {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
}

export interface StickerSelectionBoxProps {
  sticker: StickerData;
  transform: Transform;
  onResize: (
    corner: string,
    initialBounds: StickerBounds,
    e: React.PointerEvent
  ) => void;
  onDelete: () => void;
}
