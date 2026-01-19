import fs from "fs";
import path from "path";
import * as mm from "music-metadata";

const MEDIA_DIR = path.join(process.cwd(), "media");

import { MediaFile } from "@/types";

const SUPPORTED_EXTENSIONS = [".m4b", ".mp4", ".mp3", ".wav", ".m4a"];

// Helper to recursively or flatly scan directory. For now, flat scan of 'media' folder.
export async function getMediaFiles(): Promise<MediaFile[]> {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR);
  }

  const files = fs.readdirSync(MEDIA_DIR);
  const mediaFiles: MediaFile[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      const filePath = path.join(MEDIA_DIR, file);
      const stat = fs.statSync(filePath);

      let metadata;
      try {
        metadata = await mm.parseFile(filePath);
      } catch (e) {
        console.error(`Failed to parse metadata for ${file}`, e);
      }

      const isVideo = ext === ".mp4"; // simplistic check

      mediaFiles.push({
        name: file,
        filename: file,
        type: isVideo ? "video" : "audio",
        format: ext.replace(".", ""),
        size: stat.size,
        duration: metadata?.format.duration,
        artist: metadata?.common.artist,
        album: metadata?.common.album,
        title: metadata?.common.title || file,
      });
    }
  }

  return mediaFiles;
}

export function getFilePath(filename: string): string | null {
  const filePath = path.join(MEDIA_DIR, filename);
  if (!filePath.startsWith(MEDIA_DIR)) {
    // Prevent directory traversal
    return null;
  }
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return filePath;
}
