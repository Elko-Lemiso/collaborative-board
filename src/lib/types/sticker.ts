export interface StickerData {
  id: string;
  boardId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Could be cool at some point I guess
  createdAt?: string;
  updatedAt?: string;
}
