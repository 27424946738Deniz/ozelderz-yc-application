import type OpenAI from "openai";
import type { LessonContext } from "@/lib/lesson-context";
import { detectLessonGaps } from "@/lib/lesson-gaps";
import type { LessonMeta } from "@/lib/lesson-registry";
import { buildLessonRoadmap } from "@/lib/roadmap-generator";
import type { StoredStudentProfileContent } from "@/lib/profile-store";
import { buildTranscriptDigest } from "@/lib/transcript-digest";
import { selectStudentExcerpts } from "@/lib/understanding-insights";
import type {
  LessonRoadmap,
  RoadmapCheckpoint,
  RoadmapPhase,
} from "@/types/roadmap";
import type { TranscriptData } from "@/types/transcript";

const MODEL = process.env.OPENAI_GUIDE_MODEL ?? "gpt-4o";

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

function lessonTypeLabel(type: LessonContext["lessonType"]): string {
  if (type === "demo") return "Demo ders";
  if (type === "tanışma") return "Tanışma dersi";
  if (type === "konu") return "Konu dersi";
  return "Ders";
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeCheckpoint(
  cp: Partial<RoadmapCheckpoint>,
  index: number,
  fallback?: RoadmapCheckpoint
): RoadmapCheckpoint | null {
  const base = fallback;
  if (!cp?.title && !base?.title) return null;

  const questionCount =
    Number(cp.test?.questionCount) || base?.test.questionCount || 10;
  const passScore =
    Number(cp.test?.passScore) || base?.test.passScore || Math.ceil(questionCount * 0.7);
  const partialScore =
    cp.test?.partialScore !== undefined
      ? Number(cp.test.partialScore)
      : base?.test.partialScore ?? Math.ceil(questionCount * 0.5);

  const pass = cp.outcomes?.pass ?? base?.outcomes.pass;
  const partial = cp.outcomes?.partial ?? base?.outcomes.partial;
  const fail = cp.outcomes?.fail ?? base?.outcomes.fail;
  if (!pass || !fail) return base ?? null;

  return {
    id: asString(cp.id, base?.id || `cp-${index + 1}`),
    title: asString(cp.title, base?.title || "Checkpoint"),
    weekRange: asString(cp.weekRange, base?.weekRange || `Hafta ${index * 2 + 1}`),
    status: cp.status ?? base?.status ?? "core",
    transcriptContext: cp.transcriptContext?.trim() || base?.transcriptContext,
    teacherFocus: asStringArray(cp.teacherFocus, base?.teacherFocus ?? []).slice(0, 5),
    studentTasks: asStringArray(cp.studentTasks, base?.studentTasks ?? []).slice(0, 5),
    homework: {
      title: cp.homework?.title?.trim() || base?.homework.title || "Haftalık ödev",
      description:
        cp.homework?.description?.trim() || base?.homework.description || "",
      quantity: cp.homework?.quantity?.trim() || base?.homework.quantity || "15–20 soru",
      estimatedMinutes:
        cp.homework?.estimatedMinutes !== undefined
          ? Number(cp.homework.estimatedMinutes)
          : base?.homework.estimatedMinutes,
    },
    test: {
      label: cp.test?.label?.trim() || base?.test.label || "Kontrol testi",
      description: cp.test?.description?.trim() || base?.test.description || "",
      questionCount,
      passScore,
      partialScore,
      format: cp.test?.format?.trim() || base?.test.format || "Karışık",
    },
    outcomes: {
      pass: {
        condition: pass.condition?.trim() || `≥${passScore}/${questionCount} doğru`,
        headline: pass.headline?.trim() || base?.outcomes.pass.headline || "Sonraki adıma geç",
        detail: pass.detail?.trim() || base?.outcomes.pass.detail || "",
        teacherSteps: asStringArray(
          pass.teacherSteps,
          base?.outcomes.pass.teacherSteps ?? []
        ).slice(0, 4),
        studentSteps: asStringArray(
          pass.studentSteps,
          base?.outcomes.pass.studentSteps ?? []
        ).slice(0, 4),
        nextCheckpointId: pass.nextCheckpointId?.trim() || base?.outcomes.pass.nextCheckpointId,
        nextCheckpointTitle:
          pass.nextCheckpointTitle?.trim() || base?.outcomes.pass.nextCheckpointTitle,
        temperamentNote: pass.temperamentNote?.trim(),
      },
      partial: partial
        ? {
            condition:
              partial.condition?.trim() ||
              `${partialScore}–${passScore - 1}/${questionCount} doğru`,
            headline: partial.headline?.trim() || base?.outcomes.partial?.headline || "",
            detail: partial.detail?.trim() || base?.outcomes.partial?.detail || "",
            teacherSteps: asStringArray(
              partial.teacherSteps,
              base?.outcomes.partial?.teacherSteps ?? []
            ).slice(0, 4),
            studentSteps: asStringArray(
              partial.studentSteps,
              base?.outcomes.partial?.studentSteps ?? []
            ).slice(0, 4),
            nextCheckpointId: partial.nextCheckpointId?.trim(),
            nextCheckpointTitle:
              partial.nextCheckpointTitle?.trim() ||
              base?.outcomes.partial?.nextCheckpointTitle,
            temperamentNote: partial.temperamentNote?.trim(),
          }
        : base?.outcomes.partial,
      fail: {
        condition:
          fail.condition?.trim() ||
          `<${partialScore}/${questionCount} doğru veya ödev yapılmadı`,
        headline: fail.headline?.trim() || base?.outcomes.fail.headline || "Geri dönüş yolu",
        detail: fail.detail?.trim() || base?.outcomes.fail.detail || "",
        teacherSteps: asStringArray(
          fail.teacherSteps,
          base?.outcomes.fail.teacherSteps ?? []
        ).slice(0, 4),
        studentSteps: asStringArray(
          fail.studentSteps,
          base?.outcomes.fail.studentSteps ?? []
        ).slice(0, 4),
        nextCheckpointId: fail.nextCheckpointId?.trim(),
        nextCheckpointTitle:
          fail.nextCheckpointTitle?.trim() || base?.outcomes.fail.nextCheckpointTitle,
        temperamentNote:
          fail.temperamentNote?.trim() || base?.outcomes.fail.temperamentNote,
      },
    },
  };
}

async function enrichPhase(
  openai: OpenAI,
  phase: RoadmapPhase,
  phaseIndex: number,
  input: {
    fn: string;
    digest: ReturnType<typeof buildTranscriptDigest>;
    gaps: ReturnType<typeof detectLessonGaps>;
    subject: string;
    lessonType: string;
    studentExcerpts: Array<{ time: string; text: string }>;
    profile?: StoredStudentProfileContent | null;
  }
): Promise<RoadmapPhase> {
  const system = `Sen özel ders koçusun. Verilen checkpoint iskeletini transkripte dayalı BENZERSİZ içerikle dolduruyorsun.

KRİTİK: Her checkpoint bu derse ve bu öğrenciye özgü olmalı. Şu kalıpları ASLA kullanma:
- "Haftada 20 X sorusu", "5 örnek çözümü deftere adım adım yaz" (konuya özel bağlam olmadan)
- "→ Sonraki faz", "→ Temel tekrar döngüsü" (somut konu adı olmadan)
- "15 dk birebir: 5 kolay + 5 orta soru" (her checkpoint'te aynı)
- "LGS karışık deneme" (transkriptte geçmeyen konular için)
- Matematik şablonunu tarih öğrencisine veya tersine kopyalama

Bunun yerine:
- homework.title/description: transkriptteki gerçek konu, kaynak, takılma noktası
- test.label/description: işlenen konuya özel soru tipi
- teacherFocus/studentTasks: öğrencinin adı + transkriptteki spesifik davranış
- outcomes.pass/partial/fail: üç dal da dolu; condition somut (≥8/12 doğru)
- headline/detail: bir sonraki checkpoint'in gerçek başlığına referans
- transcriptContext: hangi transkript sinyaline dayandığını 1 cümle yaz
- temperamentNote: öğrencinin bu dersteki profiline özel

Kurallar:
- checkpoint id'lerini değiştirme
- Sadece verilen transkript sinyallerini kullan; uydurma
- Türkçe
- JSON: { "label"?: string, "goal"?: string, "checkpoints": [ ...aynı id'lerle... ] }`;

  const user = JSON.stringify(
    {
      faz: phase.label,
      fazHedefi: phase.goal,
      brans: input.subject,
      dersTipi: input.lessonType,
      ogrenciIlkIsim: input.fn,
      transkriptOzet: input.digest,
      eksiklikler: input.gaps.map((g) => ({
        baslik: g.title,
        gozlem: g.observation,
      })),
      profilHedefleri: input.profile?.goals?.slice(0, 5),
      profilZorluklari: input.profile?.challenges?.slice(0, 4),
      profilGucluYonler: input.profile?.strengths?.slice(0, 4),
      ogrenciAlintilari: input.studentExcerpts.slice(0, 40),
      checkpointIskeleti: phase.checkpoints.map((cp) => ({
        id: cp.id,
        title: cp.title,
        status: cp.status,
        weekRange: cp.weekRange,
      })),
    },
    null,
    2
  );

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return phase;

  const parsed = JSON.parse(raw) as {
    label?: string;
    goal?: string;
    checkpoints?: Partial<RoadmapCheckpoint>[];
  };

  const enriched = phase.checkpoints
    .map((base, i) => {
      const fromAi = parsed.checkpoints?.find((c) => c.id === base.id) ??
        parsed.checkpoints?.[i];
      return normalizeCheckpoint(fromAi ?? {}, i, base);
    })
    .filter((cp): cp is RoadmapCheckpoint => cp !== null);

  return {
    ...phase,
    id: phase.id || `phase-${phaseIndex + 1}`,
    label: parsed.label?.trim() || phase.label,
    goal: parsed.goal?.trim() || phase.goal,
    checkpoints: enriched.length > 0 ? enriched : phase.checkpoints,
  };
}

export async function generateLessonRoadmapWithAI(
  openai: OpenAI,
  meta: LessonMeta,
  transcript: TranscriptData,
  context: LessonContext,
  input?: { profile?: StoredStudentProfileContent | null }
): Promise<LessonRoadmap> {
  const base = buildLessonRoadmap(meta, transcript, context);
  const digest = buildTranscriptDigest(transcript, {
    meetCode: meta.id,
    studentName: context.student.name,
    teacherName: context.teacher.name,
    subject: context.subject,
    lessonTitle: context.title,
    lessonType: context.lessonType,
  });

  const gaps = detectLessonGaps(transcript, {
    studentName: context.student.name,
    subject: context.subject,
    lessonType: context.lessonType,
  }).slice(0, 6);

  const fn = firstName(context.student.name);
  const studentExcerpts = selectStudentExcerpts(transcript);
  const profile = input?.profile ?? null;

  const system = `Sen özel ders koçususun. Tanışma/demo ders transkriptinden yol haritası giriş çıkarımları yazıyorsun.

KRİTİK: Her madde bu derse özgü olmalı. Şablon cümleler kullanma.
- introLessonInsights: 4–6 cümle; transkriptteki somut konu, katılım, hedef, takılma noktası
- temperamentSignals: 3–5 madde; öğrencinin bu dersteki iletişim tarzı (soru sayısı, kısa/uzun yanıt, kaygı, ilgi alanı)

Sadece transkriptte kanıtı olan maddeler; uydurma yok. Türkçe.
JSON: { introLessonInsights: string[], temperamentSignals: string[] }`;

  const metaResponse = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify(
          {
            ogrenci: context.student.name,
            ogretmen: context.teacher.name,
            brans: context.subject,
            ders: context.title,
            transkriptOzet: digest,
            eksiklikler: gaps.map((g) => ({
              baslik: g.title,
              gozlem: g.observation,
            })),
            profilHedefleri: profile?.goals?.slice(0, 5),
            ogrenciAlintilari: studentExcerpts.slice(0, 25),
          },
          null,
          2
        ),
      },
    ],
  });

  const metaRaw = metaResponse.choices[0]?.message?.content;
  const metaParsed = metaRaw
    ? (JSON.parse(metaRaw) as {
        introLessonInsights?: string[];
        temperamentSignals?: string[];
      })
    : {};

  const phases: RoadmapPhase[] = [];
  for (let i = 0; i < base.phases.length; i++) {
    phases.push(
      await enrichPhase(openai, base.phases[i], i, {
        fn,
        digest,
        gaps,
        subject: context.subject,
        lessonType: lessonTypeLabel(context.lessonType),
        studentExcerpts,
        profile,
      })
    );
  }

  return {
    ...base,
    introLessonInsights:
      asStringArray(metaParsed.introLessonInsights, base.introLessonInsights).slice(0, 6),
    student: {
      ...base.student,
      temperamentSignals: asStringArray(
        metaParsed.temperamentSignals,
        base.student.temperamentSignals
      ).slice(0, 5),
    },
    phases,
    generatedFrom: `${lessonTypeLabel(context.lessonType)} — ${meta.id} transkripti (AI)`,
  };
}
