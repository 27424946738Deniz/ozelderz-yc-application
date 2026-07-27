import type OpenAI from "openai";
import type {
  StudentProfileDetail,
  StudentTypeMatch,
  TeachingStyleAnalysis,
} from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import { selectStudentExcerpts } from "@/lib/understanding-insights";
import type {
  StoredStudentProfileContent,
  StoredTeacherProfileContent,
} from "@/lib/profile-store";

const MODEL = process.env.OPENAI_GUIDE_MODEL ?? "gpt-4o";
const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreTeacherSegment(seg: TranscriptSegment): number {
  const t = seg.text;
  let score = 0;
  if (isQuestion(t, seg.speaker)) score += 3;
  if (t.length > 90) score += 3;
  if (
    /lgs|ünite|plan|whatsapp|pdf|ekran|harita|demo|anlaştık|tamam mı|hedef|motiv|aferin|tebrik|soru dağılım/i.test(
      t
    )
  ) {
    score += 5;
  }
  if (t.trim().length < 12) score -= 2;
  return score;
}

export function selectTeacherExcerpts(
  transcript: TranscriptData,
  maxSegments = 65
): Array<{ time: string; text: string }> {
  const teacherSegs = transcript.segments.filter((s) => s.speaker === TEACHER);
  if (teacherSegs.length === 0) return [];

  const seen = new Set<number>();
  const picked: TranscriptSegment[] = [];

  for (const seg of teacherSegs.slice(0, 8)) {
    if (!seen.has(seg.start)) {
      picked.push(seg);
      seen.add(seg.start);
    }
  }

  for (const seg of [...teacherSegs].sort(
    (a, b) => scoreTeacherSegment(b) - scoreTeacherSegment(a)
  )) {
    if (picked.length >= maxSegments) break;
    if (!seen.has(seg.start)) {
      picked.push(seg);
      seen.add(seg.start);
    }
  }

  return picked
    .sort((a, b) => a.start - b.start)
    .map((s) => ({
      time: formatTime(s.start),
      text: s.text.trim().replace(/\s+/g, " "),
    }))
    .filter((s) => s.text.length > 0);
}

function clampMatchScore(n: number) {
  return Math.max(55, Math.min(96, Math.round(n)));
}

export async function generateStudentProfileContent(
  openai: OpenAI,
  input: {
    studentName: string;
    teacherName: string;
    subject: string;
    lessonTitle: string;
    lessonType: string;
    grade: string;
    durationMin: number;
    participationPct: number;
    questionCount: number;
    excerpts: Array<{ time: string; text: string }>;
    understandingBetter?: Array<{ area: string; reason: string; example?: string }>;
    understandsLess?: Array<{ area: string; reason: string; alternative: string }>;
  }
): Promise<Omit<StoredStudentProfileContent, "meetCode" | "generatedAt">> {
  const system = `Sen özel ders koçususun. Tanışma/demo ders transkriptinden öğrenci profili yazıyorsun.

Kurallar:
- Sabit şablon başlıklar kullanma; her öğrenci için transkriptten özgün içerik üret
- Sadece transkriptte kanıtı olan maddeleri yaz; uydurma
- Madde sayıları zengin olsun (göz doldursun):
  - goals: 4–6
  - interestAreas: 4–6 (label, detail, level: high|medium|low)
  - strengths: 5–7 (somut, transkripte dayalı cümleler)
  - challenges: 4–6
  - motivationTriggers: 4–5
  - teachingTips: 5–7 (öğretmene somut, uygulanabilir)
  - notableQuotes: 5–8 (verilen alıntılardan seç; time alanını aynen koru)
  - tags: 4–6 kısa etiket
- school: transkriptte geçiyorsa okul adı, yoksa null
- Türkçe
- JSON: { school, tags, goals, interestAreas, strengths, challenges, motivationTriggers, teachingTips, notableQuotes }`;

  const user = JSON.stringify(
    {
      ogrenci: input.studentName,
      ogretmen: input.teacherName,
      ders: input.lessonTitle,
      brans: input.subject,
      sinif: input.grade,
      dersTipi: input.lessonType,
      sureDk: input.durationMin,
      katilimYuzdesi: input.participationPct,
      soruSayisi: input.questionCount,
      dahaIyiAnliyor: input.understandingBetter,
      zorlandigiAlanlar: input.understandsLess,
      ogrenciAlintilari: input.excerpts,
    },
    null,
    2
  );

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.55,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI boş yanıt (student profile)");

  const parsed = JSON.parse(raw) as Partial<{
    school: string | null;
    tags: string[];
    goals: string[];
    interestAreas: StudentProfileDetail["interestAreas"];
    strengths: string[];
    challenges: string[];
    motivationTriggers: string[];
    teachingTips: string[];
    notableQuotes: Array<{ text: string; time: string }>;
  }>;

  const level = (v: string): "high" | "medium" | "low" =>
    v === "high" || v === "low" ? v : "medium";

  return {
    school: parsed.school?.trim() || undefined,
    tags: (parsed.tags ?? []).filter(Boolean).slice(0, 8),
    goals: (parsed.goals ?? []).filter(Boolean).slice(0, 8),
    interestAreas: (parsed.interestAreas ?? [])
      .filter((a) => a?.label && a?.detail)
      .slice(0, 8)
      .map((a) => ({
        label: a.label.trim(),
        detail: a.detail.trim(),
        level: level(a.level ?? "medium"),
      })),
    strengths: (parsed.strengths ?? []).filter(Boolean).slice(0, 8),
    challenges: (parsed.challenges ?? []).filter(Boolean).slice(0, 8),
    motivationTriggers: (parsed.motivationTriggers ?? []).filter(Boolean).slice(0, 8),
    teachingTips: (parsed.teachingTips ?? []).filter(Boolean).slice(0, 8),
    notableQuotes: (parsed.notableQuotes ?? [])
      .filter((q) => q?.text?.trim())
      .slice(0, 10)
      .map((q) => ({ text: q.text.trim(), time: q.time?.trim() || "0:00" })),
  };
}

