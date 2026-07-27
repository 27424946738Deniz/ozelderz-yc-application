import type { StudentProfile } from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import type { LessonMeta } from "@/lib/lesson-registry";
import { getLessonManifestEntry } from "@/lib/lessons-manifest";
import { resolveTeacherAvatar } from "@/lib/teacher-photos";
import { isQuestion } from "@/lib/transcript-analytics";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

export interface LessonContext {
  teacher: {
    name: string;
    title: string;
    avatar: string;
  };
  student: StudentProfile;
  subject: string;
  title: string;
  lessonType: "demo" | "tanışma" | "konu" | "ders";
}

const SUBJECT_SIGNALS: Array<{
  subject: string;
  title: string;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    subject: "Matematik",
    title: "Matematik Öğretmeni",
    patterns: [
      /matematik/i,
      /rasyonel/i,
      /denklem/i,
      /ondalık/i,
      /geometri/i,
      /veri işleme/i,
      /daire grafiği/i,
      /üslü/i,
      /köklü/i,
      /oran/i,
      /problem/i,
    ],
    weight: 1,
  },
  {
    subject: "İnkılap Tarihi ve Atatürkçülük",
    title: "İnkılap Tarihi Öğretmeni",
    patterns: [
      /inkılap/i,
      /atatürk/i,
      /milli mücadele/i,
      /cumhuriyet/i,
      /lozan|sevr/i,
      /inkılab/i,
      /mücadele/i,
    ],
    weight: 1,
  },
  {
    subject: "Türkçe",
    title: "Türkçe Öğretmeni",
    patterns: [/paragraf/i, /anlam bilgisi/i, /dil bilgisi/i, /yazım/i],
    weight: 1,
  },
  {
    subject: "Fen Bilimleri",
    title: "Fen Bilimleri Öğretmeni",
    patterns: [/fizik/i, /kimya/i, /biyoloji/i, /deney/i, /atom/i],
    weight: 1,
  },
];

export const TOPIC_KEYWORDS: Array<{ pattern: RegExp; label: string; subjects?: string[] }> = [
  { pattern: /rasyonel|rasyonele/i, label: "rasyonel sayılar", subjects: ["Matematik"] },
  { pattern: /ondalık|devirli/i, label: "ondalık gösterim", subjects: ["Matematik"] },
  { pattern: /denklem/i, label: "denklemler", subjects: ["Matematik"] },
  { pattern: /veri işleme|daire grafiği/i, label: "veri işleme", subjects: ["Matematik"] },
  { pattern: /geometri|açı|üçgen/i, label: "geometri", subjects: ["Matematik"] },
  { pattern: /problem/i, label: "problemler", subjects: ["Matematik"] },
  { pattern: /inkılap|i̇nkılap/i, label: "İnkılap Tarihi", subjects: ["İnkılap Tarihi ve Atatürkçülük"] },
  { pattern: /atatürk|mustafa kemal/i, label: "Atatürk", subjects: ["İnkılap Tarihi ve Atatürkçülük"] },
  { pattern: /\blgs\b/i, label: "LGS" },
  { pattern: /ünite|unit/i, label: "ünite planı", subjects: ["İnkılap Tarihi ve Atatürkçülük"] },
  { pattern: /müfredat|meb/i, label: "müfredat" },
  { pattern: /cumhuriyet/i, label: "Cumhuriyet", subjects: ["İnkılap Tarihi ve Atatürkçülük"] },
  { pattern: /milli mücadele|kurtuluş/i, label: "Milli Mücadele", subjects: ["İnkılap Tarihi ve Atatürkçülük"] },
  { pattern: /deneme|test|soru/i, label: "test/alıştırma" },
  { pattern: /whatsapp|plan|program/i, label: "ders planı" },
  { pattern: /pdf|kaynak|kitap/i, label: "kaynak/materyal" },
  { pattern: /ekran|sunum|tablo|şema|slayt/i, label: "görsel materyal" },
  { pattern: /demo ders/i, label: "demo ders" },
];

