import type {
  ActionItem,
  InsightItem,
  LessonEvaluation,
  StatusPill,
} from "@/types";
import type { TranscriptData } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import {
  extractTopicsFromTranscript,
  type LessonContext,
} from "@/lib/lesson-context";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

export { extractTopicsFromTranscript } from "@/lib/lesson-context";

export function buildStatusPills(
  transcript: TranscriptData,
  evaluation: LessonEvaluation
): StatusPill[] {
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const teacherSegs = transcript.segments.filter((s) => s.speaker === TEACHER);
  const totalTalk = transcript.segments.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const studentTalk = studentSegs.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const interactionPct = Math.round(
    (studentTalk / Math.max(totalTalk, 1)) * 100
  );
  const questions = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;

  const talkRatio = Math.round(
    (teacherSegs.reduce((s, seg) => s + (seg.end - seg.start), 0) /
      Math.max(totalTalk, 1)) *
      100
  );

  return [
    {
      id: "score",
      label: "Ders Puanı",
      value: String(evaluation.score),
      type: "score",
    },
    {
      id: "interaction",
      label: "Öğrenci Konuşma",
      value: `%${interactionPct}`,
      type: interactionPct >= 25 ? "success" : "neutral",
    },
    {
      id: "questions",
      label: "Soru",
      value: String(questions),
      type: questions >= 20 ? "success" : "neutral",
    },
    {
      id: "talk-ratio",
      label: "Hoca Payı",
      value: `%${talkRatio}`,
      type: talkRatio <= 70 ? "success" : "neutral",
    },
  ];
}

export function buildActionItems(
  evaluation: LessonEvaluation,
  teacherName: string,
  studentName: string
): ActionItem[] {
  const items: ActionItem[] = [];
  let id = 1;

  for (const rec of evaluation.nextLessonRecommendations.slice(0, 3)) {
    items.push({
      id: String(id++),
      text: rec,
      assignee: teacherName,
    });
  }

  for (const hw of evaluation.homeworkRecommendation.items.slice(0, 2)) {
    items.push({
      id: String(id++),
      text: hw,
      assignee: studentName,
    });
  }

  return items;
}

export function buildCompletedInsights(
  transcript: TranscriptData,
  summaryBrief: string,
  partTitles: string[],
  subject: string
): InsightItem[] {
  const questionCount = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const topics = extractTopicsFromTranscript(transcript, subject);

  const insights: InsightItem[] = [
    {
      id: "overview",
      title: "Ders Özeti",
      content: summaryBrief,
      expanded: true,
    },
  ];

  if (topics.length > 0) {
    insights.push({
      id: "topics",
      title: "Ele Alınan Konular",
      content: `Transkriptte tespit edilen başlıca konular: ${topics.join(", ")}.`,
      bullets: topics,
    });
  }

  if (partTitles.length > 0) {
    insights.push({
      id: "sections",
      title: "Ders Bölümleri",
      content: `${partTitles.length} ana bölüm tespit edildi. Konuşma akışındaki doğal duraklamalara göre ayrıldı.`,
      bullets: partTitles.slice(0, 6),
    });
  }

  insights.push({
    id: "questions",
    title: "Soru Analizi",
    content: `Ders boyunca ${questionCount} gerçek soru tespit edildi (? işareti veya net soru kalıbı). Öğrenci soruları: ${transcript.segments.filter((s) => isQuestion(s.text, s.speaker) && s.speaker === STUDENT).length}, öğretmen soruları: ${transcript.segments.filter((s) => isQuestion(s.text, s.speaker) && s.speaker === TEACHER).length}.`,
  });

  return insights;
}

