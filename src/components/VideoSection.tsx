"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import StatusPills from "./StatusPills";
import {
  initStreamPlayer,
  useVideoSeek,
  type StreamPlayer,
} from "@/context/VideoSeekContext";
import type { StatusPill } from "@/types";

interface VideoSectionProps {
  videoUrl: string;
  title: string;
  teacherName: string;
  teacherAvatar: string;
  statusPills: StatusPill[];
  videoType?: "stream" | "mp4";
}

function buildSeekUrl(baseUrl: string, seconds: number): string {
  const url = new URL(baseUrl);
  url.searchParams.set("startTime", String(Math.floor(seconds)));
  url.searchParams.set("autoplay", "true");
  url.searchParams.set("t", String(Date.now()));
  return url.toString();
}

export default function VideoSection({
  videoUrl,
  title,
  teacherName,
  teacherAvatar,
  statusPills,
  videoType = "stream",
}: VideoSectionProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const baseUrlRef = useRef(videoUrl);
  const playerRef = useRef<StreamPlayer | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(videoUrl);
  const [videoError, setVideoError] = useState(false);
  const { registerPlayer, registerSeekFallback } = useVideoSeek();

  const isMp4 = videoType === "mp4";

  useEffect(() => {
    baseUrlRef.current = videoUrl;
    setIframeSrc(videoUrl);
    setVideoError(false);
  }, [videoUrl]);

  const bindPlayer = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !sdkReady || isMp4) return;

    const player = initStreamPlayer(iframe);
    if (player) {
      playerRef.current = player;
      registerPlayer(player);
    }
  }, [sdkReady, registerPlayer, isMp4]);

  const seekViaUrl = useCallback(
    (seconds: number) => {
      if (isMp4) {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = seconds;
        video.play().catch(() => {});
        return;
      }

      registerPlayer(null);
      playerRef.current = null;
      setIframeSrc(buildSeekUrl(baseUrlRef.current, seconds));
    },
    [registerPlayer, isMp4]
  );

  useEffect(() => {
    registerSeekFallback(seekViaUrl);
    return () => registerSeekFallback(null);
  }, [seekViaUrl, registerSeekFallback]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Stream) {
      setSdkReady(true);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    bindPlayer();
  }, [bindPlayer]);

  const handleSdkLoad = useCallback(() => {
    setSdkReady(true);
    bindPlayer();
  }, [bindPlayer]);

  useEffect(() => {
    bindPlayer();
  }, [bindPlayer, iframeSrc]);

  return (
    <>
      {!isMp4 && (
        <Script
          src="https://embed.cloudflarestream.com/embed/sdk.latest.js"
          strategy="afterInteractive"
          onLoad={handleSdkLoad}
        />
      )}
      <div className="card-border overflow-hidden shadow-sm" id="lesson-video">
        <div className="relative bg-[#1a1a1a]">
          <div className="relative pt-[56.25%]">
            {isMp4 ? (
              videoError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center text-sm text-stone-300">
                  Video yüklenemedi. Sayfayı yenileyip tekrar deneyin.
                </div>
              ) : (
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full bg-black object-contain"
                  onError={() => setVideoError(true)}
                />
              )
            ) : (
              <iframe
                ref={iframeRef}
                key={iframeSrc}
                src={iframeSrc}
                loading="eager"
                title={title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                onLoad={handleIframeLoad}
              />
            )}
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <img
              src={teacherAvatar}
              alt={teacherName}
              className="h-5 w-5 rounded-full"
            />
            <span className="text-xs font-medium text-white">{teacherName}</span>
          </div>
        </div>
        <div className="border-t border-stone-100 bg-stone-50/50 px-4">
          <StatusPills pills={statusPills} />
        </div>
      </div>
    </>
  );
}
