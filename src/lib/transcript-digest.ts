import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import {
  extractTopicsFromTranscript,
  type LessonContext,
} from "@/lib/lesson-context";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

export interface DigestQuote {
  category:
    | "interest"
    | "goal"
    | "struggle"
    | "question"
    | "resource"
    | "personal"
    | "affirmation"
    | "sport";
  text: string;
  time: string;
}

export interface TranscriptDigest {
  meetCode: string;
  studentName: string;
  teacherName: string;
  subject: string;
  lessonTitle: string;
  lessonType: LessonContext["lessonType"];
  durationMin: number;
  stats: {
    studentQuestions: number;
    participationPct: number;
    longAnswers: number;
    shortAnswers: number;
    avgUtteranceLen: number;
    initiatedTurns: number;
  };
  topics: string[];
  quotes: DigestQuote[];
  openingStudentLine?: string;
  bestStudentMoment?: { text: string; time: string };
  struggleMoment?: { text: string; time: string };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function categorizeQuote(seg: TranscriptSegment): DigestQuote["category"] | null {
  const t = seg.text;
  if (/voleybol|futbol|basketbol|spor|takım/i.test(t)) return "sport";
  if (/fen lisesi|galatasaray|hedef|lgs|deneme|sınav|net\b/i.test(t))
    return "goal";
  if (/takıl|zorlan|anlamadım|karıştır|bilmiyorum/i.test(t) && !/sıkıntı değil|sorun değil|problem değil|önemli değil/i.test(t))
    return "struggle";
  if (/kaynak|pdf|kitap|meb|müfredat|çıkmış/i.test(t)) return "resource";
  if (/seviyorum|ilgili|hoşlan|keyif/i.test(t)) return "interest";
  if (/okul|hobi|aile|arkadaş|yaşım|sınıf/i.test(t)) return "personal";
  if (/evet|tamam|hıhı|anladım|olur/i.test(t) && t.length < 20) return "affirmation";
  if (isQuestion(t, seg.speaker)) return "question";
  return null;
}

function pickQuotes(studentSegs: TranscriptSegment[]): DigestQuote[] {
  const seen = new Set<string>();
  const quotes: DigestQuote[] = [];

  const prioritized = [
    ...studentSegs.filter((s) => s.text.length > 60),
    ...studentSegs.filter((s) => isQuestion(s.text, s.speaker)),
    ...studentSegs.filter((s) => categorizeQuote(s) === "struggle"),
    ...studentSegs.filter((s) => categorizeQuote(s) === "goal"),
    ...studentSegs.filter((s) => categorizeQuote(s) === "sport"),
    ...studentSegs.filter((s) => categorizeQuote(s) === "resource"),
    ...studentSegs.filter((s) => categorizeQuote(s) === "interest"),
    ...studentSegs.filter((s) => categorizeQuote(s) === "personal"),
  ];

  for (const seg of prioritized) {
    const key = seg.text.slice(0, 40);
    if (seen.has(key)) continue;
    const category = categorizeQuote(seg);
    if (!category || category === "affirmation") continue;
    seen.add(key);
    quotes.push({
      category,
      text: seg.text.trim().replace(/\s+/g, " "),
      time: formatTime(seg.start),
    });
    if (quotes.length >= 12) break;
  }

  return quotes;
}

export function buildTranscriptDigest(
  transcript: TranscriptData,
  context: {
    meetCode: string;
    studentName: string;
    teacherName: string;
    subject: string;
    lessonTitle: string;
    lessonType: LessonContext["lessonType"];
  }
): TranscriptDigest {
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const studentSpeakSec = studentSegs.reduce(
    (sum, s) => sum + (s.end - s.start),
    0
  );
  const totalSpeakSec = transcript.segments.reduce(
    (sum, s) => sum + (s.end - s.start),
    0
  );
  const participationPct = Math.round(
    (studentSpeakSec / Math.max(totalSpeakSec, 1)) * 100
  );
  const studentQuestions = studentSegs.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const shortAnswers = studentSegs.filter((s) => s.text.length < 15).length;
  const longAnswers = studentSegs.filter((s) => s.text.length > 50).length;
  const avgUtteranceLen =
    studentSegs.length > 0
      ? Math.round(
          studentSegs.reduce((a, s) => a + s.text.length, 0) / studentSegs.length
        )
      : 0;
  const initiated = studentSegs.filter((s) =>
    /sorabilir|bir şey diy|peki hocam|bence|takıl|şey/i.test(s.text)
  ).length;

  const quotes = pickQuotes(studentSegs);
  const openingStudentLine = studentSegs
    .find((s) => s.text.length > 15 && s.start < 600)?.text;
  const bestStudentMoment = [...studentSegs]
    .sort((a, b) => b.text.length - a.text.length)[0];
  const struggleSeg = studentSegs.find(
    (s) =>
      /takıl|zorlan|anlamadım|karıştır|bilmiyorum/i.test(s.text) &&
      !/sıkıntı değil|sorun değil|problem değil/i.test(s.text)
  );

  return {
    meetCode: context.meetCode,
    studentName: context.studentName,
    teacherName: context.teacherName,
    subject: context.subject,
    lessonTitle: context.lessonTitle,
    lessonType: context.lessonType,
    durationMin: Math.round(transcript.duration / 60),
    stats: {
      studentQuestions,
      participationPct,
      longAnswers,
      shortAnswers,
      avgUtteranceLen,
      initiatedTurns: initiated,
    },
    topics: extractTopicsFromTranscript(transcript, context.subject).slice(0, 6),
    quotes,
    openingStudentLine: openingStudentLine?.trim(),
    bestStudentMoment: bestStudentMoment
      ? {
          text: bestStudentMoment.text.trim(),
          time: formatTime(bestStudentMoment.start),
        }
      : undefined,
    struggleMoment: struggleSeg
      ? { text: struggleSeg.text.trim(), time: formatTime(struggleSeg.start) }
      : undefined,
  };
}
