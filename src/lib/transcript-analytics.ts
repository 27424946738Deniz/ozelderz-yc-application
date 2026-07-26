import type { Metric, MetricStatus, SpeechSegment } from "@/types";
import type {
  HeatLevel,
  HeatmapCell,
  MetricHeatmap,
  TranscriptData,
  TranscriptSegment,
} from "@/types/transcript";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

const PART_MIN_SEGMENTS = 8;
const PART_MIN_DURATION = 120;
const PART_MAX_DURATION = 360;
const PART_PAUSE_BREAK = 2.5;

interface LessonPart {
  start: number;
  end: number;
  segments: TranscriptSegment[];
  title: string;
}

/** Gerçek soru: ? işareti veya net soru kalıbı. "LGS sorusu" gibi anlatımları saymaz. */
export function isQuestion(text: string, speaker?: string): boolean {
  const s = text.trim();
  if (!s) return false;

  if (s.includes("?")) return true;

  if (/\b(mi|mı|mu|mü)\s*[.!]?\s*$/i.test(s)) return true;

  if (
    /^(ne|nasıl|neden|niçin|niye|hangi|kaç|kim|nerede|ne zaman|sorabilir)/i.test(
      s
    ) &&
    s.length < 100
  ) {
    return true;
  }

  if (speaker === STUDENT && /\b(anladım mı|doğru mu|değil mi)\b/i.test(s)) {
    return true;
  }

  return false;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function partTitle(segments: TranscriptSegment[]): string {
  const teacherLine =
    segments.find((s) => s.speaker === TEACHER && s.text.length > 12)?.text ??
    segments.find((s) => s.text.length > 8)?.text ??
    "Bölüm";

  const cleaned = teacherLine
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 42);

  return cleaned.length < teacherLine.trim().length ? `${cleaned}…` : cleaned;
}

function buildLessonParts(segments: TranscriptSegment[]): LessonPart[] {
  if (segments.length === 0) return [];

  const parts: LessonPart[] = [];
  let startIdx = 0;

  while (startIdx < segments.length) {
    let endIdx = startIdx;

    while (endIdx < segments.length - 1) {
      const start = segments[startIdx].start;
      const candidateEnd = segments[endIdx + 1].end;
      const segCount = endIdx - startIdx + 1;
      const duration = candidateEnd - start;
      const gap = segments[endIdx + 1].start - segments[endIdx].end;

      const hasMinimum = duration >= PART_MIN_DURATION && segCount >= PART_MIN_SEGMENTS;
      const naturalBreak =
        hasMinimum && (gap >= PART_PAUSE_BREAK || (segCount >= 20 && gap >= 1.5));
      const maxReached = duration >= PART_MAX_DURATION;

      if (naturalBreak || maxReached) break;
      endIdx++;
    }

    const slice = segments.slice(startIdx, endIdx + 1);
    parts.push({
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      segments: slice,
      title: partTitle(slice),
    });

    startIdx = endIdx + 1;
  }

  return parts;
}

function levelFromRatio(value: number, low: number, high: number): HeatLevel {
  if (value >= high) return "hot";
  if (value >= (low + high) / 2) return "warm";
  if (value >= low) return "neutral";
  if (value >= low * 0.6) return "cool";
  return "cold";
}

function levelFromSpeed(wpm: number): HeatLevel {
  if (wpm >= 175) return "hot";
  if (wpm >= 155) return "warm";
  if (wpm >= 135) return "neutral";
  if (wpm >= 115) return "cool";
  return "cold";
}

function levelFromInverse(value: number, low: number, high: number): HeatLevel {
  if (value <= low) return "hot";
  if (value <= (low + high) / 2) return "warm";
  if (value <= high) return "neutral";
  if (value <= high * 1.4) return "cool";
  return "cold";
}

function levelFromQuestionCount(count: number, allCounts: number[]): HeatLevel {
  if (count === 0) return "cold";
  const sorted = [...allCounts].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;

  if (count >= p75 && count >= 4) return "hot";
  if (count >= p50) return "warm";
  if (count >= p25) return "neutral";
  return "cool";
}

function buildSpeechTimeline(
  segments: TranscriptSegment[],
  speaker: string
): SpeechSegment[] {
  return segments
    .filter((s) => s.speaker === speaker)
    .map((s) => ({ start: s.start, end: s.end }));
}

