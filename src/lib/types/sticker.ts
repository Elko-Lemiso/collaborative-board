export interface StickerData {
  id: string;
  boardId: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
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