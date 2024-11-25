// types/socket.ts

export interface DrawData {
  from: { x: number; y: number };
  to: { x: number; y: number };
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
  createdAt: string;
}