function computeMetrics(transcript: TranscriptData): Metric[] {
  const teacherSegs = transcript.segments.filter((s) => s.speaker === TEACHER);
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const teacherWords = transcript.words.filter((w) => w.speaker === TEACHER);
  const teacherDurationMin =
    teacherSegs.reduce((sum, s) => sum + (s.end - s.start), 0) / 60;
  const wpm =
    teacherDurationMin > 0
      ? Math.round(teacherWords.length / teacherDurationMin)
      : 0;

  const questions = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  );
  const questionRatio = Math.round(
    (questions.length / Math.max(transcript.segments.length, 1)) * 100
  );

  const gaps: number[] = [];
  for (let i = 0; i < transcript.segments.length - 1; i++) {
    const cur = transcript.segments[i];
    const next = transcript.segments[i + 1];
    if (cur.speaker === TEACHER && next.speaker === STUDENT) {
      gaps.push(Math.max(0, next.start - cur.end));
    }
  }
  const avgGap =
    gaps.length > 0
      ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2)
      : "0";

  const teacherTalk = teacherSegs.reduce((s, seg) => s + (seg.end - seg.start), 0);
  const totalTalk = transcript.segments.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const talkRatio = Math.round((teacherTalk / Math.max(totalTalk, 1)) * 100);

  const status = (id: string, val: number): MetricStatus => {
    if (id === "question-ratio")
      return val >= 10 && val <= 30 ? "good" : val < 10 ? "warning" : "good";
    if (id === "talking-speed")
      return val >= 150 && val <= 170 ? "good" : "warning";
    if (id === "avg-patience")
      return parseFloat(String(val)) >= 1 ? "good" : "warning";
    if (id === "talk-ratio") return val >= 40 && val <= 60 ? "good" : "bad";
    return "good";
  };

  return [
    {
      id: "question-ratio",
      label: "Soru Oranı",
      value: `${questionRatio}%`,
      status: status("question-ratio", questionRatio),
      suggested: "Önerilen: %10 - %30",
    },
    {
      id: "talking-speed",
      label: "Anlatım Hızı",
      value: `${wpm} kelime/dk`,
      status: status("talking-speed", wpm),
      suggested: "Önerilen: 150 - 170",
      trend: wpm < 150 ? "up" : undefined,
    },
    {
      id: "avg-patience",
      label: "Ort. Bekleme",
      value: `${avgGap} Saniye`,
      status: status("avg-patience", parseFloat(String(avgGap))),
      suggested: "Önerilen: 1 - 1.8",
      trend: parseFloat(String(avgGap)) < 1 ? "up" : undefined,
    },
    {
      id: "talk-ratio",
      label: "Konuşma Oranı",
      value: `${talkRatio}%`,
      status: status("talk-ratio", talkRatio),
      suggested: "Önerilen: %40 - %60",
    },
    {
      id: "question-count",
      label: "Toplam Soru",
      value: `${questions.length} adet`,
      status: "good",
      suggested: "Gerçek ? ve soru kalıbı",
    },
    {
      id: "student-turns",
      label: "Öğrenci Katılımı",
      value: `${studentSegs.length} tur`,
      status: studentSegs.length >= 50 ? "good" : "warning",
      suggested: "Önerilen: 50+ tur",
    },
  ];
}

function mapPartsToCells(
  parts: LessonPart[],
  build: (
    part: LessonPart,
    index: number
  ) => Omit<HeatmapCell, "start" | "end" | "title"> & { label: string }
): HeatmapCell[] {
  return parts.map((part, index) => {
    const metrics = build(part, index);
    return {
      start: part.start,
      end: part.end,
      title: part.title,
      segmentCount: part.segments.length,
      ...metrics,
    };
  });
}

function buildQuestionHeatmap(parts: LessonPart[]): MetricHeatmap {
  const questionCounts = parts.map(
    (part) =>
      part.segments.filter((s) => isQuestion(s.text, s.speaker)).length
  );

  const cells = mapPartsToCells(parts, (part, index) => {
    const questions = questionCounts[index];
    return {
      value: questions,
      level: levelFromQuestionCount(questions, questionCounts),
      label: `${questions} soru · ${formatTime(part.start)}-${formatTime(part.end)} · ${part.title}`,
    };
  });

  return {
    metricId: "question-ratio",
    title: "Soru Yoğunluğu Haritası",
    description:
      "Kırmızı bölgelerde gerçek soru (? veya soru kalıbı) yoğun. Sınav sorusu anlatımları sayılmaz.",
    hotLabel: "Çok soru",
    coldLabel: "Az soru",
    cells,
  };
}

