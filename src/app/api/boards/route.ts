import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsernameFromCookies } from "@/lib/cookies";

export async function GET() {
  const username = await getUsernameFromCookies();

  if (!username) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const boards = await prisma.board.findMany({
      where: {
        users: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        users: true,
        _count: {
          select: {
            strokes: true,
            stickers: true,
            users: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ boards }, { status: 200 });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const username = await getUsernameFromCookies();

  if (!username) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json(
      { message: "Board name is required" },
      { status: 400 }
    );
  }

  try {
    const newBoard = await prisma.board.create({
      data: {
        name,
        users: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        users: true,
        _count: {
          select: {
            strokes: true,
            stickers: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}