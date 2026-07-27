import fs from "fs";
import path from "path";
import type { LearningStyleAnalysis } from "@/types";

export interface StoredLearningGuide {
  meetCode: string;
  studentName: string;
  teacherName: string;
  subject: string;
  approachGuide: LearningStyleAnalysis["approachGuide"];
  understandsBetter?: LearningStyleAnalysis["understandsBetter"];
  understandsLess?: LearningStyleAnalysis["understandsLess"];
  generatedAt: string;
}

interface GuideIndex {
  version: number;
  guides: Record<string, StoredLearningGuide>;
}

const GUIDE_PATH = path.join(process.cwd(), "data/learning-guides.json");

let cache: GuideIndex | null = null;

function loadIndex(): GuideIndex {
  if (cache) return cache;
  if (!fs.existsSync(GUIDE_PATH)) {
    cache = { version: 1, guides: {} };
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(GUIDE_PATH, "utf8")) as GuideIndex;
  return cache;
}

export function getStoredApproachGuide(
  meetCode: string
): LearningStyleAnalysis["approachGuide"] | null {
  const entry = loadIndex().guides[meetCode];
  return entry?.approachGuide ?? null;
}

export function getStoredUnderstandingInsights(
  meetCode: string
): Pick<LearningStyleAnalysis, "understandsBetter" | "understandsLess"> | null {
  const entry = loadIndex().guides[meetCode];
  if (!entry?.understandsBetter && !entry?.understandsLess) return null;
  return {
    understandsBetter: entry.understandsBetter ?? [],
    understandsLess: entry.understandsLess ?? [],
  };
}

export function getStoredLearningGuide(
  meetCode: string
): StoredLearningGuide | null {
  return loadIndex().guides[meetCode] ?? null;
}

export function listStoredLearningGuides(): StoredLearningGuide[] {
  return Object.values(loadIndex().guides);
}

export function saveLearningGuides(guides: StoredLearningGuide[]) {
  const existing = loadIndex();
  const merged: GuideIndex = {
    version: existing.version,
    guides: {
      ...existing.guides,
      ...Object.fromEntries(guides.map((g) => [g.meetCode, g])),
    },
  };
  fs.writeFileSync(GUIDE_PATH, JSON.stringify(merged, null, 2));
  cache = merged;
}