function buildSpeedHeatmap(parts: LessonPart[]): MetricHeatmap {
  const cells = mapPartsToCells(parts, (part) => {
    const teacherSegs = part.segments.filter((s) => s.speaker === TEACHER);
    const words = teacherSegs.flatMap((s) => s.words);
    const speakSec = teacherSegs.reduce((sum, s) => sum + (s.end - s.start), 0);
    const wpm = speakSec > 0 ? (words.length / speakSec) * 60 : 0;

    return {
      value: wpm,
      level: speakSec < 30 ? "neutral" : levelFromSpeed(wpm),
      label: `${Math.round(wpm)} kel/dk · ${formatTime(part.start)}-${formatTime(part.end)}`,
    };
  });

  return {
    metricId: "talking-speed",
    title: "Anlatım Hızı Haritası",
    description: "Kırmızı: hızlı anlatım, mavi: yavaş anlatım. Bölümler konuşma akışına göre ayrıldı.",
    hotLabel: "Hızlı",
    coldLabel: "Yavaş",
    cells,
  };
}

function buildPatienceHeatmap(
  transcript: TranscriptData,
  parts: LessonPart[]
): MetricHeatmap {
  const cells = mapPartsToCells(parts, (part) => {
    const gaps: number[] = [];
    for (let i = 0; i < transcript.segments.length - 1; i++) {
      const cur = transcript.segments[i];
      const next = transcript.segments[i + 1];
      if (
        cur.speaker === TEACHER &&
        next.speaker === STUDENT &&
        next.start >= part.start &&
        next.start < part.end
      ) {
        gaps.push(Math.max(0, next.start - cur.end));
      }
    }
    const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

    return {
      value: avg,
      level: gaps.length === 0 ? "neutral" : levelFromInverse(avg, 0.8, 1.8),
      label: `Ort. ${avg.toFixed(1)}sn bekleme · ${formatTime(part.start)}`,
    };
  });

  return {
    metricId: "avg-patience",
    title: "Bekleme Süresi Haritası",
    description: "Öğretmen konuşmasından sonra öğrenciye tanınan süre.",
    hotLabel: "Kısa bekleme",
    coldLabel: "Uzun bekleme",
    cells,
  };
}

function buildTalkRatioHeatmap(parts: LessonPart[]): MetricHeatmap {
  const cells = mapPartsToCells(parts, (part) => {
    const teacher = part.segments
      .filter((s) => s.speaker === TEACHER)
      .reduce((sum, s) => sum + (s.end - s.start), 0);
    const total = part.segments.reduce((sum, s) => sum + (s.end - s.start), 0);
    const ratio = total ? teacher / total : 0;

    return {
      value: ratio,
      level: levelFromRatio(ratio, 0.45, 0.65),
      label: `%${Math.round(ratio * 100)} öğretmen · ${formatTime(part.start)}`,
    };
  });

  return {
    metricId: "talk-ratio",
    title: "Konuşma Oranı Haritası",
    description: "Öğretmenin toplam konuşma süresine oranı.",
    hotLabel: "Öğretmen ağırlıklı",
    coldLabel: "Öğrenci ağırlıklı",
    cells,
  };
}

function buildSummary(transcript: TranscriptData, partTitles: string[]) {
  const questionCount = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const lessonStart = transcript.segments[0]?.start ?? 0;
  const durationMin = Math.round(transcript.duration / 60);
  const teacherTurns = transcript.segments.filter((s) => s.speaker === TEACHER).length;
  const studentTurns = transcript.segments.filter((s) => s.speaker === STUDENT).length;

  const brief = `${durationMin} dakikalık ders kaydı. ${transcript.segments.length} segment, ${questionCount} soru tespit edildi.`;

  const detailed = [
    brief,
    "",
    partTitles.length > 0
      ? `Ana bölümler: ${partTitles.slice(0, 6).join(" · ")}.`
      : "",
    "",
    `Konuşmacı dağılımı: öğretmen ${teacherTurns} tur, öğrenci ${studentTurns} tur.`,
    "",
    `Zaman damgaları videoyla aynı eksende; ilk konuşma ${formatTime(lessonStart)} civarında başlıyor.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { brief, detailed };
}

export function analyzeTranscript(transcript: TranscriptData) {
  const lessonStart = transcript.segments[0]?.start ?? 0;
  const parts = buildLessonParts(transcript.segments);
  const partTitles = parts.map((p) => p.title);
  const metrics = computeMetrics(transcript);
  const heatmaps: Record<string, MetricHeatmap> = {
    "question-ratio": buildQuestionHeatmap(parts),
    "talking-speed": buildSpeedHeatmap(parts),
    "avg-patience": buildPatienceHeatmap(transcript, parts),
    "talk-ratio": buildTalkRatioHeatmap(parts),
    "question-count": buildQuestionHeatmap(parts),
    "student-turns": buildTalkRatioHeatmap(parts),
  };

  const summary = buildSummary(transcript, partTitles);
  const speechTimeline = buildSpeechTimeline(transcript.segments, TEACHER);

  return {
    lessonStart,
    parts: parts.length,
    partTitles,
    metrics,
    heatmaps,
    summary,
    speechTimeline,
    transcript,
  };
}
