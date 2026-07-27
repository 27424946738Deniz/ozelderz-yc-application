/**
 * Ders eksikliklerini tespit edip OpenAI ile öğretim taktikleri üretir.
 * Çıktı: data/learning-guides.json
 */
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { inferLessonContext } from "../src/lib/lesson-context";
import { detectLessonGaps } from "../src/lib/lesson-gaps";
import { saveLearningGuides, getStoredLearningGuide } from "../src/lib/learning-guide-store";
import {
  discoverLessonMetas,
  loadLessonTranscript,
} from "../src/lib/lesson-registry";
import { generateTeachingTactics } from "../src/lib/teaching-tactics-generator";
import { extractTopicsFromTranscript } from "../src/lib/lesson-context";
import {
  generateUnderstandingInsights,
  selectStudentExcerpts,
} from "../src/lib/understanding-insights";
import type { LearningStyleAnalysis } from "../src/types";

const STUDENT = "SPEAKER_01";

const CONCURRENCY = Number(process.env.GUIDE_CONCURRENCY ?? 2);
const MODEL = process.env.OPENAI_GUIDE_MODEL ?? "gpt-4o";
const UNDERSTANDING_ONLY =
  process.argv.includes("--understanding-only") ||
  process.env.GUIDE_MODE === "understanding";

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
      const waitMs = 5000 * (i + 1);
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

async function generateWithAI(
  openai: OpenAI,
  input: {
    studentName: string;
    teacherName: string;
    subject: string;
    lessonTitle: string;
    lessonType: string;
    durationMin: number;
    topics: string[];
    gaps: ReturnType<typeof detectLessonGaps>;
  }
): Promise<LearningStyleAnalysis["approachGuide"]> {
  const relevantGaps = input.gaps.filter((g) => g.severity >= 35).slice(0, 8);
  if (relevantGaps.length === 0) {
    return generateTeachingTactics(input.gaps, input.studentName, input.subject);
  }

  const system = `Sen deneyimli bir özel ders pedagoji koçusun. Verilen ders analizine göre öğretmene taktikler yazıyorsun.

Kurallar:
- Yalnızca verilen eksiklikler için taktik yaz; olmayan eksiklik uydurma
- Taktik sayısı esnek: 3-8 arası, gerçek eksiklik kadar
- "title": kısa taktik başlığı (durum cümlesi değil, yöntem adı)
- "gap": bu derste tespit edilen eksiklik (1 cümle, somut)
- "tactic": sonraki derslerde nasıl daha iyi öğreteceğine dair somut pedagoji (2-3 cümle)
- Her tespit edilen eksiklik için TAM 1 taktik yaz — eksiklik sayısı = taktik sayısı
- Türkçe yaz
- JSON formatında döndür: { "tactics": [{ "title", "gap", "tactic" }] }`;

  const user = JSON.stringify(
    {
      ogrenci: input.studentName,
      ogretmen: input.teacherName,
      ders: input.lessonTitle,
      brans: input.subject,
      dersTipi: input.lessonType,
      sureDk: input.durationMin,
      konular: input.topics,
      tespitEdilenEksiklikler: relevantGaps.map((g) => ({
        baslik: g.title,
        gozlem: g.observation,
        oncelik: g.severity,
      })),
    },
    null,
    2
  );

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI boş yanıt");

  const parsed = JSON.parse(raw) as {
    tactics?: Array<{ title: string; gap: string; tactic: string }>;
  };

  if (!parsed.tactics?.length) {
    return generateTeachingTactics(relevantGaps, input.studentName, input.subject);
  }

  return parsed.tactics.slice(0, relevantGaps.length);
}

async function processLesson(
  openai: OpenAI,
  meta: ReturnType<typeof discoverLessonMetas>[number]
) {
  const existing = getStoredLearningGuide(meta.meetCode);
  const transcript = loadLessonTranscript(meta);
  const ctx = inferLessonContext(transcript, meta);
  const gaps = detectLessonGaps(transcript, {
    studentName: ctx.student.name,
    subject: ctx.subject,
    lessonType: ctx.lessonType,
  });
  const topics = extractTopicsFromTranscript(transcript, ctx.subject);

  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const totalTalk = transcript.segments.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const studentTalk = studentSegs.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const participationPct = Math.round(
    (studentTalk / Math.max(totalTalk, 1)) * 100
  );
  const studentQuestionCount = studentSegs.filter(
    (s) => s.text.includes("?") || /\b(mi|mı|mu|mü)\s*[.!]?\s*$/i.test(s.text.trim())
  ).length;
  const excerpts = selectStudentExcerpts(transcript);

  const hasUnderstanding =
    Boolean(existing?.understandsBetter?.length) ||
    Boolean(existing?.understandsLess?.length);

  if (UNDERSTANDING_ONLY && hasUnderstanding) {
    return existing!;
  }

  const understanding = hasUnderstanding
    ? {
        understandsBetter: existing!.understandsBetter ?? [],
        understandsLess: existing!.understandsLess ?? [],
      }
    : await withRetry(() =>
        generateUnderstandingInsights(openai, {
          studentName: ctx.student.name,
          teacherName: ctx.teacher.name,
          subject: ctx.subject,
          lessonTitle: ctx.title,
          lessonType: ctx.lessonType,
          durationMin: Math.round(transcript.duration / 60),
          participationPct,
          studentQuestionCount,
          excerpts,
        })
      );

  const approachGuide =
    UNDERSTANDING_ONLY && existing?.approachGuide?.length
      ? existing.approachGuide
      : await withRetry(() =>
          generateWithAI(openai, {
            studentName: ctx.student.name,
            teacherName: ctx.teacher.name,
            subject: ctx.subject,
            lessonTitle: ctx.title,
            lessonType: ctx.lessonType,
            durationMin: Math.round(transcript.duration / 60),
            topics,
            gaps,
          })
        );

  return {
    meetCode: meta.meetCode,
    studentName: ctx.student.name,
    teacherName: ctx.teacher.name,
    subject: ctx.subject,
    approachGuide,
    understandsBetter: understanding.understandsBetter,
    understandsLess: understanding.understandsLess,
    generatedAt: new Date().toISOString(),
  };
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY eksik (.env.local)");

  const openai = new OpenAI({ apiKey });
  const metas = discoverLessonMetas();
  const label = UNDERSTANDING_ONLY
    ? "anlama analizi (daha iyi anlıyor)"
    : "AI taktik + anlama";
  console.log(
    `${metas.length} ders için ${label} üretimi (${MODEL}, ${CONCURRENCY} paralel)...`
  );

  const guides = await runPool(
    metas,
    async (meta) => {
      const guide = await processLesson(openai, meta);
      const skipped =
        UNDERSTANDING_ONLY &&
        Boolean(getStoredLearningGuide(meta.meetCode)?.understandsBetter?.length);
      console.log(
        skipped
          ? `  ↷ ${meta.meetCode} — zaten var, atlandı`
          : `  ✓ ${meta.meetCode} — ${guide.studentName} (${guide.approachGuide.length} taktik, +${guide.understandsBetter?.length ?? 0}/-${guide.understandsLess?.length ?? 0} anlama)`
      );
      return guide;
    },
    CONCURRENCY
  );

  saveLearningGuides(guides);
  console.log(`\nKaydedildi: data/learning-guides.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
