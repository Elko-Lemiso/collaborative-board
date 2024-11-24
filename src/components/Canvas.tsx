"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { DrawData, StrokeData } from "@/lib/types/socket";

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

export const Canvas = ({
  boardId,
  username,
}: {
  boardId: string;
  username: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const socket = useSocket();

  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isDrawMode, setIsDrawMode] = useState(true); // Default to drawing mode

  useEffect(() => {
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
    loadBoardContent();
  }, []);
  const loadBoardContent = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/strokes`);
      const strokes = await res.json();

      if (strokes && drawingCanvasRef.current) {
        const ctx = drawingCanvasRef.current.getContext("2d");
        if (ctx) {
          ctx.translate(CENTER_OFFSET, CENTER_OFFSET); // First translation
          strokes.forEach((stroke: StrokeData) => {
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
          drawGrid();
        }
      }
    } catch (error) {
      console.error("Failed to load board strokes:", error);
    }
  };

  // Canvas drawing methods
  const drawGrid = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgb(229,231,235)";
    ctx.lineWidth = 1;

    const visibleStartX = -transform.x / transform.scale - CENTER_OFFSET;
    const visibleStartY = -transform.y / transform.scale - CENTER_OFFSET;
    const visibleWidth = canvas.width / transform.scale;
    const visibleHeight = canvas.height / transform.scale;

    const startX = Math.floor(visibleStartX / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(visibleStartY / GRID_SIZE) * GRID_SIZE;
    const endX = startX + visibleWidth + GRID_SIZE * 2;
    const endY = startY + visibleHeight + GRID_SIZE * 2;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const pixelX = (x + CENTER_OFFSET) * transform.scale + transform.x;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvas.height);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const pixelY = (y + CENTER_OFFSET) * transform.scale + transform.y;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(canvas.width, pixelY);
      ctx.stroke();
    }

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

  // Update getCanvasPoint for correct coordinate transformation
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

  const drawLine = useCallback(
    (from: Point, to: Point, color = "#000000", width = 2) => {
      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      // Set stroke style and line width
      drawingCtx.strokeStyle = color;
      drawingCtx.lineWidth = width;

      // Save the current state
      drawingCtx.save();

      // Clear previous transform and set new one
      drawingCtx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);

      // Draw the line
      drawingCtx.beginPath();
      drawingCtx.moveTo(from.x - CENTER_OFFSET, from.y - CENTER_OFFSET);
      drawingCtx.lineTo(to.x - CENTER_OFFSET, to.y - CENTER_OFFSET);
      drawingCtx.stroke();

      // Restore context
      drawingCtx.restore();

      // Update display
      drawGrid();
    },
    [drawGrid]
  );

  // Event handlers
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const delta = e.deltaY;
      const scaleChange = -delta / 500;
      const newScale = Math.min(
        Math.max(transform.scale + scaleChange, 0.1),
        5
      );

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setTransform((prev) => ({
        scale: newScale,
        x: prev.x - (x * (newScale - prev.scale)) / prev.scale,
        y: prev.y - (y * (newScale - prev.scale)) / prev.scale,
      }));
    },
    [transform]
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawMode || e.button !== 0) return;
      isDrawing.current = true;

      const point = getCanvasPoint(e.clientX, e.clientY);

      lastPoint.current = point;
    },
    [isDrawMode, getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing.current || !lastPoint.current) return;

      const currentPoint = getCanvasPoint(e.clientX, e.clientY);
      console.log("Drawn on Point:", currentPoint);

      const drawData: DrawData = {
        from: lastPoint.current,
        to: currentPoint,
        color: "#000000", // You can allow users to select colors
        width: 5, // You can allow users to select pen width
      };

      drawLine(drawData.from, drawData.to, drawData.color, drawData.width);

      socket.drawOnBoard(boardId, drawData);
      lastPoint.current = currentPoint;
    },
    [boardId, getCanvasPoint, drawLine, socket]
  );

  const startPan = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawMode && e.button === 0) return;

      e.preventDefault();
      isPanning.current = true;
      lastPoint.current = { x: e.clientX, y: e.clientY };
    },
    [isDrawMode]
  );

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

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  // Effects
  useEffect(() => {
    socket.joinBoard(boardId, username);

    // Listen for draw events
    socket.onDraw((data) => {
      drawLine(data.from, data.to, data.color, data.width);
    });

    // Clean up when component unmounts
    return () => {
      socket.leaveBoard(boardId);
    };
  }, [boardId, username, drawLine, socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    contextRef.current = ctx;

    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawGrid();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleWheel, drawGrid]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsDrawMode(!isDrawMode)}
          className={`px-4 py-2 rounded-md ${
            isDrawMode
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isDrawMode ? "Drawing Mode" : "Pan Mode"}
        </button>
      </div>
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
