export interface Point {
  x: number;
  y: number;
}

export interface Sticker {
  id: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
}

export interface Transform {
  width: number;
  height: number;
  rotation: number;
  x: number;
  y: number;
}

export type ResizeType = "move" | "resize" | "rotate" | null;
export type CanvasMode = "draw" | "sticker";
