"use client";
import React, { useRef, useState, useEffect } from "react";
import { MediaFile } from "@/types";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";

interface PlayerProps {
  file: MediaFile;
}

export default function Player({ file }: PlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file.duration || 0);

  useEffect(() => {
    // Reset state when file changes
    setCurrentTime(0);
    if (mediaRef.current) {
      mediaRef.current.currentTime = 0;
      mediaRef.current.load();
      mediaRef.current.play().catch((e) => {
        console.log("Autoplay blocked or waiting for interaction", e);
        setIsPlaying(false);
      });
    }
  }, [file]);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (mediaRef.current.paused) {
        mediaRef.current.play();
        setIsPlaying(true);
      } else {
        mediaRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (amount: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += amount;
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hours = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${hours > 0 ? hours + ":" : ""}${min.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const src = `/api/stream?file=${encodeURIComponent(file.filename)}`;
  const isVideo = file.type === "video";

  return (
    <div className="flex flex-col w-full h-full">
      {isVideo && (
        <div className="relative w-full bg-black aspect-video max-h-[60vh] mx-auto flex justify-center">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            className="h-full w-auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        </div>
      )}

      {!isVideo && (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          autoPlay
        />
      )}

      {/* Controls Container */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          {/* Scrubber */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:h-1.5 transition-all"
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-8 mt-1">
            <button
              onClick={() => skip(-30)}
              className="flex flex-col items-center text-slate-400 hover:text-white transition group">
              <RotateCcw size={20} />
              <span className="text-[10px] mt-0.5 group-hover:text-white">30</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition shadow-lg hover:shadow-orange-500/20">
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              onClick={() => skip(30)}
              className="flex flex-col items-center text-slate-400 hover:text-white transition group">
              <RotateCw size={20} />
              <span className="text-[10px] mt-0.5 group-hover:text-white">30</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {file.coverUrl && (
              <img src={file.coverUrl} alt={file.title} className="w-12 h-12 rounded object-cover shadow-lg" />
            )}
            <div className="text-left flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-200 truncate">{file.title}</h3>
              <p className="text-xs text-slate-500 truncate">{file.artist}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
