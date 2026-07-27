import type OpenAI from "openai";
import type { LearningStyleAnalysis } from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";

const STUDENT = "SPEAKER_01";
const MODEL = process.env.OPENAI_GUIDE_MODEL ?? "gpt-4o";

export type UnderstandingInsights = Pick<
  LearningStyleAnalysis,
  "understandsBetter" | "understandsLess"
>;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreStudentSegment(seg: TranscriptSegment): number {
  const t = seg.text;
  let score = 0;
  if (isQuestion(t, seg.speaker)) score += 4;
  if (t.length > 90) score += 4;
  else if (t.length > 45) score += 2;
  if (
    /takıl|zorlan|anlamad|karış|bilmiyorum|seviyorum|hedef|fen lisesi|galatasaray|pdf|deneme|lgs|soru|çözdüm|iyi|rahat|spor|voleybol|harita|tablo|ekran/i.test(
      t
    )
  ) {
    score += 5;
  }
  if (t.trim().length < 10) score -= 2;
  return score;
}

/** AI'ya gönderilecek öğrenci alıntıları — tüm transkript yerine kanıtlı örnekler */
export function selectStudentExcerpts(
  transcript: TranscriptData,
  maxSegments = 90
): Array<{ time: string; text: string }> {
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  if (studentSegs.length === 0) return [];

  const seen = new Set<number>();
  const picked: TranscriptSegment[] = [];

  for (const seg of studentSegs.slice(0, 8)) {
    if (!seen.has(seg.start)) {
      picked.push(seg);
      seen.add(seg.start);
    }
  }

  const ranked = [...studentSegs].sort(
    (a, b) => scoreStudentSegment(b) - scoreStudentSegment(a)
  );
  for (const seg of ranked) {
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

function normalizeBetter(
  items: Array<{ area?: string; reason?: string; example?: string }> | undefined
): UnderstandingInsights["understandsBetter"] {
  if (!items?.length) return [];
  return items
    .filter((i) => i.area?.trim() && i.reason?.trim())
    .map((i) => ({
      area: i.area!.trim(),
      reason: i.reason!.trim(),
      example: i.example?.trim() || undefined,
    }));
}

function normalizeLess(
  items:
    | Array<{ area?: string; reason?: string; alternative?: string }>
    | undefined
): UnderstandingInsights["understandsLess"] {
  if (!items?.length) return [];
  return items
    .filter((i) => i.area?.trim() && i.reason?.trim() && i.alternative?.trim())
    .map((i) => ({
      area: i.area!.trim(),
      reason: i.reason!.trim(),
      alternative: i.alternative!.trim(),
    }));
}

export async function generateUnderstandingInsights(
  openai: OpenAI,
  input: {
    studentName: string;
    teacherName: string;
    subject: string;
    lessonTitle: string;
    lessonType: string;
    durationMin: number;
    participationPct: number;
    studentQuestionCount: number;
    excerpts: Array<{ time: string; text: string }>;
  }
): Promise<UnderstandingInsights> {
  if (input.excerpts.length === 0) {
    return { understandsBetter: [], understandsLess: [] };
  }

  const system = `Sen özel ders pedagojisinde uzman bir öğrenme stili analistisin. Verilen ders transkriptinden öğrencinin NEYDEN DAHA İYİ ANLADIĞINI ve NEYDE ZORLANDIĞINI çıkarıyorsun.

Kurallar:
- Sabit kategori listesi KULLANMA (ör. "Somut materyal", "Görsel öğrenen" gibi şablon başlıklar yasak)
- Her madde başlığı (area) o öğrenciye ve o derse özgü, transkriptten türetilmiş olsun
- Sadece alıntılarda veya davranışta kanıtı olan maddeleri yaz; uydurma
- Madde sayısı esnek: understandsBetter ve understandsLess için ayrı ayrı 0–6 arası, kanıt kadar — iki taraf eşit olmak zorunda değil
- Bir tarafta hiç güçlü kanıt yoksa o liste boş veya çok kısa olabilir
- understandsBetter: area (özgün kısa başlık), reason (1–2 cümle, transkriptteki davranış/kanıt), example (öğrencinin sözünden birebir kısa alıntı — uydurma)
- understandsLess: area, reason (kanıt), alternative (öğretmene somut, uygulanabilir alternatif — 1 cümle)
- Kısa "evet/hmm" onayları tek başına madde yapma; anlamlı örüntüler için kullan
- Türkçe yaz
- JSON: { "understandsBetter": [{ "area", "reason", "example" }], "understandsLess": [{ "area", "reason", "alternative" }] }`;

  const user = JSON.stringify(
    {
      ogrenci: input.studentName,
      ogretmen: input.teacherName,
      ders: input.lessonTitle,
      brans: input.subject,
      dersTipi: input.lessonType,
      sureDk: input.durationMin,
      katilimYuzdesi: input.participationPct,
      soruSayisi: input.studentQuestionCount,
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
  if (!raw) throw new Error("OpenAI boş yanıt (understanding insights)");

  const parsed = JSON.parse(raw) as {
    understandsBetter?: Array<{ area: string; reason: string; example?: string }>;
    understandsLess?: Array<{
      area: string;
      reason: string;
      alternative: string;
    }>;
  };

  return {
    understandsBetter: normalizeBetter(parsed.understandsBetter),
    understandsLess: normalizeLess(parsed.understandsLess),
  };
}
