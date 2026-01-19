import { NextResponse } from "next/server";
import { getMediaFiles } from "@/lib/media";

export async function GET() {
  const files = await getMediaFiles();
  return NextResponse.json(files);
}
