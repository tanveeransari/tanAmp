import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/media";
import fs from "fs";
import { stat } from "fs/promises";
import mime from "mime-types"; // Note: might need to install or just map manually
import path from "path";

// Manual mime map to avoid extra dependency if possible, or I'll install mime-types
function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".m4b":
      return "audio/mp4";
    case ".m4a":
      return "audio/mp4";
    case ".mp4":
      return "video/mp4"; // Could be audio, but browsers handle it
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("file");
  if (!filename) {
    return new NextResponse("File not specified", { status: 400 });
  }

  const filePath = getFilePath(filename);
  if (!filePath) {
    return new NextResponse("File not found", { status: 404 });
  }

  const stats = await stat(filePath);
  const fileSize = stats.size;
  const range = request.headers.get("range");
  const contentType = getMimeType(filePath);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const fileStream = fs.createReadStream(filePath, { start, end });

    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => {
          controller.close();
          fileStream.destroy();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
          fileStream.destroy();
        });
      },
      cancel() {
        fileStream.destroy();
      }
    });

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize.toString(),
      "Content-Type": contentType,
    };

    return new NextResponse(stream, { status: 206, headers });
  } else {
    const headers = {
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
    };
    const fileStream = fs.createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => {
          controller.close();
          fileStream.destroy();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
          fileStream.destroy();
        });
      },
      cancel() {
        fileStream.destroy();
      }
    });
    return new NextResponse(stream, { status: 200, headers });
  }
}
