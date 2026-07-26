"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface StreamPlayer {
  currentTime: number;
  paused: boolean;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (event: string, handler: () => void) => void;
}

interface VideoSeekContextValue {
  seekTo: (seconds: number) => void;
  registerPlayer: (player: StreamPlayer | null) => void;
  registerSeekFallback: (fn: ((seconds: number) => void) | null) => void;
  currentTime: number;
}

const VideoSeekContext = createContext<VideoSeekContextValue | null>(null);

declare global {
  interface Window {
    Stream?: (element: HTMLIFrameElement) => StreamPlayer;
  }
}

export function VideoSeekProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<StreamPlayer | null>(null);
  const seekFallbackRef = useRef<((seconds: number) => void) | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const registerPlayer = useCallback((player: StreamPlayer | null) => {
    playerRef.current = player;
  }, []);

  const registerSeekFallback = useCallback(
    (fn: ((seconds: number) => void) | null) => {
      seekFallbackRef.current = fn;
    },
    []
  );

  const seekTo = useCallback((seconds: number) => {
    const t = Math.max(0, Math.floor(seconds));
    setCurrentTime(t);

    document
      .getElementById("lesson-video")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // URL startTime is the most reliable seek path for Cloudflare Stream iframes
    seekFallbackRef.current?.(t);

    // Also try SDK seek when available (avoids reload when it works)
    const player = playerRef.current;
    if (!player) return;

    try {
      if (Math.abs(player.currentTime - t) < 0.25) {
        player.currentTime = Math.max(0, t - 0.05);
      }
      player.currentTime = t;
      if (player.paused) {
        player.play().catch(() => {});
      }
    } catch {
      playerRef.current = null;
    }
  }, []);

  return (
    <VideoSeekContext.Provider
      value={{ seekTo, registerPlayer, registerSeekFallback, currentTime }}
    >
      {children}
    </VideoSeekContext.Provider>
  );
}

export function useVideoSeek() {
  const ctx = useContext(VideoSeekContext);
  if (!ctx) {
    throw new Error("useVideoSeek must be used within VideoSeekProvider");
  }
  return ctx;
}

export function initStreamPlayer(iframe: HTMLIFrameElement): StreamPlayer | null {
  if (typeof window === "undefined" || !window.Stream) return null;
  try {
    return window.Stream(iframe);
  } catch {
    return null;
  }
}
