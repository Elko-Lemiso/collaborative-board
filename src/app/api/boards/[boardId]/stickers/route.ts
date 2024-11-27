// src/app/api/boards/[boardId]/stickers/route.ts

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma"; // Ensure correct import path
import { StickerData } from "@/lib/types/sticker";

interface RouteParams {
  params: {
    boardId: string;
    stickerId?: string;
  };
}
export async function GETGET(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    console.log("Fetching stickers for board:", boardId);

    const stickers = await prisma.sticker.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(stickers, { status: 200 });
  } catch (error) {
    console.error("Error fetching stickers:", error);

    return NextResponse.json(
      { error: "Error fetching stickers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;
  const data: StickerData = await request.json();

  try {
    const newSticker = await prisma.sticker.create({
      data: {
        boardId,
        imageUrl: data.imageUrl,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        rotation: data.rotation || 0,
      },
    });

    return NextResponse.json(newSticker, { status: 201 });
  } catch (error) {
    console.error("Error creating sticker:", error);

    return NextResponse.json(
      { error: "Error creating sticker" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { stickerId } = await params;
  const data: Partial<StickerData> = await request.json();

  try {
    const updatedSticker = await prisma.sticker.update({
      where: { id: stickerId },
      data: {
        imageUrl: data.imageUrl,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
      },
    });

    return NextResponse.json(updatedSticker, { status: 200 });
  } catch (error) {
    console.error("Error updating sticker:", error);

    return NextResponse.json(
      { error: "Error updating sticker" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { stickerId } = await params;

  try {
    await prisma.sticker.delete({
      where: { id: stickerId },
    });

    return NextResponse.json({ message: "Sticker deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sticker:", error);

    return NextResponse.json(
      { error: "Error deleting sticker" },
      { status: 500 }
    );
  }
}