export function buildGrowthInsights(
  transcript: TranscriptData,
  evaluation: LessonEvaluation,
  metrics: Array<{ id: string; value: string; status: string; label: string }>
): InsightItem[] {
  const insights: InsightItem[] = [];

  const weakMetrics = metrics.filter((m) => m.status === "warning" || m.status === "bad");
  for (const m of weakMetrics.slice(0, 2)) {
    insights.push({
      id: `metric-${m.id}`,
      title: m.label,
      content: `Transkript analizi: ${m.value}. Önerilen aralığın dışında — heatmap üzerinden hangi bölümlerde sapma olduğunu inceleyebilirsiniz.`,
      expanded: insights.length === 0,
    });
  }

  if (evaluation.weaknesses.length > 0) {
    insights.push({
      id: "weakness-top",
      title: "Öncelikli Gelişim",
      content: evaluation.weaknesses[0],
      expanded: insights.length === 0,
    });
  }

  if (insights.length === 0) {
    const teacherWords = transcript.words.filter((w) => w.speaker === TEACHER);
    const teacherMin =
      transcript.segments
        .filter((s) => s.speaker === TEACHER)
        .reduce((sum, s) => sum + (s.end - s.start), 0) / 60 || 1;
    const wpm = Math.round(teacherWords.length / teacherMin);

    insights.push({
      id: "speed",
      title: "Anlatım Hızı",
      content: `Ortalama anlatım hızı ${wpm} kel/dk. Heatmap üzerinden bölüm bazlı tempo değişimlerini inceleyebilirsiniz.`,
      expanded: true,
    });
  }

  return insights;
}

export function buildLessonSummary(
  transcript: TranscriptData,
  context: LessonContext,
  partTitles: string[]
) {
  const durationMin = Math.round(transcript.duration / 60);
  const topics = extractTopicsFromTranscript(transcript, context.subject);
  const questionCount = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const teacherTurns = transcript.segments.filter(
    (s) => s.speaker === TEACHER
  ).length;
  const studentTurns = transcript.segments.filter(
    (s) => s.speaker === STUDENT
  ).length;
  const lessonStart = transcript.segments[0]?.start ?? 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const teacherFirst = context.teacher.name.split(" ")[0];
  const studentFirst = context.student.name.split(" ")[0];

  const typeLabel =
    context.lessonType === "demo"
      ? "demo ders"
      : context.lessonType === "tanışma"
        ? "tanışma dersi"
        : "ders";

  const topicLine =
    topics.length > 0
      ? `${topics.slice(0, 5).join(", ")} konuları işlendi.`
      : "Ders boyunca çeşitli konular ele alındı.";

  const brief = `${teacherFirst} Hoca ile ${studentFirst} arasında ${context.subject} ${typeLabel} gerçekleşti (${context.title}). Ders ${durationMin} dakika sürdü. ${topicLine} ${questionCount} gerçek soru tespit edildi.`;

  const detailedParts = [
    brief,
    "",
    partTitles.length > 0
      ? `Ana bölümler: ${partTitles.slice(0, 5).join(" · ")}${partTitles.length > 5 ? " …" : ""}.`
      : "",
    "",
    `Konuşmacı dağılımı: ${teacherFirst} ${teacherTurns} tur, ${studentFirst} ${studentTurns} tur.`,
    `Kelime sayısı: ${transcript.words.length}, segment: ${transcript.segments.length}.`,
    "",
    `Zaman damgaları videoyla aynı eksende; ilk konuşma ${formatTime(lessonStart)} civarında başlıyor.`,
    topics.length > 0
      ? `\nTranskriptten çıkarılan konu başlıkları: ${topics.join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { brief, detailed: detailedParts };
}

export function buildLessonPreview(
  context: LessonContext,
  transcript: TranscriptData,
  evaluation: LessonEvaluation,
  partTitles: string[],
  partCount: number
) {
  const summary = buildLessonSummary(transcript, context, partTitles);
  const questionCount = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const topics = extractTopicsFromTranscript(transcript, context.subject);

  return {
    summaryBrief: summary.brief,
    evaluationOverview: evaluation.overview,
    topStrength: evaluation.strengths[0],
    topWeakness: evaluation.weaknesses[0],
    questionCount,
    partCount,
    topTopics: topics.slice(0, 4),
    topSections: partTitles.slice(0, 3),
  };
}
