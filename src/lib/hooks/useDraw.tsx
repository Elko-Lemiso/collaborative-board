// hooks/useDraw.ts
import { useState } from "react";
import { Point } from "../types/canvas";

interface UseDrawReturn {
  isDrawing: boolean;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
}

export const useDraw = (
  ctx: CanvasRenderingContext2D | null
): UseDrawReturn => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPos({ x, y });
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return {
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
  };
};
