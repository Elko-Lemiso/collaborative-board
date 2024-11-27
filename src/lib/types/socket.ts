import { DrawData } from "./canvas";
import { StickerData } from "./sticker";

export interface SocketEvents {
  "join-board": (data: { boardId: string; username: string }) => void;
  "leave-board": (data: { boardId: string }) => void;
  draw: (boardId: string, data: DrawData) => void;
  "add-sticker": (boardId: string, data: StickerData) => void;
  "update-sticker": (boardId: string, data: StickerData) => void;
  "delete-sticker": (boardId: string, stickerId: string) => void;
  "user-joined": (data: { username: string }) => void;
  "user-left": (data: { username: string }) => void;
}

export interface SocketHook {
  isConnected: boolean;
  joinBoard: (boardId: string, username: string) => void;
  leaveBoard: (boardId: string) => void;
  drawOnBoard: (boardId: string, data: DrawData) => void;
  addSticker: (boardId: string, data: StickerData) => void;
  updateSticker: (boardId: string, data: StickerData) => void;
  deleteSticker: (boardId: string, stickerId: string) => void;
  onDraw: (callback: (data: DrawData) => void) => void;
  offDraw: (callback: (data: DrawData) => void) => void;
  onSticker: (callback: (data: StickerData) => void) => void;
  offSticker: (callback: (data: StickerData) => void) => void;
  onUpdateSticker: (callback: (data: StickerData) => void) => void;
  offUpdateSticker: (callback: (data: StickerData) => void) => void;
  onDeleteSticker: (callback: (stickerId: string) => void) => void;
  offDeleteSticker: (callback: (stickerId: string) => void) => void;
  onUserJoined: (callback: (data: { username: string }) => void) => void;
  offUserJoined: (callback: (data: { username: string }) => void) => void;
  onUserLeft: (callback: (data: { username: string }) => void) => void;
  offUserLeft: (callback: (data: { username: string }) => void) => void;
  onUsersUpdate: (callback: (users: string[]) => void) => void;
  offUsersUpdate: (callback: (users: string[]) => void) => void;
  joinError: string | null;
}

export interface SocketClient {
  joinBoard: (boardId: string, username: string) => void;
  leaveBoard: (boardId: string) => void;
  drawOnBoard: (boardId: string, data: DrawData) => void;
  addSticker: (boardId: string, data: StickerData) => void;
  updateSticker: (boardId: string, data: StickerData) => void;
  deleteSticker: (boardId: string, stickerId: string) => void;
}
