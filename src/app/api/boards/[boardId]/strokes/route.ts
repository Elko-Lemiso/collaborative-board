// app/api/boards/[boardId]/strokes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust the import if needed

export async function GET(
  request: NextRequest,
  context: { params: { boardId: string } }
) {
  const { boardId } =  await context.params;

  try {
    console.log("Fetching strokes for board:", boardId);

    const strokes = await prisma.stroke.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(strokes, { status: 200 });
  } catch (error) {
    console.error("Error fetching strokes:", error);

    return NextResponse.json(
      { error: "Error fetching strokes" },
      { status: 500 }
    );
  }
}
