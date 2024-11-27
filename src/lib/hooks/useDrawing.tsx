import { useCallback, useRef, useEffect, useState } from "react";
import {
  Transform,
  Point,
  DrawData,
  CanvasConfig,
  StrokeData,
} from "../types/canvas";
import { SocketHook } from "@/lib/types/socket";
interface UseDrawingProps {
  boardId: string;
  transform: Transform;
  config: CanvasConfig;
  socket: SocketHook;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onDraw?: () => void;
}

export function useDrawing({
  boardId,
  transform,
  config,
  socket,
  canvasRef,
  onDraw,
}: UseDrawingProps) {
  const lastPoint = useRef<Point | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>();
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize the drawing canvas
  useEffect(() => {
    const drawingCanvas = document.createElement("canvas");
    drawingCanvas.width = config.VIRTUAL_SIZE;
    drawingCanvas.height = config.VIRTUAL_SIZE;
    const ctx = drawingCanvas.getContext("2d");
    if (ctx) {
      ctx.translate(config.CENTER_OFFSET, config.CENTER_OFFSET);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
    }
    drawingCanvasRef.current = drawingCanvas;

    // Fetch existing strokes and draw them
    fetch(`/api/boards/${boardId}/strokes`)
      .then((res) => res.json())
      .then((strokes) => {
        strokes.forEach((stroke: StrokeData) => {
          drawLine(
            { x: stroke.fromX, y: stroke.fromY },
            { x: stroke.toX, y: stroke.toY },
            stroke.color,
            stroke.width
          );
        });
      })
      .catch(console.error);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [boardId, config]);

  const drawLine = useCallback(
    (from: Point, to: Point, color = "#000000", width = 2) => {
      const drawingCtx = drawingCanvasRef.current?.getContext("2d");
      if (!drawingCtx) return;

      drawingCtx.strokeStyle = color;
      drawingCtx.lineWidth = width;
      drawingCtx.beginPath();
      drawingCtx.moveTo(
        from.x - config.CENTER_OFFSET,
        from.y - config.CENTER_OFFSET
      );
      drawingCtx.lineTo(
        to.x - config.CENTER_OFFSET,
        to.y - config.CENTER_OFFSET
      );
      drawingCtx.stroke();

      // Request a redraw of the main canvas
      if (onDraw) {
        requestAnimationFrame(onDraw);
      }
    },
    [config.CENTER_OFFSET, onDraw]
  );

  // Socket event handlers
  useEffect(() => {
    // Handle drawing events from other users
    const handleRemoteDraw = (data: DrawData) => {
      console.log("Received remote draw:", data);
      drawLine(data.from, data.to, data.color, data.width);
    };

    socket.onDraw(handleRemoteDraw);

    return () => {
      socket.offDraw(handleRemoteDraw);
    };
  }, [socket, drawLine]);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - transform.x) / transform.scale;
      const y = (clientY - rect.top - transform.y) / transform.scale;

      return {
        x: x + config.CENTER_OFFSET,
        y: y + config.CENTER_OFFSET,
      };
    },
    [transform, canvasRef, config.CENTER_OFFSET]
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      lastPoint.current = getCanvasPoint(e.clientX, e.clientY);
    },
    [getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !lastPoint.current) return;

      const currentPoint = getCanvasPoint(e.clientX, e.clientY);

      const drawData: DrawData = {
        from: lastPoint.current,
        to: currentPoint,
        color: "#000000",
        width: 5,
      };

      // Draw locally
      drawLine(drawData.from, drawData.to, drawData.color, drawData.width);

      // Emit to other users via socket
      socket.drawOnBoard(boardId, drawData);

      lastPoint.current = currentPoint;
    },
    [boardId, getCanvasPoint, drawLine, socket, isDrawing]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  return {
    isDrawing,
    drawingCanvasRef,
    startDrawing,
    draw,
    stopDrawing,
    drawLine,
  };
}
