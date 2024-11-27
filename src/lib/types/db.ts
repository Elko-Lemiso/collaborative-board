export interface User {
  id: string;
  username: string;
  isConnected: boolean;
  currentBoardId?: string;
  createdAt: Date;
  updatedAt: Date;
  boardId?: string;
}

export interface Board {
  _count: {
    User: number;
    strokes: number;
    stickers: number;
  };
  id: string;
  name: string;
  updatedAt: Date;
  createdAt: Date;
  users?: User[];
  strokes?: Stroke[];
  stickers?: Sticker[];
}

export interface Stroke {
  id: string;
  boardId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  createdAt: Date;
  userId?: string;
  user?: User;
}

export interface Sticker {
  id: string;
  boardId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  user?: User;
}