export async function generateTeacherProfileContent(
  openai: OpenAI,
  input: {
    teacherName: string;
    studentName: string;
    subject: string;
    lessonTitle: string;
    lessonType: string;
    durationMin: number;
    talkRatioPct: number;
    checkInCount: number;
    wpm: number;
    teacherExcerpts: Array<{ time: string; text: string }>;
    studentExcerpts?: Array<{ time: string; text: string }>;
    topics?: string[];
    studentQuestions?: number;
    studentLongTurns?: number;
  }
): Promise<
  Omit<StoredTeacherProfileContent, "meetCode" | "generatedAt">
> {
  const system = `Sen özel ders koordinatörüsün. Tanışma/demo ders transkriptinden öğretmen profili ve öğrenci eşleştirme rehberi yazıyorsun.

KRİTİK: Her madde bu derse özgü olmalı. Şu kalıpları ASLA kullanma:
- "LGS odaklı öğrenci", "plan arayan öğrenci", "sorgulayıcı-görsel öğrenen"
- "Yapı ve plan arayan öğrenciler", "Yeni başlayan öğrenci", "Düşük katılımlı dinleyici"
- "Haftalık program ve WhatsApp iletişimi" gibi her derste tekrarlanan cümleler

Bunun yerine transkriptte geçen somut konuları, öğrenci davranışlarını ve öğretmen tepkilerini kullan:
- Öğrenci tipi adları: transkriptteki gerçek durumdan türet (ör. "Devirli ondalıkta takılan, sayı doğrusu isteyen Ali profili" — ders matematikse ve transkriptte geçiyorsa)
- reason alanları: 2-3 cümle, transkriptteki spesifik an (konu, soru, öğretmen cümlesi) referansı
- example alanları: mümkünse öğretmen/öğrenci alıntısından kısa parça veya zaman damgası

Madde sayıları (göz doldursun, eksik bırakma):
- strengths: 6–8 (her biri transkriptteki farklı bir güçlü anı tarif etsin)
- developmentAreas: 4–6 (somut, ölçülebilir gözlem)
- coordinatorTips: 6–8 (bu hocayı hangi öğrenciye yönlendireceğini anlatan koordinatör notları)
- notableQuotes: 6–10 (verilen öğretmen alıntılarından seç; time aynen koru)
- studentTypeMatches: 6–8 (studentType her biri benzersiz ve bu dersten türetilmiş; matchScore 55–96; reason 2-3 cümle; traits 4–5; düşük skorlarda caution zorunlu)
- excelsWith: 6–8 (type özgün; reason transkript kanıtlı; example mümkünse alıntı/zaman)
- lessSuitedFor: 4–6 (type özgün; reason bu hocanın zayıf kaldığı an; alternative somut)
- matchingGuide: 6–8 (when/recommend/because — koordinatöre yönelik, derse özel senaryolar)
- overview: 4–5 cümle, bu hocanın bu dersteki öğretim tarzını özetlesin
- tags: 5–7 (transkriptten türetilmiş kısa etiketler)

Sadece transkriptte kanıtı olan maddeler; uydurma yok.
Türkçe.
JSON: { tags, strengths, developmentAreas, coordinatorTips, notableQuotes, studentTypeMatches, excelsWith, lessSuitedFor, matchingGuide, overview }`;

  const user = JSON.stringify(
    {
      ogretmen: input.teacherName,
      ogrenci: input.studentName,
      ders: input.lessonTitle,
      brans: input.subject,
      dersTipi: input.lessonType,
      sureDk: input.durationMin,
      konusmaOraniYuzde: input.talkRatioPct,
      kontrolSayisi: input.checkInCount,
      kelimeDk: input.wpm,
      ogrenciSoruSayisi: input.studentQuestions,
      ogrenciUzunYanit: input.studentLongTurns,
      islenenKonular: input.topics,
      ogretmenAlintilari: input.teacherExcerpts,
      ogrenciAlintilari: input.studentExcerpts,
    },
    null,
    2
  );

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.55,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI boş yanıt (teacher profile)");

  const parsed = JSON.parse(raw) as Partial<{
    tags: string[];
    strengths: string[];
    developmentAreas: string[];
    coordinatorTips: string[];
    notableQuotes: Array<{ text: string; time: string }>;
    studentTypeMatches: StudentTypeMatch[];
    excelsWith: TeachingStyleAnalysis["excelsWith"];
    lessSuitedFor: TeachingStyleAnalysis["lessSuitedFor"];
    matchingGuide: TeachingStyleAnalysis["matchingGuide"];
    overview: string;
  }>;

  return {
    tags: (parsed.tags ?? []).filter(Boolean).slice(0, 10),
    strengths: (parsed.strengths ?? []).filter(Boolean).slice(0, 10),
    developmentAreas: (parsed.developmentAreas ?? []).filter(Boolean).slice(0, 8),
    coordinatorTips: (parsed.coordinatorTips ?? []).filter(Boolean).slice(0, 10),
    notableQuotes: (parsed.notableQuotes ?? [])
      .filter((q) => q?.text?.trim())
      .slice(0, 12)
      .map((q) => ({ text: q.text.trim(), time: q.time?.trim() || "0:00" })),
    studentTypeMatches: (parsed.studentTypeMatches ?? [])
      .filter((m) => m?.studentType && m?.reason)
      .slice(0, 10)
      .map((m) => ({
        studentType: m.studentType.trim(),
        matchScore: clampMatchScore(Number(m.matchScore) || 70),
        reason: m.reason.trim(),
        traits: (m.traits ?? []).filter(Boolean).slice(0, 6),
        caution:
          typeof m.caution === "string" ? m.caution.trim() || undefined : undefined,
      }))
      .sort((a, b) => b.matchScore - a.matchScore),
    excelsWith: (parsed.excelsWith ?? [])
      .filter((e) => e?.type && e?.reason)
      .slice(0, 10)
      .map((e) => ({
        type: e.type.trim(),
        reason: e.reason.trim(),
        example: e.example?.trim() || undefined,
      })),
    lessSuitedFor: (parsed.lessSuitedFor ?? [])
      .filter((e) => e?.type && e?.reason && e?.alternative)
      .slice(0, 8)
      .map((e) => ({
        type: e.type.trim(),
        reason: e.reason.trim(),
        alternative: e.alternative.trim(),
      })),
    matchingGuide: (parsed.matchingGuide ?? [])
      .filter((g) => g?.when && g?.recommend && g?.because)
      .slice(0, 10)
      .map((g) => ({
        when: g.when.trim(),
        recommend: g.recommend.trim(),
        because: g.because.trim(),
      })),
    overview: parsed.overview?.trim(),
  };
}
