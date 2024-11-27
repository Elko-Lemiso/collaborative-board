import { Transform, CanvasConfig, Point } from "./canvas";
import { StickerData, LoadedSticker } from "./sticker";
import { SocketHook } from "./socket";

export interface UseTransformProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export interface UseDrawingProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: SocketHook;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onDraw?: () => void;  
  setIsLoading: (isLoading: boolean) => void;

}

export interface UseStickersProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: SocketHook;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onUpdate?: () => void;
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  transform: Transform;
  isDrawing: boolean;
  selectedSticker: StickerData | null;
  setSelectedSticker: (sticker: StickerData | null) => void;
  isResizing: boolean;
  startDrawing: (e: React.MouseEvent) => void;
  draw: (e: React.MouseEvent) => void;
  stopDrawing: () => void;
  handlePanStart: (e: React.MouseEvent) => Point;
  handlePanMove: (startPoint: Point, e: React.MouseEvent) => Point;
  handleStickerDragStart: (e: React.MouseEvent) => void;
  handleStickerResize: (
    corner: string,
    // TODO: Fix this type
    initialBounds: { x: number; y: number; width: number; height: number },
    e: React.PointerEvent
  ) => void;
  handleDeleteSticker: () => void;
  addSticker: (e: React.MouseEvent) => Promise<void>;
  drawGrid: () => void;
  loadedStickersRef: React.RefObject<Map<string, LoadedSticker>>;
  handleCanvasClick: (e: React.MouseEvent) => void;
  isLoading: boolean;
}
