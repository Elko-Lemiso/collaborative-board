import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { DrawData } from "@/lib/types/canvas";
import { StickerData } from "../types/sticker";
import { SocketHook } from "@/lib/types/socket";

export const useSocket = (): SocketHook => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const socketOptions = {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
      socketOptions
    );
    const socket = socketRef.current;

    // Connection handlers
    const handleConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);
      setJoinError(null);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const handleError = (error: Error) => {
      console.error("Socket error:", error);
      setJoinError(error.message);
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    };

    const handleJoinError = (error: { message: string }) => {
      setJoinError(error.message);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);
    socket.on("reconnect_attempt", handleReconnect);
    socket.on("join-error", handleJoinError);

    // Set initial connection state
    setIsConnected(socket.connected);

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("reconnect_attempt", handleReconnect);
      socket.off("join-error", handleJoinError);
      socket.disconnect();
    };
  }, []);

  // Helper function to safely get the socket
  const getSocket = (): Socket => {
    if (!socketRef.current) {
      throw new Error("Socket not initialized");
    }
    return socketRef.current;
  };

  // Socket event handlers
  const joinBoard = useCallback(
    (boardId: string, username: string) => {
      try {
        const socket = getSocket();
        if (!isConnected) {
          console.log("Socket not connected, attempting to reconnect...");
          socket.connect();
        }
        console.log(`Joining board ${boardId} as ${username}`);
        socket.emit("join-board", { boardId, username });
      } catch (error) {
        console.error(error);
      }
    },
    [isConnected]
  );

  const leaveBoard = useCallback((boardId: string) => {
    try {
      const socket = getSocket();
      socket.emit("leave-board", { boardId });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const drawOnBoard = useCallback((boardId: string, data: DrawData) => {
    try {
      const socket = getSocket();
      socket.emit("draw", boardId, data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const addSticker = useCallback((boardId: string, data: StickerData) => {
    try {
      const socket = getSocket();
      socket.emit("add-sticker", boardId, data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const updateSticker = useCallback((boardId: string, data: StickerData) => {
    try {
      const socket = getSocket();
      socket.emit("update-sticker", boardId, data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const deleteSticker = useCallback((boardId: string, stickerId: string) => {
    try {
      const socket = getSocket();
      socket.emit("delete-sticker", boardId, stickerId);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Adding event listeners
  const onDraw = useCallback((callback: (data: DrawData) => void) => {
    try {
      const socket = getSocket();
      socket.on("draw", callback);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const onSticker = useCallback((callback: (data: StickerData) => void) => {
    try {
      const socket = getSocket();
      socket.on("add-sticker", callback);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const onUpdateSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      try {
        const socket = getSocket();
        socket.on("update-sticker", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onDeleteSticker = useCallback(
    (callback: (stickerId: string) => void) => {
      try {
        const socket = getSocket();
        socket.on("delete-sticker", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onUserJoined = useCallback(
    (callback: (data: { username: string }) => void) => {
      try {
        const socket = getSocket();
        socket.on("user-joined", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onUserLeft = useCallback(
    (callback: (data: { username: string }) => void) => {
      try {
        const socket = getSocket();
        socket.on("user-left", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  // Removing event listeners
  const offDraw = useCallback((callback: (data: DrawData) => void) => {
    try {
      const socket = getSocket();
      socket.off("draw", callback);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const offSticker = useCallback((callback: (data: StickerData) => void) => {
    try {
      const socket = getSocket();
      socket.off("add-sticker", callback);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const offUpdateSticker = useCallback(
    (callback: (data: StickerData) => void) => {
      try {
        const socket = getSocket();
        socket.off("update-sticker", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const offDeleteSticker = useCallback(
    (callback: (stickerId: string) => void) => {
      try {
        const socket = getSocket();
        socket.off("delete-sticker", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const offUserJoined = useCallback(
    (callback: (data: { username: string }) => void) => {
      try {
        const socket = getSocket();
        socket.off("user-joined", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const offUserLeft = useCallback(
    (callback: (data: { username: string }) => void) => {
      try {
        const socket = getSocket();
        socket.off("user-left", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onUsersUpdate = useCallback((callback: (users: string[]) => void) => {
    try {
      const socket = getSocket();
      socket.on("users-update", callback);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const offUsersUpdate = useCallback(
    (callback: (users: string[]) => void) => {
      try {
        const socket = getSocket();
        socket.off("users-update", callback);
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  return {
    isConnected,
    joinBoard,
    leaveBoard,
    drawOnBoard,
    addSticker,
    updateSticker,
    deleteSticker,
    onDraw,
    offDraw,
    onSticker,
    offSticker,
    onUpdateSticker,
    offUpdateSticker,
    onDeleteSticker,
    offDeleteSticker,
    onUserJoined,
    offUserJoined,
    onUserLeft,
    offUserLeft,
    onUsersUpdate,
    offUsersUpdate,
    joinError,
  };
};