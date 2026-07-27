/**
 * Öğrenci ve öğretmen profillerini transkript + AI ile üretir.
 * Çıktı: data/profiles.json
 */
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import {
  extractTopicsFromTranscript,
  inferLessonContext,
} from "../src/lib/lesson-context";
import { getStoredUnderstandingInsights } from "../src/lib/learning-guide-store";
import {
  discoverLessonMetas,
  loadLessonTranscript,
} from "../src/lib/lesson-registry";
import {
  generateStudentProfileContent,
  generateTeacherProfileContent,
  selectTeacherExcerpts,
} from "../src/lib/profile-ai";
import { getStoredStudentProfile, getStoredTeacherProfile, saveProfiles } from "../src/lib/profile-store";
import { selectStudentExcerpts } from "../src/lib/understanding-insights";

const STUDENT = "SPEAKER_01";
const CONCURRENCY = Number(process.env.PROFILE_CONCURRENCY ?? 2);
const FORCE = process.argv.includes("--force");

async function withRetry<T>(fn: () => Promise<T>, attempts = 10): Promise<T> {
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
      const headers =
        error && typeof error === "object" && "headers" in error
          ? (error as { headers?: { get?: (k: string) => string | null } }).headers
          : undefined;
      const retryAfterMs = Number(headers?.get?.("retry-after-ms") ?? 0);
      const waitMs = Math.max(retryAfterMs, 8000 * (i + 1));
      console.warn(`  … rate limit, ${Math.round(waitMs / 1000)}s bekleniyor`);
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
  meta: ReturnType<typeof discoverLessonMetas>[number],
  mode: "all" | "students" | "teachers"
) {
  const transcript = loadLessonTranscript(meta);
  const ctx = inferLessonContext(transcript, meta);

  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const teacherSegs = transcript.segments.filter(
    (s) => s.speaker === "SPEAKER_00"
  );
  const totalTalk = transcript.segments.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const studentTalk = studentSegs.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const teacherTalk = teacherSegs.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const participationPct = Math.round(
    (studentTalk / Math.max(totalTalk, 1)) * 100
  );
  const talkRatioPct = Math.round(
    (teacherTalk / Math.max(totalTalk, 1)) * 100
  );
  const questionCount = studentSegs.filter((s) =>
    /[?]|\b(mi|mı|mu|mü)\s*[.!]?\s*$/i.test(s.text.trim())
  ).length;
  const studentLongTurns = studentSegs.filter((s) => s.text.length > 80).length;
  const checkInCount = transcript.segments.filter((s) =>
    /anlaştık|tamam mı|anladın|net geliyor/i.test(s.text)
  ).length;
  const teacherWords = transcript.words.filter((w) => w.speaker === "SPEAKER_00");
  const teacherMin =
    teacherSegs.reduce((sum, s) => sum + (s.end - s.start), 0) / 60 || 1;
  const wpm = Math.round(teacherWords.length / teacherMin);

  const understanding = getStoredUnderstandingInsights(meta.meetCode);
  const existingStudent = getStoredStudentProfile(meta.meetCode);
  const existingTeacher = getStoredTeacherProfile(meta.meetCode);

  const topics = extractTopicsFromTranscript(transcript);
  const studentExcerpts = selectStudentExcerpts(transcript);
  const teacherExcerpts = selectTeacherExcerpts(transcript);

  const shouldGenerateStudent =
    (mode === "all" || mode === "students") && (FORCE || !existingStudent);
  const shouldGenerateTeacher =
    (mode === "all" || mode === "teachers") && (FORCE || !existingTeacher);

  const [studentResult, teacherResult] = await Promise.all([
    shouldGenerateStudent
      ? withRetry(() =>
          generateStudentProfileContent(openai, {
            studentName: ctx.student.name,
            teacherName: ctx.teacher.name,
            subject: ctx.subject,
            lessonTitle: ctx.title,
            lessonType: ctx.lessonType,
            grade: ctx.student.grade,
            durationMin: Math.round(transcript.duration / 60),
            participationPct,
            questionCount,
            longAnswerCount: studentLongTurns,
            topics,
            excerpts: studentExcerpts,
            understandingBetter: understanding?.understandsBetter,
            understandsLess: understanding?.understandsLess,
          })
        ).then((content) => ({
          content: {
            meetCode: meta.meetCode,
            ...content,
            generatedAt: new Date().toISOString(),
          },
          generated: true,
        }))
      : Promise.resolve({
          content: existingStudent,
          generated: false,
        }),
    shouldGenerateTeacher
      ? withRetry(() =>
          generateTeacherProfileContent(openai, {
            teacherName: ctx.teacher.name,
            studentName: ctx.student.name,
            subject: ctx.subject,
            lessonTitle: ctx.title,
            lessonType: ctx.lessonType,
            durationMin: Math.round(transcript.duration / 60),
            talkRatioPct,
            checkInCount,
            wpm,
            teacherExcerpts,
            studentExcerpts: studentExcerpts.slice(0, 35),
            topics,
            studentQuestions: questionCount,
            studentLongTurns,
          })
        ).then((content) => ({
          content: {
            meetCode: meta.meetCode,
            ...content,
            generatedAt: new Date().toISOString(),
          },
          generated: true,
        }))
      : Promise.resolve({
          content: existingTeacher,
          generated: false,
        }),
  ]);

  const studentContent = studentResult.content;
  const teacherContent = teacherResult.content;

  return {
    student: studentContent,
    teacher: teacherContent,
    studentName: ctx.student.name,
    teacherName: ctx.teacher.name,
    skippedStudent: Boolean(existingStudent && !FORCE),
    skippedTeacher: Boolean(existingTeacher && !FORCE),
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

  const mode = process.argv.includes("--students")
    ? "students"
    : process.argv.includes("--teachers")
      ? "teachers"
      : "all";

  const openai = new OpenAI({ apiKey });
  const metas = discoverLessonMetas();
  console.log(
    `${metas.length} ders için profil üretimi (${mode}${FORCE ? ", force" : ""}, ${CONCURRENCY} paralel)...`
  );

  const results = await runPool(
    metas,
    async (meta) => {
      const existingTeacher = getStoredTeacherProfile(meta.meetCode);
      if (
        mode === "teachers" &&
        !FORCE &&
        existingTeacher?.studentTypeMatches?.length &&
        existingTeacher?.excelsWith?.length
      ) {
        console.log(`  ↷ ${meta.meetCode} — hoca zaten var, atlanıyor`);
        return {
          student: getStoredStudentProfile(meta.meetCode),
          teacher: existingTeacher,
          studentName: "",
          teacherName: "",
          skippedStudent: true,
          skippedTeacher: true,
        };
      }

      const result = await processLesson(openai, meta, mode);
      const parts: string[] = [];
      if (result.skippedStudent) parts.push("öğrenci↷");
      else if (result.student)
        parts.push(
          `öğrenci(${result.student.goals.length}g/${result.student.strengths.length}s)`
        );
      if (result.skippedTeacher) parts.push("hoca↷");
      else if (result.teacher)
        parts.push(
          `hoca(${result.teacher.studentTypeMatches.length}eş/${result.teacher.excelsWith?.length ?? 0}uyum)`
        );
      console.log(`  ✓ ${meta.meetCode} — ${result.studentName} · ${parts.join(", ")}`);

      if (result.student || result.teacher) {
        saveProfiles({
          students: result.student ? [result.student] : [],
          teachers: result.teacher ? [result.teacher] : [],
        });
      }

      return result;
    },
    CONCURRENCY
  );

  const students = results
    .map((r) => r.student)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const teachers = results
    .map((r) => r.teacher)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  saveProfiles({ students, teachers });
  console.log(
    `\nTamamlandı: data/profiles.json (${students.length} öğrenci, ${teachers.length} hoca bu turda işlendi)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
