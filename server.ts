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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Adjust as needed for security
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");

    socket.on("join-board", ({ boardId, username }) => {
      socket.join(boardId);
      socket.to(boardId).emit("user-joined", { username });
      console.log(`${username} joined board ${boardId}`);
    });

    socket.on("leave-board", ({ boardId }) => {
      socket.leave(boardId);
      console.log(`User left board ${boardId}`);
    });

    interface DrawData {
      from: { x: number; y: number };
      to: { x: number; y: number };
      color?: string;
      width?: number;
    }

    socket.on("draw", async (boardId: string, data: DrawData) => {
      // Save the stroke to the database

      console.log("Saving stroke to database");
      console.log(data);
      
      try {
        await prisma.stroke
          .create({
            data: {
              boardId: boardId,
              fromX: data.from.x,
              fromY: data.from.y,
              toX: data.to.x,
              toY: data.to.y,
              color: data.color || "#000000",
              width: data.width || 2,
            },
          })
          .catch((error) => {
            console.error("Error saving stroke:", error);
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
      // Updated type to any for StickerData
      try {
        // Save the sticker to the database
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
            // Prisma automatically handles 'createdAt' and 'updatedAt' if defined in the schema
          },
        });
      } catch (error) {
        console.error("Error saving sticker:", error);
      }

      // Broadcast to other clients
      socket.to(boardId).emit("add-sticker", data);
    });

    // Handle sticker updates
    socket.on("update-sticker", async (boardId: string, data: StickerData) => {
      try {
        // Update the sticker in the database
        await prisma.sticker.update({
          where: { id: data.id },
          data: {
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            rotation: data.rotation || 0,
            // Update other fields as necessary
          },
        });
      } catch (error) {
        console.error("Error updating sticker:", error);
        return;
      }

      // Broadcast the updated sticker to other clients
      socket.to(boardId).emit("update-sticker", data);
    });

    // Handle sticker deletions
    socket.on("delete-sticker", async (boardId: string, stickerId: string) => {
      // Added
      try {
        // Delete the sticker from the database
        await prisma.sticker.delete({
          where: { id: stickerId },
        });
      } catch (error) {
        console.error("Error deleting sticker:", error);
        return;
      }

      // Broadcast the deletion to other clients
      socket.to(boardId).emit("delete-sticker", stickerId);
      console.log(`Sticker ${stickerId} deleted from board ${boardId}`);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
