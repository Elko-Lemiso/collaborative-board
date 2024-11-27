// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Find or create user
    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (!existingUser) {
      // Create new user if doesn't exist
      await prisma.user.create({
        data: { username }
      });
    }

    return NextResponse.json(
      { 
        message: existingUser ? "User logged in successfully" : "User registered successfully",
        username 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}