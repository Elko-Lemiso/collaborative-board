// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { username } = await request.json();

  if (!username) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400 }
    );
  }

  console.log("username", username);

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });

    console.log("existingUser", existingUser);
    

    if (existingUser && existingUser.isConnected) {
      return NextResponse.json(
        { message: "Username is already in use" },
        { status: 409 }
      );
    }

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { username },
        data: { isConnected: true },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: { username, isConnected: true },
      });
    }

    // Set cookie
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `username=${encodeURIComponent(
        username
      )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
    );

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
