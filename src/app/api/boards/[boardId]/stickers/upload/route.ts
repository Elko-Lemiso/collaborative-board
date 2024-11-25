// src/app/api/boards/[boardId]/stickers/upload/route.ts

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable Next.js default body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// **Specify the runtime to use Node.js**
export const runtime = "nodejs";

const uploadDir = path.join(process.cwd(), "public", "uploads", "stickers");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(
  request: NextRequest,
  context: { params: { boardId: string } }
) {
  const { boardId } = context.params;

  const form = formidable({
    uploadDir: uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
  });

  return new Promise<NextResponse>((resolve) => {
    form.parse(request, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        return resolve(
          NextResponse.json({ error: "Error uploading file." }, { status: 500 })
        );
      }

      const file = Array.isArray(files.sticker)
        ? files.sticker[0]
        : files.sticker;

      if (!file) {
        return resolve(
          NextResponse.json(
            { error: "No file uploaded." },
            { status: 400 }
          )
        );
      }

      // Validate file type (basic validation)
      const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validMimeTypes.includes(file.mimetype || "")) {
        // Remove the invalid file
        fs.unlink(file.filepath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting invalid file:", unlinkErr);
          }
        });
        return resolve(
          NextResponse.json(
            { error: "Invalid file type." },
            { status: 400 }
          )
        );
      }

      // Generate a unique filename
      const uniqueFilename = `${Date.now()}-${file.originalFilename}`;
      const newPath = path.join(uploadDir, uniqueFilename);

      // Rename the file to include the unique filename
      fs.rename(file.filepath, newPath, async (renameErr) => {
        if (renameErr) {
          console.error("Error renaming file:", renameErr);
          return resolve(
            NextResponse.json(
              { error: "Error saving file." },
              { status: 500 }
            )
          );
        }

        // Construct the image URL
        const imageUrl = `/uploads/stickers/${uniqueFilename}`;

        return resolve(
          NextResponse.json({ imageUrl }, { status: 200 })
        );
      });
    });
  });
}