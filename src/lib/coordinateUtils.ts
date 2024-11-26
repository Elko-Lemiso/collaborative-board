// src/lib/utils/coordinateUtils.ts
import { Transform, Point } from "@/lib/types/coordinate";
import { CENTER_OFFSET } from "./constants";

/**
 * Converts screen (client) coordinates to virtual canvas coordinates.
 * @param clientX - The x-coordinate on the screen.
 * @param clientY - The y-coordinate on the screen.
 * @param canvasRect - The bounding rectangle of the canvas.
 * @param transform - The current transformation (pan and zoom).
 * @returns The corresponding point on the virtual canvas.
 */
export const screenToVirtual = (
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  transform: Transform
): Point => {
  const x =
    (clientX - canvasRect.left - transform.x) / transform.scale + CENTER_OFFSET;
  const y =
    (clientY - canvasRect.top - transform.y) / transform.scale + CENTER_OFFSET;
  return { x, y };
};

/**
 * Converts virtual canvas coordinates to screen coordinates.
 * @param virtualX - The x-coordinate on the virtual canvas.
 * @param virtualY - The y-coordinate on the virtual canvas.
 * @param transform - The current transformation (pan and zoom).
 * @returns The corresponding point on the screen.
 */
export const virtualToScreen = (
  virtualX: number,
  virtualY: number,
  transform: Transform
): Point => {
  const x = (virtualX - CENTER_OFFSET) * transform.scale + transform.x;
  const y = (virtualY - CENTER_OFFSET) * transform.scale + transform.y;
  return { x, y };
};