function cleanName(raw: string): string {
  return raw
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const INVALID_NAME_WORDS = new Set([
  "hocam",
  "öğretmen",
  "öğrenci",
  "ama",
  "tamam",
  "evet",
  "merhaba",
  "merhabalar",
  "ben",
  "siz",
  "sen",
  "de",
  "ki",
  "yani",
  "bir",
  "bunları",
  "var",
  "işte",
  "şimdi",
  "pekala",
  "tabii",
  "hayır",
  "güzel",
  "sesini",
  "sesim",
  "hoş",
  "bulduk",
  "daha",
  "sana",
  "bu",
  "şu",
  "ile",
  "için",
  "ela",
  "matematik",
  "fizik",
  "kimya",
  "tarih",
  "türkçe",
  "fen",
  "seviyorum",
  "değil",
  "zaten",
  "kadarıyla",
  "çevrenizde",
  "başlamamıştım",
  "çizmiyorum",
  "yapmayacağım",
]);

export function isPlausiblePersonName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 40) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 4) return false;
  const first = words[0]?.toLowerCase();
  if (!first || INVALID_NAME_WORDS.has(first)) return false;
  if (/^(daha|ben|sana|bu|şu|ki|ile|için|geriye|sesini)/i.test(trimmed)) {
    return false;
  }
  return true;
}

function introSegments(
  segments: TranscriptSegment[],
  maxSeconds = 600
): TranscriptSegment[] {
  return segments.filter((s) => s.start < maxSeconds);
}

function fallbackStudentName(meetCode: string): string {
  return `Öğrenci (${meetCode})`;
}

function fallbackTeacherName(meetCode: string): string {
  return `Öğretmen (${meetCode})`;
}

function inferTeacherName(segments: TranscriptSegment[]): string | null {
  const teacherSegs = introSegments(segments).filter((s) => s.speaker === TEACHER);
  const patterns = [
    /ismim\s+([a-zçğıöşü\s]{2,35}?)(?:\s+ve\b|\.|,|$)/i,
    /adım\s+([a-zçğıöşü\s]{2,35}?)(?:\.|,|$)/i,
    /ben\s+([a-zçğıöşü]{2,20})\s*,?\s*(?:hoca|öğretmen)(?!iyim)/i,
  ];

  for (const seg of teacherSegs) {
    for (const re of patterns) {
      const m = seg.text.match(re);
      if (m?.[1]) {
        const name = cleanName(m[1]);
        if (isPlausiblePersonName(name) && !/mustafa kemal/i.test(name)) return name;
      }
    }
  }

  return null;
}

function inferStudentName(segments: TranscriptSegment[]): string | null {
  const studentSegs = introSegments(segments).filter((s) => s.speaker === STUDENT);
  const patterns = [
    /ben\s+(?:inci\s+)?nisa/i,
    /ben\s+kayra/i,
    /ben\s+([a-zçğıöşü]{2,20})(?:[.,!?]|$|\s+(?:ve|de|da)\b)/i,
    /adım\s+([a-zçğıöşü\s]{2,30}?)(?:\.|,|$)/i,
    /ismim\s+([a-zçğıöşü\s]{2,30}?)(?:\.|,|$)/i,
  ];

  for (const seg of studentSegs) {
    if (/ben\s+(?:inci\s+)?nisa/i.test(seg.text)) return "Nisa";
    if (/ben\s+kayra/i.test(seg.text)) return "Kayra";
    for (const re of patterns.slice(2)) {
      const m = seg.text.match(re);
      if (m?.[1]) {
        const name = cleanName(m[1]);
        if (isPlausiblePersonName(name)) return name.split(" ")[0];
      }
    }
  }

  for (const seg of introSegments(segments)) {
    if (/^nisa[.,!?]?$/i.test(seg.text.trim())) return "Nisa";
  }

  return null;
}

