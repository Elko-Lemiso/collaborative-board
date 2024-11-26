import { useCallback, useState } from "react";
import { Transform, Point } from "../types/canvas";

interface UseTransformProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useTransform({ canvasRef }: UseTransformProps) {
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });

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
    [transform, canvasRef]
  );

  const handlePanStart = useCallback((e: React.MouseEvent): Point => {
    return { x: e.clientX, y: e.clientY };
  }, []);

  const handlePanMove = useCallback(
    (startPoint: Point, e: React.MouseEvent) => {
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      return { x: e.clientX, y: e.clientY };
    },
    []
  );

  return {
    transform,
    setTransform,
    handleWheel,
    handlePanStart,
    handlePanMove,
  };
}
