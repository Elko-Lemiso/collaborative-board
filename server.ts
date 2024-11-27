// server.ts
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { parse } from "url";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

// Track users per board
const boardUsers = new Map<string, Map<string, string>>();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");
    let currentBoardId: string | null = null;
    let currentUsername: string | null = null;

    socket.on("join-board", ({ boardId, username }) => {
      currentBoardId = boardId;
      currentUsername = username;

      // Initialize board users map if not exists
      if (!boardUsers.has(boardId)) {
        boardUsers.set(boardId, new Map());
      }

      const usersMap = boardUsers.get(boardId)!;

      // Check if username already exists in this board
      if (usersMap.has(username)) {
        // Username already connected in this board
        // Send an error message to the client
        socket.emit("join-error", {
          message: "Username already connected from another device.",
        });
        console.log(
          `Duplicate username '${username}' attempted to join board '${boardId}'. Connection refused.`
        );
        return;
      }

      // Add user to board
      usersMap.set(username, socket.id);

      socket.join(boardId);

      // Emit current users list to all clients in the board
      const users = Array.from(usersMap.keys());
      io.to(boardId).emit("users-update", users);

      console.log(`${username} joined board ${boardId}. Current users:`, users);
    });

    socket.on("leave-board", ({ boardId, username }) => {
      const usersMap = boardUsers.get(boardId);
      if (usersMap) {
        usersMap.delete(username);

        // Clean up empty boards
        if (usersMap.size === 0) {
          boardUsers.delete(boardId);
        } else {
          // Emit updated users list
          const users = Array.from(usersMap.keys());
          io.to(boardId).emit("users-update", users);
        }
      }

      socket.leave(boardId);
      currentBoardId = null;
      currentUsername = null;
      console.log(`${username} left board ${boardId}`);
    });

    socket.on("disconnect", () => {
      // Clean up user from their current board
      if (currentBoardId && currentUsername) {
        const usersMap = boardUsers.get(currentBoardId);
        if (usersMap) {
          usersMap.delete(currentUsername);

          // Clean up empty boards
          if (usersMap.size === 0) {
            boardUsers.delete(currentBoardId);
          } else {
            // Emit updated users list
            const users = Array.from(usersMap.keys());
            io.to(currentBoardId).emit("users-update", users);
          }
        }
      }
      console.log(
        `User '${currentUsername}' disconnected from board '${currentBoardId}'.`
      );
    });

    interface DrawData {
      from: { x: number; y: number };
      to: { x: number; y: number };
      color?: string;
      width?: number;
    }

    socket.on("draw", async (boardId: string, data: DrawData) => {
      try {
        await prisma.stroke.create({
          data: {
            boardId: boardId,
            fromX: data.from.x,
            fromY: data.from.y,
            toX: data.to.x,
            toY: data.to.y,
            color: data.color || "#000000",
            width: data.width || 2,
          },
        });
      } catch (error) {
        console.error("Error saving stroke:", error);
      }

      // Broadcast to other clients
      socket.to(boardId).emit("draw", data);
    });

    interface StickerData {
      id: string;
      imageUrl: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }

    socket.on("add-sticker", async (boardId: string, data: StickerData) => {
      try {
        await prisma.sticker.create({
          data: {
            id: data.id,
            boardId: boardId,
            imageUrl: data.imageUrl,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            rotation: data.rotation || 0,
          },
        });
      } catch (error) {
        console.error("Error saving sticker:", error);
      }

      // Broadcast to other clients
      socket.to(boardId).emit("add-sticker", data);
    });

    socket.on("update-sticker", async (boardId: string, data: StickerData) => {
      try {
        await prisma.sticker.update({
          where: { id: data.id },
          data: {
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            rotation: data.rotation || 0,
          },
        });
      } catch (error) {
        console.error("Error updating sticker:", error);
        return;
      }

      // Broadcast to other clients
      socket.to(boardId).emit("update-sticker", data);
    });

    socket.on("delete-sticker", async (boardId: string, stickerId: string) => {
      try {
        await prisma.sticker.delete({
          where: { id: stickerId },
        });
      } catch (error) {
        console.error("Error deleting sticker:", error);
        return;
      }

      // Broadcast to other clients
      socket.to(boardId).emit("delete-sticker", stickerId);
      console.log(`Sticker ${stickerId} deleted from board ${boardId}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