export function inferSubject(transcript: TranscriptData): {
  subject: string;
  teacherTitle: string;
} {
  const blob = transcript.segments.map((s) => s.text).join(" ");
  let best = { subject: "Ders", title: "Öğretmen", score: 0 };

  for (const signal of SUBJECT_SIGNALS) {
    const score = signal.patterns.reduce(
      (sum, re) => sum + (blob.match(re)?.length ?? 0) * signal.weight,
      0
    );
    if (score > best.score) {
      best = { subject: signal.subject, title: signal.title, score };
    }
  }

  if (best.score === 0) return { subject: "Ders kaydı", teacherTitle: "Öğretmen" };
  return { subject: best.subject, teacherTitle: best.title };
}

export function extractTopicsFromTranscript(
  transcript: TranscriptData,
  subject?: string
): string[] {
  const blob = transcript.segments.map((s) => s.text).join(" ");
  const found = TOPIC_KEYWORDS.filter(({ pattern, subjects }) => {
    if (!pattern.test(blob)) return false;
    if (!subjects || !subject) return true;
    return subjects.some((s) => subject.includes(s.split(" ")[0]));
  }).map(({ label }) => label);

  const unique = [...new Set(found)];

  if (unique.length > 0) return unique;

  return TOPIC_KEYWORDS.filter(({ pattern }) => pattern.test(blob)).map(
    ({ label }) => label
  ).slice(0, 6);
}

function inferGrade(segments: TranscriptSegment[]): string {
  const blob = segments.map((s) => s.text).join(" ");
  if (/lgs|8\.?\s*sınıf|sekizinci sınıf/i.test(blob)) return "8. Sınıf";
  if (/7\.?\s*sınıf|yedinci sınıf/i.test(blob)) return "7. Sınıf";
  return "8. Sınıf";
}

function inferLessonType(transcript: TranscriptData): LessonContext["lessonType"] {
  const blob = transcript.segments.map((s) => s.text).join(" ");
  if (/demo ders/i.test(blob)) return "demo";
  if (/tanış|yol haritası|ilk ders/i.test(blob)) return "tanışma";
  if (/konu anlat|ünite|kazanım/i.test(blob)) return "konu";
  return "ders";
}

function inferLessonTitle(
  meta: LessonMeta,
  transcript: TranscriptData,
  subject: string,
  lessonType: LessonContext["lessonType"]
): string {
  const topics = extractTopicsFromTranscript(transcript, subject);
  const primaryTopic = topics[0];

  if (lessonType === "demo" && primaryTopic) {
    return `Demo Ders — ${capitalizeTopic(primaryTopic)}`;
  }
  if (lessonType === "tanışma") {
    return `Tanışma Dersi — ${subject.split(" ")[0]}`;
  }
  if (primaryTopic && !meta.title.startsWith("Meet Kaydı")) {
    return meta.title;
  }
  if (primaryTopic) {
    return `Ders — ${capitalizeTopic(primaryTopic)}`;
  }
  return meta.title;
}

