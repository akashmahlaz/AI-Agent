"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Film, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "image" | "video" | "audio";

interface MediaSkeletonProps {
  type: MediaType;
  width?: number;
  height?: number;
  status?: string;
  className?: string;
}

const MEDIA_ICONS = {
  image: ImageIcon,
  video: Film,
  audio: Mic,
} as const;

// Deterministic waveform bar heights (pre-computed to avoid Math.random in render)
const WAVEFORM_HEIGHTS = [
  68, 42, 75, 55, 80, 38, 62, 48, 72, 35, 58, 44, 78, 52, 66, 40, 70, 46, 74,
  50, 64, 36, 76, 54, 60, 43, 82, 47, 69, 39, 73, 56,
];

const ASPECT_RATIOS: Record<string, string> = {
  "1024x1024": "aspect-square",
  "1024x1792": "aspect-[9/16]",
  "1792x1024": "aspect-[16/9]",
  "512x512": "aspect-square",
  "1280x720": "aspect-video",
  "720x1280": "aspect-[9/16]",
};

function getAspectClass(width?: number, height?: number): string {
  if (!width || !height) return "aspect-square";
  const key = `${width}x${height}`;
  if (ASPECT_RATIOS[key]) return ASPECT_RATIOS[key];
  // Fallback: compute approximate ratio
  const ratio = width / height;
  if (ratio > 1.5) return "aspect-video";
  if (ratio < 0.7) return "aspect-[9/16]";
  if (Math.abs(ratio - 1) < 0.1) return "aspect-square";
  return `aspect-[${width}/${height}]`;
}

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      <div className="absolute inset-0 -translate-x-full animate-[media-shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function PulsingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      <div className="absolute left-1/4 top-1/3 size-20 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute right-1/4 bottom-1/3 size-16 animate-[pulse_3s_ease-in-out_infinite_0.5s] rounded-full bg-primary/8 blur-xl" />
      <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-[pulse_2.5s_ease-in-out_infinite_1s] rounded-full bg-primary/6 blur-lg" />
    </div>
  );
}

function ProgressRing({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-8 animate-spin", className)}
      viewBox="0 0 32 32"
      fill="none"
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.15"
      />
      <path
        d="M16 3 A13 13 0 0 1 29 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function MediaSkeleton({
  type,
  width,
  height,
  status,
  className,
}: MediaSkeletonProps) {
  const Icon = MEDIA_ICONS[type];
  const aspectClass = getAspectClass(width, height);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const statusText =
    status ||
    (type === "image"
      ? "Generating image"
      : type === "video"
        ? "Generating video"
        : "Generating audio");

  if (type === "audio") {
    return (
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-muted/30 px-4 py-3 backdrop-blur-sm",
          className,
        )}
      >
        <div className="relative flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Mic className="size-4 text-primary/70" />
          <ProgressRing className="absolute inset-0 size-10 text-primary/40" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3 text-primary/60 animate-pulse" />
            <span className="text-[12px] font-medium text-foreground/80">
              {statusText}
              {dots}
            </span>
          </div>
          {/* Audio waveform skeleton */}
          <div className="flex items-end gap-px h-6">
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-primary/20 animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <ShimmerOverlay />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative max-w-80 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 via-muted/30 to-muted/50 backdrop-blur-sm",
        aspectClass,
        className,
      )}
    >
      <PulsingOrbs />
      <ShimmerOverlay />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-background/60 shadow-sm backdrop-blur-sm border border-border/40">
            <Icon className="size-6 text-primary/60" />
          </div>
          <ProgressRing className="absolute -inset-1 size-16 text-primary/50" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 shadow-sm backdrop-blur-sm border border-border/30">
          <Sparkles className="size-3 text-primary/70 animate-pulse" />
          <span className="text-[11px] font-medium text-foreground/70">
            {statusText}
            {dots}
          </span>
        </div>

        {width && height && (
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {width} &times; {height}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Resolved media display after generation is complete.
 */
export function GeneratedImage({
  url,
  alt,
  width,
  height,
  className,
}: {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-4",
          className,
        )}
      >
        <span className="text-[12px] text-destructive">
          Failed to load image
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative max-w-80 overflow-hidden rounded-xl", className)}
    >
      {!loaded && (
        <MediaSkeleton
          type="image"
          width={width}
          height={height}
          status="Loading image"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt || "Generated image"}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "rounded-xl object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0 absolute inset-0",
        )}
      />
    </div>
  );
}

export function GeneratedVideo({
  url,
  width,
  height,
  className,
}: {
  url: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={cn("relative max-w-96 overflow-hidden rounded-xl", className)}
    >
      {!loaded && (
        <MediaSkeleton
          type="video"
          width={width}
          height={height}
          status="Loading video"
        />
      )}
      <video
        ref={videoRef}
        src={url}
        controls
        preload="metadata"
        onLoadedData={() => setLoaded(true)}
        className={cn(
          "w-full rounded-xl transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0 absolute inset-0",
        )}
      />
    </div>
  );
}

export function GeneratedAudio({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("max-w-80", className)}>
      {!loaded && <MediaSkeleton type="audio" status="Loading audio" />}
      <audio
        src={url}
        controls
        preload="metadata"
        onLoadedData={() => setLoaded(true)}
        className={cn(
          "w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0 h-0",
        )}
      />
    </div>
  );
}
