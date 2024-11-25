// src/hooks/useCanvas.ts

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { DrawData, StrokeData } from "@/lib/types/socket";
import { StickerData } from "@/lib/types/sticker"; // Ensure this path is correct

// Constants
const VIRTUAL_SIZE = 10000;
const CENTER_OFFSET = VIRTUAL_SIZE / 2;
const GRID_SIZE = 40;

// Interfaces
interface Point {
  x: number;
  y: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const useCanvas = (boardId: string, username: string) => {
  // Refs for canvases and contexts
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs for drawing and panning states
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  // Socket instance
  const socket = useSocket();

  // State for transformations
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Ref for throttling mousemove events
  const requestRef = useRef<number>();
  const drawQueueRef = useRef<DrawData[]>([]);

  // Stickers array
  const stickersRef = useRef<StickerData[]>([]);

  /**
   * Initializes the offscreen drawing canvas and loads existing content.
   */
  useEffect(() => {
    // Create offscreen canvas for drawing
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

    // Load existing strokes and stickers from the server
    loadBoardContent();
  }, [boardId]);

  /**
   * Draws the grid and the current drawings onto the main canvas.
   */
  const drawGrid = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "rgb(229,231,235)";
    ctx.lineWidth = 1;

    // Calculate visible grid boundaries to optimize drawing
    const visibleStartX = -transform.x / transform.scale - CENTER_OFFSET;
    const visibleStartY = -transform.y / transform.scale - CENTER_OFFSET;
    const visibleWidth = canvas.width / transform.scale;
    const visibleHeight = canvas.height / transform.scale;

    const startX = Math.floor(visibleStartX / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(visibleStartY / GRID_SIZE) * GRID_SIZE;
    const endX = startX + visibleWidth + GRID_SIZE * 2;
    const endY = startY + visibleHeight + GRID_SIZE * 2;

    // Draw vertical grid lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const pixelX = (x + CENTER_OFFSET) * transform.scale + transform.x;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const pixelY = (y + CENTER_OFFSET) * transform.scale + transform.y;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(canvas.width, pixelY);
      ctx.stroke();
    }

    // Draw the offscreen drawing canvas onto the main canvas with transformations
    if (drawingCanvasRef.current) {
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
    }

    ctx.restore();
  }, [transform]);

  /**
   * Fetches existing strokes and stickers from the server and renders them.
   */
  const loadBoardContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/strokes`);
      const strokes: StrokeData[] = await res.json();

      if (strokes && drawingCanvasRef.current) {
        const ctx = drawingCanvasRef.current.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET); // Reset transform

          // Render strokes
          strokes.forEach((stroke) => {
            ctx.beginPath();
            ctx.moveTo(
              stroke.fromX - CENTER_OFFSET,
              stroke.fromY - CENTER_OFFSET
            );
            ctx.lineTo(stroke.toX - CENTER_OFFSET, stroke.toY - CENTER_OFFSET);
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.stroke();
          });

          // Render the grid and drawings
          drawGrid();
        }
      }
    } catch (error) {
      console.error("Failed to load board strokes:", error);
    }
  }, [boardId, drawGrid]);

  /**
   * Converts client (mouse) coordinates to virtual canvas coordinates.
   */
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

  /**
   * Draws a line on the offscreen drawing canvas and updates the main canvas.
   */
  const drawLine = useCallback(
    (from: Point, to: Point, color = "#000000", width = 2) => {
      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      // Set stroke style and line width
      drawingCtx.strokeStyle = color;
      drawingCtx.lineWidth = width;

      // Save the current state
      drawingCtx.save();

      // Clear any existing transform and set to default
      drawingCtx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);

      // Draw the line
      drawingCtx.beginPath();
      drawingCtx.moveTo(from.x - CENTER_OFFSET, from.y - CENTER_OFFSET);
      drawingCtx.lineTo(to.x - CENTER_OFFSET, to.y - CENTER_OFFSET);
      drawingCtx.stroke();

      // Restore context
      drawingCtx.restore();

      // Queue the grid to be redrawn
      requestRef.current = requestAnimationFrame(drawGrid);
    },
    [drawGrid]
  );

  /**
   * Renders a sticker on the drawing canvas.
   */
  const renderSticker = useCallback(
    async (ctx: CanvasRenderingContext2D, sticker: StickerData) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);

      // Load the image
      const image = new Image();
      image.src = sticker.imageUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject();
      });

      // Apply rotation if any
      ctx.translate(sticker.x - CENTER_OFFSET, sticker.y - CENTER_OFFSET);
      if (sticker.rotation) {
        ctx.rotate((sticker.rotation * Math.PI) / 180);
      }

      // Draw the image
      ctx.drawImage(
        image,
        -sticker.width / 2,
        -sticker.height / 2,
        sticker.width,
        sticker.height
      );

      ctx.restore();
    },
    []
  );

  /**
   * Adds a sticker to the canvas and emits it to other users.
   */
  const addSticker = useCallback(
    async (e: React.MouseEvent) => {
      const point = getCanvasPoint(e.clientX, e.clientY);

      // Assume you have a function to get the sticker image URL
      const imageUrl = await getStickerImageUrl(boardId);

      const sticker: StickerData = {
        id: generateUniqueId(),
        boardId,
        imageUrl: imageUrl ?? "",
        x: point.x,
        y: point.y,
        width: 100, // Adjust size as needed
        height: 100, // Adjust size as needed
        rotation: 0, // Default rotation
      };

      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      // Render the sticker
      await renderSticker(drawingCtx, sticker);

      // Save the sticker data
      stickersRef.current.push(sticker);

      // Redraw the grid and drawings
      requestRef.current = requestAnimationFrame(drawGrid);

      // Emit the sticker addition to other clients using the correct method
      socket.addSticker(boardId, sticker);

      // Optionally, send the sticker data to the server to persist
      await fetch(`/api/boards/${boardId}/stickers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sticker),
      });
    },
    [getCanvasPoint, renderSticker, drawGrid, boardId, socket]
  );

  /**
   * Handles the wheel event for zooming.
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY;
      const scaleChange = -delta / 500;
      let newScale = transform.scale + scaleChange;

      // Clamp the scale between 0.1 and 5
      newScale = Math.min(Math.max(newScale, 0.1), 5);

      // Calculate the focal point for zooming
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the new translation to keep the zoom centered at the mouse position
      const newX =
        mouseX - ((mouseX - transform.x) / transform.scale) * newScale;
      const newY =
        mouseY - ((mouseY - transform.y) / transform.scale) * newScale;

      setTransform(() => ({
        scale: newScale,
        x: newX,
        y: newY,
      }));
    },
    [transform]
  );

  /**
   * Starts the drawing process when the mouse is pressed down.
   */
  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDrawing.current = true;

      const point = getCanvasPoint(e.clientX, e.clientY);
      lastPoint.current = point;
    },
    [getCanvasPoint]
  );

  /**
   * Handles the drawing action as the mouse moves.
   */
  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || !lastPoint.current) return;

      const currentPoint = getCanvasPoint(e.clientX, e.clientY);

      const drawData: DrawData = {
        from: lastPoint.current,
        to: currentPoint,
        color: "#000000", // Default color; can be made dynamic
        width: 5, // Default width; can be made dynamic
      };

      // Queue the draw operation
      drawQueueRef.current.push(drawData);

      // Emit the draw data to other clients
      socket.drawOnBoard(boardId, drawData);

      // Update the last point
      lastPoint.current = currentPoint;

      // If not already queued for drawing, request an animation frame
      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(() => {
          const drawingCtx = drawingCanvasRef.current?.getContext("2d");
          if (!drawingCtx) return;

          // Process all queued draw operations
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

          // Clear the draw queue
          drawQueueRef.current = [];

          // Redraw the grid and drawings
          drawGrid();

          // Reset the requestRef
          requestRef.current = undefined;
        });
      }
    },
    [drawGrid, getCanvasPoint, boardId, socket]
  );

  /**
   * Stops the drawing process when the mouse is released or leaves the canvas.
   */
  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  /**
   * Starts the panning process when the mouse is pressed down.
   */
  const startPan = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
  }, []);

  /**
   * Handles the panning action as the mouse moves.
   */
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

  /**
   * Stops the panning process when the mouse is released or leaves the canvas.
   */
  const stopPan = useCallback(() => {
    isPanning.current = false;
    lastPoint.current = null;
  }, []);

  /**
   * Handles joining the board and listening for draw and sticker events from other users.
   */
  useEffect(() => {
    // Join the board room
    socket.joinBoard(boardId, username);

    // Define the draw event handler
    const handleDraw = (data: DrawData) => {
      drawLine(data.from, data.to, data.color, data.width);
    };

    // Define the sticker event handler
    const handleSticker = async (data: StickerData) => {
      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      // Render the sticker
      await renderSticker(drawingCtx, data);

      // Save the sticker data
      stickersRef.current.push(data);

      // Redraw the grid and drawings
      requestRef.current = requestAnimationFrame(drawGrid);
    };

    // Listen for draw and sticker events from other users using correct method names
    socket.onDraw(handleDraw);
    socket.onSticker(handleSticker);

    // Clean up event listeners on component unmount
    return () => {
      socket.offDraw(handleDraw);
      socket.offSticker(handleSticker);
      socket.leaveBoard(boardId);
    };
  }, [boardId, username, socket, drawLine, renderSticker, drawGrid]);

  /**
   * Initializes the main canvas context and draws the initial grid.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Get the canvas context
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize context settings
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    contextRef.current = ctx;

    // Draw the initial grid and drawings
    drawGrid();
  }, [drawGrid]);

  /**
   * Adds event listeners for wheel and resize events.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Attach wheel event listener for zooming
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Debounce function to limit the rate of resize handling
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          drawGrid();
        }
      }, 200); // Adjust the timeout as needed
    };

    // Attach resize event listener
    window.addEventListener("resize", handleResize);

    // Clean up event listeners on unmount
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleWheel, drawGrid]);

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
    addSticker, // Export the addSticker function
    getCanvasPoint,
    transform,
    stickersRef,
    drawGrid,
  };
};

export default useCanvas;

/**
 * Helper function to get sticker image URL.
 * Implement this to open a file selector or choose from predefined images.
 */
async function getStickerImageUrl(boardId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("sticker", file);

        try {
          const response = await fetch(
            `/api/boards/${boardId}/stickers/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (response.ok) {
            const data = await response.json();
            resolve(data.imageUrl);
          } else {
            console.error("Error uploading sticker image");
            resolve(null);
          }
        } catch (error) {
          console.error("Error uploading sticker image:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    input.click();
  });
}

/**
 * Helper function to generate a unique ID for the sticker.
 */
function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9);
}
