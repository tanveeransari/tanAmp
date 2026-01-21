import fs from "fs";
import path from "path";
import * as mm from "music-metadata";

const MEDIA_DIR = path.join(process.cwd(), "media");

import { MediaFile } from "@/types";

const SUPPORTED_EXTENSIONS = [".m4b", ".mp4", ".mp3", ".wav", ".m4a"];

// Extract ISBN/ASIN from filename (e.g., "Book Title [B00KDQFDZS].m4b" -> "B00KDQFDZS")
function extractISBN(filename: string): string | undefined {
  const match = filename.match(/\[([A-Z0-9]{10,13})\]/);
  return match ? match[1] : undefined;
}

// Fetch cover image from Open Library or Google Books API
async function fetchCoverUrl(isbn: string, title: string): Promise<string | undefined> {
  try {
    // Try Open Library first (free, no API key needed)
    const olResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
    if (olResponse.ok) {
      const data = await olResponse.json();
      const bookData = data[`ISBN:${isbn}`];
      if (bookData?.cover?.large) {
        return bookData.cover.large;
      }
      if (bookData?.cover?.medium) {
        return bookData.cover.medium;
      }
    }

    // Try Google Books API as fallback (also free, no key required for basic use)
    const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (gbResponse.ok) {
      const data = await gbResponse.json();
      if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        return data.items[0].volumeInfo.imageLinks.thumbnail.replace("http://", "https://");
      }
    }

    // If ISBN lookup fails, try searching by title
    const titleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
    if (titleResponse.ok) {
      const data = await titleResponse.json();
      if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        return data.items[0].volumeInfo.imageLinks.thumbnail.replace("http://", "https://");
      }
    }
  } catch (e) {
    console.error(`Failed to fetch cover for ISBN ${isbn}:`, e);
  }
  return undefined;
}

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
      const isbn = extractISBN(file);
      const title = metadata?.common.title || file.replace(ext, "");

      let coverUrl: string | undefined;
      if (isbn) {
        coverUrl = await fetchCoverUrl(isbn, title);
      }

      mediaFiles.push({
        name: file,
        filename: file,
        type: isVideo ? "video" : "audio",
        format: ext.replace(".", ""),
        size: stat.size,
        duration: metadata?.format.duration,
        artist: metadata?.common.artist,
        album: metadata?.common.album,
        title,
        coverUrl,
        isbn,
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
