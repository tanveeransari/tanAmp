"use client";

import React, { useState } from "react";
import { MediaFile } from "@/types";
import Player from "./Player";
import { FileAudio, FileVideo } from "lucide-react";

interface DashboardProps {
  files: MediaFile[];
}

export default function Dashboard({ files }: DashboardProps) {
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null);

  // Parse file size to human readable
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold text-orange-500 tracking-tight">tanAmp</h1>
      </header>

      <main className="flex-1 p-4 pb-48 max-w-5xl mx-auto w-full">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <div className="p-4 bg-slate-900 rounded-full mb-4">
              <FileAudio size={48} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No media files found</p>
            <p className="text-sm mt-1">
              Add .mp3, .mp4, .m4b, or .wav files to the{" "}
              <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">media</code> folder.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Library ({files.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.filename}
                  onClick={() => setCurrentFile(file)}
                  className={`
                    group cursor-pointer p-3 rounded-lg border transition-all hover:bg-slate-800 hover:shadow-lg
                    ${currentFile?.filename === file.filename ? "border-orange-500/50 bg-slate-800 ring-1 ring-orange-500/20" : "border-slate-800 bg-slate-900"}
                  `}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        w-16 h-16 rounded flex items-center justify-center shrink-0 overflow-hidden
                        ${currentFile?.filename === file.filename ? "bg-orange-500/10 text-orange-500" : "bg-slate-800 text-slate-500 group-hover:text-slate-400"}
                    `}>
                      {file.coverUrl ? (
                        <img src={file.coverUrl} alt={file.title} className="w-full h-full object-cover" />
                      ) : (
                        <>{file.type === "video" ? <FileVideo size={32} /> : <FileAudio size={32} />}</>
                      )}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <h3
                        className={`font-semibold truncate text-sm mb-0.5 ${currentFile?.filename === file.filename ? "text-orange-500" : "text-slate-200"}`}
                        title={file.title}>
                        {file.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{file.artist || "Unknown Artist"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded uppercase border border-slate-800">
                          {file.format}
                        </span>
                        <span className="text-[10px] text-slate-600">{formatSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {currentFile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl animate-slide-up">
          <Player file={currentFile} />
        </div>
      )}
    </div>
  );
}
