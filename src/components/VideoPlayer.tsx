"use client";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-[#0f1419] shadow-lg">
      <div className="relative pt-[56.25%]">
        <iframe
          src={videoUrl}
          loading="lazy"
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
    </div>
  );
}
