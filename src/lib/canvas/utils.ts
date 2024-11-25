// utils.tsx
import { StrokeData } from "@/lib/types/socket";

export const VIRTUAL_SIZE = 10000;
export const CENTER_OFFSET = VIRTUAL_SIZE / 2;
export const GRID_SIZE = 40;

interface Point {
  x: number;
  y: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  transform: Transform,
  drawingCanvas: HTMLCanvasElement | null
) => {
  if (!ctx || !canvas) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
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

  if (drawingCanvas) {
    ctx.setTransform(
      transform.scale,
      0,
      0,
      transform.scale,
      transform.x,
      transform.y
    );
    ctx.drawImage(
      drawingCanvas,
      -CENTER_OFFSET,
      -CENTER_OFFSET,
      VIRTUAL_SIZE,
      VIRTUAL_SIZE
    );
  }

  ctx.restore();
};

export const loadBoardContent = async (
  boardId: string,
  drawingCanvas: HTMLCanvasElement | null,
  drawGridCallback: () => void
) => {
  try {
    const res = await fetch(`/api/boards/${boardId}/strokes`);
    const strokes: StrokeData[] = await res.json();

    if (strokes && drawingCanvas) {
      const ctx = drawingCanvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, CENTER_OFFSET, CENTER_OFFSET);
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
        drawGridCallback();
      }
    }
  } catch (error) {
    console.error("Failed to load board strokes:", error);
  }
};

export const drawLine = (
  drawingCanvas: HTMLCanvasElement | null,
  from: Point,
  to: Point,
  color: string = "#000000",
  width: number = 2,
  drawGridCallback: () => void
) => {
  const drawingCtx = drawingCanvas?.getContext("2d");
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

  requestAnimationFrame(drawGridCallback);
};

export const getCanvasPoint = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement | null,
  transform: Transform,
  centerOffset: number
): Point => {
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - transform.x) / transform.scale;
  const y = (clientY - rect.top - transform.y) / transform.scale;

  return {
    x: x + centerOffset,
    y: y + centerOffset,
  };
};
