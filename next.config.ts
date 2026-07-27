import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/[[...path]]": [
      "./data/transcripts/**/*",
      "./data/r2-media-batch.json",
      "./data/roadmaps.json",
      "./data/profiles.json",
      "./data/learning-guides.json",
      "./data/lessons-manifest.json",
      "./data/lessons-catalog.json",
      "./data/students-catalog.json",
      "./data/teachers-catalog.json",
      "./data/transcript.json",
    ],
    "/api/lessons/[id]/video": [
      "./data/r2-media-batch.json",
      "./data/lessons-manifest.json",
    ],
    "/dersler/[id]": ["./data/lesson-snapshots/**/*"],
  },
};

export default nextConfig;
