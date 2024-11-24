// server.ts

import express from "express";
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new SocketIOServer(server);

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

    socket.on("draw", async (boardId: string, data) => {
      try {
        // Save the stroke to the database
        await prisma.stroke.create({
          data: {
            boardId: boardId,
            fromX: data.from.x,
            fromY: data.from.y,
            toX: data.to.x,
            toY: data.to.y,
            color: data.color || "#000000", // Default color if not provided
            width: data.width || 2, // Default width if not provided
          },
        });
      } catch (error) {
        console.error("Error saving stroke:", error);
      }

      // Broadcast to other clients
      socket.to(boardId).emit("draw", data);
    });

    socket.on("add-sticker", (boardId: string, data) => {
      socket.to(boardId).emit("add-sticker", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  // Handle all HTTP requests through Next.js
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
