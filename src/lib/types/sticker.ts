export interface StickerData {
  id: string;
  boardId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  createdAt?: string;
  updatedAt?: string;
}
