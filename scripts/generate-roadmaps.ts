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
import { getStoredStudentProfile } from "../src/lib/profile-store";
import { getStoredRoadmap, saveRoadmaps } from "../src/lib/roadmap-store";

const CONCURRENCY = Number(process.env.ROADMAP_CONCURRENCY ?? 2);
const FORCE = process.argv.includes("--force");
const RETRY_TEMPLATES = process.argv.includes("--retry-templates");
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
  const existing = getStoredRoadmap(meta.id);

  if (RETRY_TEMPLATES) {
    if (existing?.generatedFrom.includes("(AI)")) {
      console.log(`  ↷ ${meta.id} — AI zaten var, atlanıyor`);
      return null;
    }
  } else if (!FORCE && existing) {
    console.log(`  ↷ ${meta.id} — zaten var, atlanıyor`);
    return null;
  }

  const transcript = loadLessonTranscript(meta);
  const context = inferLessonContext(transcript, meta);
  const profile = getStoredStudentProfile(meta.meetCode);

  try {
    const roadmap = await withRetry(() =>
      generateLessonRoadmapWithAI(openai, meta, transcript, context, {
        profile,
      })
    );
    const cpCount = roadmap.phases.reduce((n, p) => n + p.checkpoints.length, 0);
    console.log(
      `  ✓ ${meta.id} — ${context.student.name.split(" ")[0]} · AI roadmap (${cpCount} checkpoint)`
    );
    saveRoadmaps([roadmap]);
    return roadmap;
  } catch (error) {
    console.warn(
      `  ⚠ ${meta.id} — AI başarısız, şablon fallback:`,
      (error as Error).message
    );
    const fallback = buildLessonRoadmap(meta, transcript, context);
    saveRoadmaps([fallback]);
    return fallback;
  }
}

async function runPool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function main() {
  loadEnv();

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY gerekli (.env.local)");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const metas = discoverLessonMetas();
  let targets = LIMIT ? metas.slice(0, LIMIT) : metas;
  if (RETRY_TEMPLATES) {
    targets = targets.filter((meta) => {
      const existing = getStoredRoadmap(meta.id);
      return !existing?.generatedFrom.includes("(AI)");
    });
  }

  console.log(
    `Roadmap üretimi: ${targets.length} ders (${FORCE ? "force, " : ""}${RETRY_TEMPLATES ? "retry-templates, " : ""}concurrency=${CONCURRENCY})`
  );

  const results = await runPool(targets, (meta) => processLesson(openai, meta), CONCURRENCY);

  const roadmaps = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (roadmaps.length > 0) {
    saveRoadmaps(roadmaps);
    console.log(`\nKaydedildi: data/roadmaps.json (${roadmaps.length} roadmap)`);
  } else {
    console.log("\nYeni roadmap üretilmedi.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
