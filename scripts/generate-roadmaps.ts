/**
 * Ders transkriptlerinden AI ile benzersiz yol haritaları üretir.
 * Çıktı: data/roadmaps.json
 */
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { inferLessonContext } from "../src/lib/lesson-context";
import { generateLessonRoadmapWithAI } from "../src/lib/roadmap-ai";
import { buildLessonRoadmap } from "../src/lib/roadmap-generator";
import {
  discoverLessonMetas,
  loadLessonTranscript,
} from "../src/lib/lesson-registry";
import { getStoredRoadmap, saveRoadmaps } from "../src/lib/roadmap-store";

const CONCURRENCY = Number(process.env.ROADMAP_CONCURRENCY ?? 1);
const FORCE = process.argv.includes("--force");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? Number(arg.split("=")[1]) : undefined;
})();

async function withRetry<T>(fn: () => Promise<T>, attempts = 6): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as { status?: number }).status
          : undefined;
      if (status !== 429 || i === attempts - 1) throw error;
      const waitMs = 6000 * (i + 1);
      console.warn(`  … rate limit, ${waitMs / 1000}s bekleniyor`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function processLesson(
  openai: OpenAI,
  meta: ReturnType<typeof discoverLessonMetas>[number]
) {
  if (!FORCE && getStoredRoadmap(meta.id)) {
    console.log(`  ✓ ${meta.id} — zaten var, atlanıyor`);
    return null;
  }

  const transcript = loadLessonTranscript(meta);
  const context = inferLessonContext(transcript, meta);

  try {
    const roadmap = await withRetry(() =>
      generateLessonRoadmapWithAI(openai, meta, transcript, context)
    );
    console.log(`  ✓ ${meta.id} — AI roadmap (${roadmap.phases.reduce((n, p) => n + p.checkpoints.length, 0)} checkpoint)`);
    return roadmap;
  } catch (error) {
    console.warn(`  ⚠ ${meta.id} — AI başarısız, şablon fallback:`, (error as Error).message);
    return buildLessonRoadmap(meta, transcript, context);
  }
}

async function main() {
  loadEnv();

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY gerekli (.env.local)");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const metas = discoverLessonMetas();
  const targets = LIMIT ? metas.slice(0, LIMIT) : metas;

  console.log(`Roadmap üretimi: ${targets.length} ders (concurrency=${CONCURRENCY})`);

  const results: Awaited<ReturnType<typeof processLesson>>[] = [];

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((meta) => processLesson(openai, meta))
    );
    results.push(...batchResults);
  }

  const roadmaps = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (roadmaps.length > 0) {
    saveRoadmaps(roadmaps);
    console.log(`\nKaydedildi: data/roadmaps.json (${roadmaps.length} yeni/güncellenen)`);
  } else {
    console.log("\nYeni roadmap üretilmedi.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
