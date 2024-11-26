import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { DrawData, StrokeData } from "@/lib/types/socket";
import { StickerData } from "@/lib/types/sticker";

const VIRTUAL_SIZE = 10000;
const CENTER_OFFSET = VIRTUAL_SIZE / 2;
const GRID_SIZE = 40;

interface Point {
  x: number;
  y: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface LoadedSticker extends StickerData {
  imageElement?: HTMLImageElement;
}

export const useCanvas = (boardId: string, username: string) => {
  // Refs for canvases and contexts
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedStickersRef = useRef<Map<string, LoadedSticker>>(new Map());

  // State and initialization control
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const isInitialized = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  // Drawing and panning state refs
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const requestRef = useRef<number>();
  const drawQueueRef = useRef<DrawData[]>([]);

  const socket = useSocket();

  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Load sticker images
  const loadStickerImage = useCallback(
    async (sticker: StickerData): Promise<LoadedSticker> => {
      return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
          const loadedSticker: LoadedSticker = {
            ...sticker,
            imageElement: image,
          };
          loadedStickersRef.current.set(sticker.id, loadedSticker);
          resolve(loadedSticker);
        };

        image.onerror = () => {
          console.error(`Failed to load sticker image: ${sticker.imageUrl}`);
          resolve(sticker);
        };

        image.src = sticker.imageUrl;
      });
    },
    []
  );

  // Grid drawing function
  const drawGrid = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear everything first
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw grid lines...
    // (grid drawing code remains the same)

    // Draw strokes from offscreen canvas
    if (drawingCanvasRef.current) {
      ctx.save();
      ctx.setTransform(
        transform.scale,
        0,
        0,
        transform.scale,
        transform.x,
        transform.y
      );
      ctx.drawImage(
        drawingCanvasRef.current,
        -CENTER_OFFSET,
        -CENTER_OFFSET,
        VIRTUAL_SIZE,
        VIRTUAL_SIZE
      );
      ctx.restore();
    }

    // Draw all stickers
    const stickers = Array.from(loadedStickersRef.current.values());
    stickers.forEach((sticker) => {
      if (!sticker.imageElement) return;

      ctx.save();
      
      // Calculate screen position
      const virtualX = sticker.x - CENTER_OFFSET;
      const virtualY = sticker.y - CENTER_OFFSET;
      const screenX = virtualX * transform.scale + transform.x;
      const screenY = virtualY * transform.scale + transform.y;

      // Reset and set up transforms
      ctx.setTransform(1, 0, 0, 1, screenX, screenY);
      
      if (sticker.rotation) {
        ctx.rotate((sticker.rotation * Math.PI) / 180);
      }

      const scaledWidth = sticker.width * transform.scale;
      const scaledHeight = sticker.height * transform.scale;

      // Add shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 5 * transform.scale;
      ctx.shadowOffsetX = 2 * transform.scale;
      ctx.shadowOffsetY = 2 * transform.scale;

      // Draw sticker
      ctx.drawImage(
        sticker.imageElement,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      ctx.restore();
    });
  }, [transform]);

  // Canvas point conversion
  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - transform.x) / transform.scale;
      const y = (clientY - rect.top - transform.y) / transform.scale;

      return {
        x: x + CENTER_OFFSET,
        y: y + CENTER_OFFSET,
      };
    },
    [transform]
  );

  // Drawing functions
  const drawLine = useCallback(
    (from: Point, to: Point, color = "#000000", width = 2) => {
      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      drawingCtx.strokeStyle = color;
      drawingCtx.lineWidth = width;
      drawingCtx.save();
      drawingCtx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);

      drawingCtx.beginPath();
      drawingCtx.moveTo(from.x - CENTER_OFFSET, from.y - CENTER_OFFSET);
      drawingCtx.lineTo(to.x - CENTER_OFFSET, to.y - CENTER_OFFSET);
      drawingCtx.stroke();
      drawingCtx.restore();

      requestRef.current = requestAnimationFrame(drawGrid);
    },
    [drawGrid]
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDrawing.current = true;
      lastPoint.current = getCanvasPoint(e.clientX, e.clientY);
    },
    [getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || !lastPoint.current) return;

      const currentPoint = getCanvasPoint(e.clientX, e.clientY);

      const drawData: DrawData = {
        from: lastPoint.current,
        to: currentPoint,
        color: "#000000",
        width: 5,
      };

      drawQueueRef.current.push(drawData);
      socket.drawOnBoard(boardId, drawData);
      lastPoint.current = currentPoint;

      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(() => {
          const drawingCtx = drawingCanvasRef.current?.getContext("2d");
          if (!drawingCtx) return;

          drawQueueRef.current.forEach((data) => {
            drawingCtx.strokeStyle = data.color;
            drawingCtx.lineWidth = data.width;
            drawingCtx.beginPath();
            drawingCtx.moveTo(
              data.from.x - CENTER_OFFSET,
              data.from.y - CENTER_OFFSET
            );
            drawingCtx.lineTo(
              data.to.x - CENTER_OFFSET,
              data.to.y - CENTER_OFFSET
            );
            drawingCtx.stroke();
          });

          drawQueueRef.current = [];
          drawGrid();
          requestRef.current = undefined;
        });
      }
    },
    [drawGrid, getCanvasPoint, boardId, socket]
  );

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  // Pan functions
  const startPan = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
  }, []);

  const pan = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !lastPoint.current) return;

    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;

    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    lastPoint.current = { x: e.clientX, y: e.clientY };
  }, []);

  const stopPan = useCallback(() => {
    isPanning.current = false;
    lastPoint.current = null;
  }, []);

  // Sticker functions
  const addSticker = useCallback(
    async (e: React.MouseEvent) => {
      try {
        const point = getCanvasPoint(e.clientX, e.clientY);
        const imageUrl = await getStickerImageUrl(boardId);

        if (!imageUrl) return;

        const newSticker: StickerData = {
          id: generateUniqueId(),
          boardId,
          imageUrl,
          x: point.x,
          y: point.y,
          width: 100,
          height: 100,
          rotation: 0,
        };

        // Load the image first
        await loadStickerImage(newSticker);

        // Emit to other clients
        socket.addSticker(boardId, newSticker);

        // Persist to server
        await fetch(`/api/boards/${boardId}/stickers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSticker),
        });

        requestAnimationFrame(drawGrid);
      } catch (error) {
        console.error("Error adding sticker:", error);
      }
    },
    [boardId, getCanvasPoint, loadStickerImage, socket, drawGrid]
  );

  // Zoom handling
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY;
      const scaleChange = -delta / 500;
      let newScale = transform.scale + scaleChange;
      newScale = Math.min(Math.max(newScale, 0.1), 5);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX =
        mouseX - ((mouseX - transform.x) / transform.scale) * newScale;
      const newY =
        mouseY - ((mouseY - transform.y) / transform.scale) * newScale;

      setTransform({ scale: newScale, x: newX, y: newY });
    },
    [transform]
  );

  useEffect(() => {
    let mounted = true;
    const initializeBoard = async () => {
      if (!mounted || isInitialized.current) return;

      try {
        setIsLoadingStickers(true);
        isInitialized.current = true;

        // Create offscreen canvas
        const drawingCanvas = document.createElement("canvas");
        drawingCanvas.width = VIRTUAL_SIZE;
        drawingCanvas.height = VIRTUAL_SIZE;
        const ctx = drawingCanvas.getContext("2d");
        if (ctx) {
          ctx.translate(CENTER_OFFSET, CENTER_OFFSET);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 2;
        }
        drawingCanvasRef.current = drawingCanvas;

        // Join board room first
        socket.joinBoard(boardId, username);

        // Single fetch for initial data
        const [strokesRes, stickersRes] = await Promise.all([
          fetch(`/api/boards/${boardId}/strokes`),
          fetch(`/api/boards/${boardId}/stickers`),
        ]);

        if (!strokesRes.ok || !stickersRes.ok) {
          throw new Error("Failed to fetch board data");
        }

        const [strokes, stickers] = await Promise.all([
          strokesRes.json(),
          stickersRes.json(),
        ]);

        // Process initial strokes
        if (strokes && drawingCanvas) {
          const ctx = drawingCanvas.getContext("2d");
          if (ctx) {
            ctx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);
            strokes.forEach((stroke: StrokeData) => {
              ctx.beginPath();
              ctx.moveTo(
                stroke.fromX - CENTER_OFFSET,
                stroke.fromY - CENTER_OFFSET
              );
              ctx.lineTo(
                stroke.toX - CENTER_OFFSET,
                stroke.toY - CENTER_OFFSET
              );
              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = stroke.width;
              ctx.stroke();
            });
          }
        }

        // Process initial stickers
        if (mounted) {
          loadedStickersRef.current.clear();
          await Promise.all(stickers.map(loadStickerImage));
        }

        // Set up socket listeners for updates
        const handleDraw = (data: DrawData) => {
          drawLine(data.from, data.to, data.color, data.width);
        };

        const handleSticker = async (sticker: StickerData) => {
          await loadStickerImage(sticker);
          requestAnimationFrame(drawGrid);
        };

        socket.onDraw(handleDraw);
        socket.onSticker(handleSticker);

        // Initial render
        if (mounted) {
          requestAnimationFrame(drawGrid);
        }

        return () => {
          socket.offDraw(handleDraw);
          socket.offSticker(handleSticker);
        };
      } catch (error) {
        console.error("Failed to initialize board:", error);
      } finally {
        if (mounted) {
          setIsLoadingStickers(false);
        }
      }
    };

    initializeBoard();

    return () => {
      mounted = false;
      isInitialized.current = false;
      socket.leaveBoard(boardId);
    };
  }, [boardId, username]);

  // Canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial canvas setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    contextRef.current = ctx;

    // Handle wheel events
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Handle window resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          drawGrid();
        }
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    // Initial draw
    drawGrid();

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [drawGrid, handleWheel]);

  return {
    canvasRef,
    isPanning,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    startPan,
    pan,
    stopPan,
    addSticker,
    getCanvasPoint,
    transform,
    isLoadingStickers,
    drawGrid,
    loadedStickersRef,
  };
};

/**
 * Helper function to get sticker image URL with validation and optimization.
 */
async function getStickerImageUrl(boardId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        // Validate file
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          console.error("File too large (max 5MB)");
          resolve(null);
          return;
        }

        if (!file.type.startsWith("image/")) {
          console.error("Invalid file type");
          resolve(null);
          return;
        }

        const formData = new FormData();
        formData.append("sticker", file);

        const response = await fetch(`/api/boards/${boardId}/stickers/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        resolve(data.imageUrl);
      } catch (error) {
        console.error("Error uploading sticker image:", error);
        resolve(null);
      }
    };

    input.click();
  });
}

/**
 * Helper function to generate a unique ID for stickers
 * using timestamp and random string for better uniqueness.
 */
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default useCanvas;
