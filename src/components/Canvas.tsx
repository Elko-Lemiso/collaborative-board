// src/components/Canvas/Canvas.tsx

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { DrawData, StrokeData } from "@/lib/types/socket";

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

export const Canvas = ({
  boardId,
  username,
}: {
  boardId: string;
  username: string;
}) => {
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

  // State to toggle between drawing and panning modes
  const [isDrawMode, setIsDrawMode] = useState(true); // Default to drawing mode

  // Ref for throttling mousemove events
  const requestRef = useRef<number>();
  const drawQueueRef = useRef<DrawData[]>([]);

  /**
   * Initializes the offscreen drawing canvas and loads existing strokes.
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

    // Load existing strokes from the server
    loadBoardContent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  /**
   * Draws the grid and the current drawings onto the main canvas.
   * This function is optimized to minimize expensive operations.
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
   * Fetches existing strokes from the server and renders them on the offscreen canvas.
   */
  const loadBoardContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/strokes`);
      const strokes: StrokeData[] = await res.json();

      if (strokes && drawingCanvasRef.current) {
        const ctx = drawingCanvasRef.current.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET); // Reset transform
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
          drawGrid(); // Render the grid and drawings
        }
      }
    } catch (error) {
      console.error("Failed to load board strokes:", error);
    }
  }, [boardId, drawGrid]);

  /**
   * Converts client (mouse) coordinates to virtual canvas coordinates.
   * This function is optimized by using useCallback and minimizing calculations.
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
   * Optimized by batching draw operations using requestAnimationFrame.
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
   * Handles the wheel event for zooming.
   * Optimized by using useCallback and preventing excessive state updates.
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
      if (!isDrawMode || e.button !== 0) return;
      isDrawing.current = true;

      const point = getCanvasPoint(e.clientX, e.clientY);
      lastPoint.current = point;
    },
    [isDrawMode, getCanvasPoint]
  );

  /**
   * Handles the drawing action as the mouse moves.
   * Optimized by queuing draw operations and using requestAnimationFrame.
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
   * Starts the panning process when the mouse is pressed down.
   */
  const startPan = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawMode && e.button === 0) return;

      e.preventDefault();
      isPanning.current = true;
      lastPoint.current = { x: e.clientX, y: e.clientY };
    },
    [isDrawMode]
  );

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
   * Stops the drawing process when the mouse is released or leaves the canvas.
   */
  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  /**
   * Handles joining the board and listening for draw events from other users.
   * Optimized by using useCallback and cleaning up listeners on unmount.
   */
  useEffect(() => {
    // Join the board room
    socket.joinBoard(boardId, username);

    // Define the draw event handler
    const handleDraw = (data: DrawData) => {
      drawLine(data.from, data.to, data.color, data.width);
    };

    // Listen for draw events from other users
    socket.onDraw(handleDraw);

    // Clean up event listeners on component unmount
    return () => {
      socket.offDraw(handleDraw);
      socket.leaveBoard(boardId);
    };
  }, [boardId, username, socket, drawLine]);

  /**
   * Initializes the main canvas context and draws the initial grid.
   * Optimized by minimizing context state changes.
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
   * Optimized by debouncing resize events and using useCallback.
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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Toggle Button for Drawing and Panning Modes */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setIsDrawMode(!isDrawMode)}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            isDrawMode
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isDrawMode ? "Drawing Mode" : "Pan Mode"}
        </button>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          if (isDrawMode && e.button === 0) {
            startDrawing(e);
          } else {
            startPan(e);
          }
        }}
        onMouseMove={(e) => {
          if (isPanning.current) {
            pan(e);
          } else if (isDrawing.current) {
            draw(e);
          }
        }}
        onMouseUp={() => {
          stopDrawing();
          stopPan();
        }}
        onMouseLeave={() => {
          stopDrawing();
          stopPan();
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full touch-none"
        style={{
          cursor: isDrawMode
            ? "crosshair"
            : isPanning.current
            ? "grabbing"
            : "grab",
        }}
      />
    </div>
  );
};

export default Canvas;
