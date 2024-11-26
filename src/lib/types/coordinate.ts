// src/lib/types/coordinate.ts

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x: number; // Pan offset on the x-axis
  y: number; // Pan offset on the y-axis
  scale: number; // Zoom level
}
