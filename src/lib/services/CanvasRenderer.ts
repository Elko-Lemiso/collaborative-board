import { CanvasConfig, Transform } from "../types/canvas";
import { LoadedSticker } from "../types/sticker";

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private config: CanvasConfig;

  constructor(ctx: CanvasRenderingContext2D, config: CanvasConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  public clear(): void {
    const canvas = this.ctx.canvas;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.restore();
  }

  public drawGrid(transform: Transform): void {
    const ctx = this.ctx;
    const { GRID_SIZE, VIRTUAL_SIZE, CENTER_OFFSET } = this.config;

    ctx.save();
    ctx.setTransform(
      transform.scale,
      0,
      0,
      transform.scale,
      transform.x,
      transform.y
    );

    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1 / transform.scale;

    for (let x = 0; x < VIRTUAL_SIZE; x += GRID_SIZE) {
      ctx.moveTo(x - CENTER_OFFSET, -CENTER_OFFSET);
      ctx.lineTo(x - CENTER_OFFSET, VIRTUAL_SIZE - CENTER_OFFSET);
    }

    for (let y = 0; y < VIRTUAL_SIZE; y += GRID_SIZE) {
      ctx.moveTo(-CENTER_OFFSET, y - CENTER_OFFSET);
      ctx.lineTo(VIRTUAL_SIZE - CENTER_OFFSET, y - CENTER_OFFSET);
    }

    ctx.stroke();
    ctx.restore();
  }

  public drawStrokes(
    drawingCanvas: HTMLCanvasElement,
    transform: Transform
  ): void {
    this.ctx.save();
    this.ctx.setTransform(
      transform.scale,
      0,
      0,
      transform.scale,
      transform.x,
      transform.y
    );

    // Draw from the drawing canvas
    this.ctx.drawImage(
      drawingCanvas,
      -this.config.CENTER_OFFSET,
      -this.config.CENTER_OFFSET,
      this.config.VIRTUAL_SIZE,
      this.config.VIRTUAL_SIZE
    );

    this.ctx.restore();
  }

  public drawStickers(
    stickers: Map<string, LoadedSticker>,
    transform: Transform
  ): void {
    Array.from(stickers.values()).forEach((sticker) => {
      if (!sticker.imageElement) return;

      this.ctx.save();

      // Calculate screen position
      const virtualX = sticker.x - this.config.CENTER_OFFSET;
      const virtualY = sticker.y - this.config.CENTER_OFFSET;
      const screenX = virtualX * transform.scale + transform.x;
      const screenY = virtualY * transform.scale + transform.y;

      // Reset and set up transforms
      this.ctx.setTransform(1, 0, 0, 1, screenX, screenY);

      if (sticker.rotation) {
        this.ctx.rotate((sticker.rotation * Math.PI) / 180);
      }

      const scaledWidth = sticker.width * transform.scale;
      const scaledHeight = sticker.height * transform.scale;

      // Add shadow
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      this.ctx.shadowBlur = 5 * transform.scale;
      this.ctx.shadowOffsetX = 2 * transform.scale;
      this.ctx.shadowOffsetY = 2 * transform.scale;

      // Draw sticker
      this.ctx.drawImage(
        sticker.imageElement,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      this.ctx.restore();
    });
  }
}