function capitalizeTopic(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function inferStudentProfile(
  transcript: TranscriptData,
  name: string
): StudentProfile {
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const blob = studentSegs.map((s) => s.text).join(" ");
  const grade = inferGrade(transcript.segments);
  const questionCount = studentSegs.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const longTurns = studentSegs.filter((s) => s.text.length > 80).length;

  const strengths: string[] = [];
  const challenges: string[] = [];
  const tags: string[] = [grade];

  if (/denklem/i.test(blob) && /iyi|güzel|rahat/i.test(blob)) {
    strengths.push("Denklemlerde kendine güven");
  }
  if (/rasyonel/i.test(blob) && /takıl|zor|karış/i.test(blob)) {
    challenges.push("Rasyonel sayılarda özellikle devirli ondalıklar");
  }
  if (/ondalık|devirli/i.test(blob)) {
    challenges.push("Devirli ondalık gösterimler");
  }
  if (questionCount >= 15) {
    strengths.push("Aktif soru sorma");
  }
  if (longTurns >= 3) {
    strengths.push("Açıklama yaparak düşünme");
  }
  if (/lgs/i.test(transcript.segments.map((s) => s.text).join(" "))) {
    tags.push("LGS Odaklı");
  }

  const learningStyle =
    questionCount >= 10
      ? "Sorgulayıcı-Uygulamalı Öğrenen"
      : longTurns >= 3
        ? "Anlatımsal Öğrenen"
        : "Gözlemci-Uygulamalı Öğrenen";

  if (strengths.length === 0) strengths.push("Derse katılım gösterdi");
  if (challenges.length === 0) challenges.push("Uzun anlatım bloklarında dikkat");

  return {
    name,
    grade,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    learningStyle,
    learningStyleDescription: `${name}, transkriptte ${questionCount} soru sordu ve ${longTurns} uzun yanıt verdi — ${learningStyle.toLowerCase()} profiline işaret ediyor.`,
    strengths: strengths.slice(0, 3),
    challenges: challenges.slice(0, 2),
    comprehensionScore: Math.min(
      90,
      55 + questionCount + longTurns * 3
    ),
    tags,
  };
}

function inferTeacherProfile(
  name: string,
  teacherTitle: string
): LessonContext["teacher"] {
  const first = name.split(" ")[0];
  return {
    name,
    title: teacherTitle,
    avatar: resolveTeacherAvatar(name, first),
  };
}

const MANUAL_OVERRIDES: Record<
  string,
  Partial<{ teacherName: string; studentName: string; title: string; subject: string }>
> = {
  "wty-msyi-khr": {
    title: "Tanışma Dersi — İnkılap Tarihi",
    subject: "İnkılap Tarihi ve Atatürkçülük",
  },
  "cqi-brqh-evi": {
    title: "Demo Ders — Rasyonel Sayılar",
    subject: "Matematik",
  },
};

export function inferLessonContext(
  transcript: TranscriptData,
  meta: LessonMeta
): LessonContext {
  const manifest = getLessonManifestEntry(meta.id);
  const override = MANUAL_OVERRIDES[meta.id];
  const { subject, teacherTitle } = override?.subject
    ? { subject: override.subject, teacherTitle: subjectToTitle(override.subject) }
    : inferSubject(transcript);

  const lessonType = inferLessonType(transcript);

  const teacherName =
    manifest?.teacherName ??
    override?.teacherName ??
    inferTeacherName(transcript.segments) ??
    fallbackTeacherName(meta.id);

  const studentRawName =
    manifest?.studentName ??
    override?.studentName ??
    inferStudentName(transcript.segments) ??
    fallbackStudentName(meta.id);

  const studentName = studentRawName;

  const title =
    override?.title ?? inferLessonTitle(meta, transcript, subject, lessonType);

  const student =
    meta.id === "wty-msyi-khr" && !manifest
      ? {
          name: studentName,
          grade: "8. Sınıf",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kayra",
          learningStyle: "Sorgulayıcı-Görsel Öğrenen",
          learningStyleDescription:
            "Kayra, soru sorarak öğrenmeyi tercih ediyor. LGS hedefleri net; ünite bazlı planlama ile motive oluyor.",
          strengths: ["Aktif soru sorma", "Hedef odaklı çalışma", "Ders planına uyum"],
          challenges: ["Uzun teorik bloklarda dikkat", "Kronoloji ezberinde zorlanma"],
          comprehensionScore: 74,
          tags: ["Sorgulayıcı", "LGS Odaklı", "8. Sınıf"],
        }
      : inferStudentProfile(transcript, studentName);

  return {
    teacher: inferTeacherProfile(teacherName, teacherTitle),
    student,
    subject,
    title,
    lessonType,
  };
}

function subjectToTitle(subject: string): string {
  const hit = SUBJECT_SIGNALS.find((s) => s.subject === subject);
  return hit?.title ?? "Öğretmen";
}

export function isMathSubject(subject: string): boolean {
  return subject.includes("Matematik");
}

export function isHistorySubject(subject: string): boolean {
  return subject.includes("İnkılap");
}
