// src/app/api/boards/[boardId]/stickers/upload/route.ts

import { NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

/**
 * Handles POST requests to upload a sticker.
 *
 * @param request - The incoming request object.
 * @param context - Contains route parameters.
 * @returns A JSON response with the image URL or an error message.
 */
export async function POST(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const req = await params;
  const boardId = req.boardId;
  console.log("Uploading sticker to board:", boardId);

  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const file = formData.get("sticker");

    // Validate the presence of the file
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No sticker file received." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Generate a unique filename and sanitize it
    const originalName = file.name;
    const sanitizedFilename = originalName.replace(/\s+/g, "_");
    const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`;

    // Define the upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "stickers");

    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Define the file path
    const filePath = path.join(uploadDir, uniqueFilename);

    // Convert the file to a buffer and write it to the filesystem
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Construct the image URL
    const imageUrl = `/uploads/stickers/${uniqueFilename}`;

    // Optionally, save sticker data to the database here
    // For example:
    // await prisma.sticker.create({ data: { ... } });

    // Return the image URL in the response
    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (error) {
    console.error("Error occurred during sticker upload:", error);
    return NextResponse.json(
      { error: "Failed to upload sticker." },
      { status: 500 }
    );
  }
}
