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

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasConfig {
  VIRTUAL_SIZE: number;
  CENTER_OFFSET: number;
  GRID_SIZE: number;
}

export type CanvasMode = 'draw' | 'move' | 'select' | 'sticker';

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
  createdAt: Date;
}

// Event types
export interface CanvasMouseEvent extends React.MouseEvent<HTMLCanvasElement> {
  clientX: number;
  clientY: number;
  button: number;
}

export interface CanvasWheelEvent extends React.WheelEvent<HTMLCanvasElement> {
  deltaY: number;
  clientX: number;
  clientY: number;
}

export interface CanvasPointerEvent extends React.PointerEvent<HTMLCanvasElement> {
  clientX: number;
  clientY: number;
}