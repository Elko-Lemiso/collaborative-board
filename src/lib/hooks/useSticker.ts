// src/hooks/useSticker.ts

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { StickerData } from "@/lib/types/sticker";
import { virtualToScreen } from "@/lib/coordinateUtils";
import { Transform } from "@/lib/types/coordinate";

// Interfaces
interface UseStickerProps {
  boardId: string;
  transform: Transform;
  drawGrid: () => void;
  getOffscreenContext: () => CanvasRenderingContext2D | null;
}

interface StickerDataWithImage extends StickerData {
  imageElement?: HTMLImageElement;
}

export const useSticker = ({
  boardId,
  transform,
  drawGrid,
  getOffscreenContext,
}: UseStickerProps) => {
  const socket = useSocket();

  // Stickers array with images
  const stickersRef = useRef<StickerDataWithImage[]>([]);

  /**
   * Renders a sticker on the provided canvas context.
   */
  const renderSticker = useCallback(
    async (ctx: CanvasRenderingContext2D, sticker: StickerDataWithImage) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      if (sticker.imageElement) {
        // Convert virtual coordinates to screen coordinates
        const screenPos = virtualToScreen(sticker.x, sticker.y, transform);

        // Apply transformations
        ctx.translate(screenPos.x, screenPos.y);
        if (sticker.rotation) {
          ctx.rotate((sticker.rotation * Math.PI) / 180);
        }

        // Draw the image centered
        ctx.drawImage(
          sticker.imageElement,
          (-sticker.width * transform.scale) / 2,
          (-sticker.height * transform.scale) / 2,
          sticker.width * transform.scale,
          sticker.height * transform.scale
        );
      }

      ctx.restore();
    },
    [transform]
  );

  /**
   * Adds a sticker to the canvas and emits it to other users.
   */
  const addSticker = useCallback(
    async (
      e: React.MouseEvent,
      getCanvasPoint: (
        clientX: number,
        clientY: number
      ) => { x: number; y: number }
    ) => {
      const point = getCanvasPoint(e.clientX, e.clientY);

      // Get the sticker image URL
      const imageUrl = await getStickerImageUrl(boardId);

      if (!imageUrl) return;

      const image = new Image();
      image.src = imageUrl;
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error(`Failed to load image: ${imageUrl}`));
        });
      } catch (error) {
        console.error(error);
        return;
      }

      const sticker: StickerDataWithImage = {
        id: generateUniqueId(),
        boardId,
        imageUrl: imageUrl ?? "",
        x: point.x,
        y: point.y,
        width: 100, // Adjust size as needed
        height: 100, // Adjust size as needed
        rotation: 0, // Default rotation
        imageElement: image,
      };

      // Render the sticker
      const offscreenCtx = getOffscreenContext();
      if (offscreenCtx) {
        await renderSticker(offscreenCtx, sticker);
      }

      // Save the sticker data
      stickersRef.current.push(sticker);

      // Redraw the grid and drawings
      drawGrid();

      // Emit the sticker addition to other clients
      socket.addSticker(boardId, {
        id: sticker.id,
        boardId: sticker.boardId,
        imageUrl: sticker.imageUrl,
        x: sticker.x,
        y: sticker.y,
        width: sticker.width,
        height: sticker.height,
        rotation: sticker.rotation,
      });

      // Persist the sticker to the server
      await fetch(`/api/boards/${boardId}/stickers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: sticker.id,
          boardId: sticker.boardId,
          imageUrl: sticker.imageUrl,
          x: sticker.x,
          y: sticker.y,
          width: sticker.width,
          height: sticker.height,
          rotation: sticker.rotation,
        }),
      });
    },
    [boardId, renderSticker, drawGrid, socket, getOffscreenContext]
  );

  /**
   * Updates a sticker on the canvas and emits the update to other users.
   */
  const updateSticker = useCallback(
    async (updatedSticker: StickerData) => {
      // Emit the updated sticker to other clients
      const { ...stickerWithoutImage } = updatedSticker as StickerDataWithImage;
      socket.updateSticker(boardId, stickerWithoutImage);

      // Update the sticker on the server
      await fetch(`/api/boards/${boardId}/stickers/${updatedSticker.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSticker),
      }).catch((error) =>
        console.error("Error updating sticker on server:", error)
      );

      // Update the local sticker
      const index = stickersRef.current.findIndex(
        (s) => s.id === updatedSticker.id
      );
      if (index !== -1) {
        stickersRef.current[index] = {
          ...stickersRef.current[index],
          ...updatedSticker,
        };

        // Reload the image if imageUrl has changed
        if (
          updatedSticker.imageUrl &&
          updatedSticker.imageUrl !== stickersRef.current[index].imageUrl
        ) {
          try {
            const image = new Image();
            image.src = updatedSticker.imageUrl;
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () =>
                reject(
                  new Error(`Failed to load image: ${updatedSticker.imageUrl}`)
                );
            });
            stickersRef.current[index].imageElement = image;
          } catch (error) {
            console.error("Error loading updated sticker image:", error);
            return;
          }
        }

        // Re-render the updated sticker
        const offscreenCtx = getOffscreenContext();
        if (offscreenCtx) {
          await renderSticker(offscreenCtx, stickersRef.current[index]);
        }

        // Redraw the grid and drawings
        drawGrid();
      }
    },
    [boardId, socket, renderSticker, drawGrid, getOffscreenContext]
  );

  /**
   * Deletes a sticker from the canvas and emits the deletion to other users.
   */
  const deleteSticker = useCallback(
    async (stickerId: string) => {
      // Remove the sticker from local state
      const index = stickersRef.current.findIndex((s) => s.id === stickerId);
      if (index !== -1) {
        stickersRef.current.splice(index, 1);

        // Redraw the grid and drawings
        drawGrid();

        // Emit the deletion to other clients
        socket.deleteSticker(boardId, stickerId);

        // Remove the sticker from the server
        await fetch(`/api/boards/${boardId}/stickers/${stickerId}`, {
          method: "DELETE",
        }).catch((error) =>
          console.error("Error deleting sticker on server:", error)
        );
      }
    },
    [boardId, drawGrid, socket]
  );

  /**
   * Rotates a sticker by a specified angle and emits the update to other users.
   */
  const rotateSticker = useCallback(
    async (stickerId: string, angle: number) => {
      const index = stickersRef.current.findIndex((s) => s.id === stickerId);
      if (index !== -1) {
        const sticker = stickersRef.current[index];
        const newRotation = (sticker.rotation + angle) % 360;

        const updatedSticker: StickerData = {
          ...sticker,
          rotation: newRotation,
        };

        // Update the sticker locally
        stickersRef.current[index] = updatedSticker;

        // Re-render the sticker
        const offscreenCtx = getOffscreenContext();
        if (offscreenCtx) {
          await renderSticker(offscreenCtx, stickersRef.current[index]);
        }

        // Redraw the grid and drawings
        drawGrid();

        // Emit the updated sticker
        await updateSticker(updatedSticker);
      }
    },
    [updateSticker, drawGrid, renderSticker, getOffscreenContext]
  );

  /**
   * Loads existing stickers from the server and renders them.
   */
  const loadStickers = useCallback(async () => {
    try {
      const resStickers = await fetch(`/api/boards/${boardId}/stickers`);
      const stickers: StickerData[] = await resStickers.json();

      for (const sticker of stickers) {
        try {
          const image = new Image();
          image.src = sticker.imageUrl;
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () =>
              reject(new Error(`Failed to load image: ${sticker.imageUrl}`));
          });

          const stickerWithImage: StickerDataWithImage = {
            ...sticker,
            imageElement: image,
          };

          stickersRef.current.push(stickerWithImage);

          // Render the sticker
          const offscreenCtx = getOffscreenContext();
          if (offscreenCtx) {
            await renderSticker(offscreenCtx, stickerWithImage);
          }
        } catch (error) {
          console.error("Error loading sticker image:", error);
        }
      }

      // Redraw the grid and drawings
      drawGrid();
    } catch (error) {
      console.error("Failed to load stickers:", error);
    }
  }, [boardId, renderSticker, drawGrid, getOffscreenContext]);

  /**
   * Handles incoming sticker additions from other users.
   */
  const handleIncomingSticker = useCallback(
    async (data: StickerData) => {
      try {
        const image = new Image();
        image.src = data.imageUrl;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error(`Failed to load image: ${data.imageUrl}`));
        });

        const stickerWithImage: StickerDataWithImage = {
          ...data,
          imageElement: image,
        };

        stickersRef.current.push(stickerWithImage);

        // Render the sticker
        const offscreenCtx = getOffscreenContext();
        if (offscreenCtx) {
          await renderSticker(offscreenCtx, stickerWithImage);
        }

        // Redraw the grid and drawings
        drawGrid();
      } catch (error) {
        console.error("Error handling incoming sticker:", error);
      }
    },
    [renderSticker, drawGrid, getOffscreenContext]
  );

  /**
   * Handles incoming sticker updates from other users.
   */
  const handleIncomingUpdateSticker = useCallback(
    async (data: StickerData) => {
      // Find and update the sticker in the local ref
      const index = stickersRef.current.findIndex((s) => s.id === data.id);
      if (index !== -1) {
        // Update the properties
        stickersRef.current[index] = {
          ...stickersRef.current[index],
          ...data,
        };

        // Reload the image if imageUrl has changed
        if (
          data.imageUrl &&
          data.imageUrl !== stickersRef.current[index].imageUrl
        ) {
          try {
            const image = new Image();
            image.src = data.imageUrl;
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () =>
                reject(new Error(`Failed to load image: ${data.imageUrl}`));
            });
            stickersRef.current[index].imageElement = image;
          } catch (error) {
            console.error("Error loading updated sticker image:", error);
            return;
          }
        }

        // Re-render the updated sticker
        const offscreenCtx = getOffscreenContext();
        if (offscreenCtx) {
          await renderSticker(offscreenCtx, stickersRef.current[index]);
        }

        // Redraw the grid and drawings
        drawGrid();
      }
    },
    [renderSticker, drawGrid, getOffscreenContext]
  );

  /**
   * Handles incoming sticker deletions from other users.
   */
  const handleIncomingDeleteSticker = useCallback(
    (stickerId: string) => {
      // Remove the sticker from local state
      const index = stickersRef.current.findIndex((s) => s.id === stickerId);
      if (index !== -1) {
        stickersRef.current.splice(index, 1);
        // Redraw the grid and drawings
        drawGrid();
      }
    },
    [drawGrid]
  );

  /**
   * Fetches existing stickers when the hook initializes.
   */
  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  /**
   * Sets up socket listeners for sticker events.
   */
  useEffect(() => {
    // Listen for sticker additions from other users
    socket.onSticker(handleIncomingSticker);

    // Listen for sticker updates from other users
    socket.onUpdateSticker(handleIncomingUpdateSticker);

    // Listen for sticker deletions from other users
    socket.onDeleteSticker(handleIncomingDeleteSticker);

    // Clean up listeners on unmount
    return () => {
      socket.offSticker(handleIncomingSticker);
      socket.offUpdateSticker(handleIncomingUpdateSticker);
      socket.offDeleteSticker(handleIncomingDeleteSticker);
    };
  }, [
    socket,
    handleIncomingSticker,
    handleIncomingUpdateSticker,
    handleIncomingDeleteSticker,
  ]);

  /**
   * Helper function to get sticker image URL.
   * Opens a file selector and uploads the image to the server.
   */
  const getStickerImageUrl = async (
    boardId: string
  ): Promise<string | null> => {
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
  };

  /**
   * Helper function to generate a unique ID for the sticker.
   */
  const generateUniqueId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  return {
    addSticker,
    updateSticker,
    deleteSticker,
    rotateSticker,
    stickersRef,
  };
};

export default useSticker;
