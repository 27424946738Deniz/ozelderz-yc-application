import type { LessonContext } from "@/lib/lesson-context";
import {
  extractTopicsFromTranscript,
  isHistorySubject,
  isMathSubject,
} from "@/lib/lesson-context";
import { detectLessonGaps } from "@/lib/lesson-gaps";
import type { LessonMeta } from "@/lib/lesson-registry";
import { isQuestion } from "@/lib/transcript-analytics";
import type {
  LessonRoadmap,
  RoadmapCheckpoint,
  RoadmapOutcome,
  RoadmapPhase,
} from "@/types/roadmap";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

interface TranscriptMetrics {
  studentSegs: TranscriptSegment[];
  teacherSegs: TranscriptSegment[];
  participationPct: number;
  studentQuestions: number;
  shortAnswers: number;
  longAnswers: number;
  shortRatio: number;
  goalMentions: number;
  visualMentions: number;
  homeworkMentions: number;
  struggleSeg?: TranscriptSegment;
  worrySeg?: TranscriptSegment;
}

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function quoteSnippet(text: string, max = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function collectMetrics(transcript: TranscriptData): TranscriptMetrics {
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
  const participationPct = Math.round(
    (studentTalk / Math.max(totalTalk, 1)) * 100
  );
  const studentQuestions = studentSegs.filter((s) =>
    isQuestion(s.text, s.speaker)
  ).length;
  const shortAnswers = studentSegs.filter((s) => s.text.trim().length < 15).length;
  const longAnswers = studentSegs.filter((s) => s.text.length > 60).length;
  const shortRatio =
    studentSegs.length > 0 ? shortAnswers / studentSegs.length : 0;

  const blob = transcript.segments.map((s) => s.text).join(" ");

  return {
    studentSegs,
    teacherSegs,
    participationPct,
    studentQuestions,
    shortAnswers,
    longAnswers,
    shortRatio,
    goalMentions: (blob.match(/lgs|fen lisesi|hedef|deneme|sınav|net\b/gi) ?? [])
      .length,
    visualMentions: (blob.match(/pdf|ekran|harita|tablo|şema|sayı doğrusu|slayt/gi) ?? [])
      .length,
    homeworkMentions: (blob.match(/ödev|test|çöz|alıştırma/gi) ?? []).length,
    struggleSeg: studentSegs.find((s) =>
      /takıl|zorlan|anlamadım|karıştır|bilmiyorum/i.test(s.text)
    ),
    worrySeg: studentSegs.find((s) =>
      /endişe|korkuyorum|yapamıyorum|düşük puan/i.test(s.text)
    ),
  };
}

function lessonTypeLabel(type: LessonContext["lessonType"]): string {
  if (type === "demo") return "Demo ders";
  if (type === "tanışma") return "Tanışma dersi";
  if (type === "konu") return "Konu dersi";
  return "Ders";
}

function buildIntroInsights(
  context: LessonContext,
  metrics: TranscriptMetrics,
  topics: string[],
  meta: LessonMeta
): string[] {
  const fn = firstName(context.student.name);
  const insights: string[] = [];

  const topicLine =
    topics.length > 0
      ? topics.slice(0, 3).join(", ")
      : context.subject;

  insights.push(
    `${lessonTypeLabel(context.lessonType)} kaydında öne çıkan konular: ${topicLine}.`
  );

  if (metrics.participationPct >= 25) {
    insights.push(
      `${fn} derste aktif katılım gösterdi (konuşma süresinin ~%${metrics.participationPct}'i).`
    );
  } else {
    insights.push(
      `Katılım sınırlı (%${metrics.participationPct}) — kısa döngülü soru-cevap checkpoint'leri öncelikli.`
    );
  }

  if (metrics.goalMentions > 0) {
    insights.push(
      `LGS / hedef / deneme planı transkriptte geçti — checkpoint'ler hedef odaklı ilerleyecek.`
    );
  }

  if (metrics.struggleSeg) {
    insights.push(
      `${fn} zorlandığını belirtti: "${quoteSnippet(metrics.struggleSeg.text)}" — ilk core checkpoint buradan başlar.`
    );
  } else if (context.student.challenges[0]) {
    insights.push(`Profil sinyali: ${context.student.challenges[0]}.`);
  }

  if (metrics.visualMentions >= 2) {
    insights.push(
      `PDF, tablo veya görsel materyal planı konuşuldu — materyal bazlı görevler profile uygun.`
    );
  } else if (metrics.homeworkMentions >= 5) {
    insights.push(
      `Ödev/test ritmi konuşuldu (${metrics.homeworkMentions} referans) — haftalık ölçülebilir görevler eklendi.`
    );
  }

  if (insights.length < 4) {
    insights.push(
      `Yol haritası ${meta.id} transkriptinden otomatik üretildi.`
    );
  }

  return insights.slice(0, 5);
}

function buildTemperamentSignals(
  context: LessonContext,
  metrics: TranscriptMetrics,
  gaps: ReturnType<typeof detectLessonGaps>
): string[] {
  const fn = firstName(context.student.name);
  const signals: string[] = [];

  if (metrics.studentQuestions >= 12) {
    signals.push(
      `${metrics.studentQuestions} soru sordu — sorgulayıcı profil; checkpoint'lerde "neden?" ve mini tartışma işe yarar`
    );
  } else if (metrics.studentQuestions < 5 && metrics.studentSegs.length > 20) {
    signals.push(
      `Az soru üretiyor (${metrics.studentQuestions}) — her 8–10 dk'da somut soru şart`
    );
  }

  if (metrics.shortRatio > 0.5 && metrics.studentSegs.length > 15) {
    signals.push(
      `Yanıtların %${Math.round(metrics.shortRatio * 100)}'i kısa onay — uzun anlatım bloklarında pasifleşiyor`
    );
  } else if (metrics.longAnswers >= 3) {
    signals.push(
      `Kendi cümleleriyle açıklama yapabiliyor (${metrics.longAnswers} uzun yanıt) — anlatarak öğrenme güçlü`
    );
  }

  if (metrics.visualMentions >= 2) {
    signals.push(
      `Görsel materyal (PDF, tablo, harita) talep ediyor — soyut anlatımda dikkat dağılabilir`
    );
  }

  if (metrics.worrySeg) {
    signals.push(
      `Performans endişesi var: "${quoteSnippet(metrics.worrySeg.text)}" — küçük kazanımlarla özgüven desteklenmeli`
    );
  }

  const topGap = gaps.sort((a, b) => b.severity - a.severity)[0];
  if (topGap && signals.length < 4) {
    signals.push(`${topGap.title}: ${topGap.observation.split(";")[0]}`);
  }

  if (signals.length === 0) {
    signals.push(
      `${fn} için ${context.student.learningStyle} profili — transkript sinyallerine göre checkpoint'ler kişiselleştirildi`
    );
  }

  return signals.slice(0, 4);
}

function defaultTopics(subject: string, lessonType: LessonContext["lessonType"]): string[] {
  if (isMathSubject(subject)) {
    return lessonType === "tanışma"
      ? ["çalışma sistemi", "seviye tespiti", "rasyonel sayılar", "LGS deneme"]
      : ["konu pekiştirme", "işlem pratiği", "problem çözümü", "LGS deneme"];
  }
  if (isHistorySubject(subject)) {
    return lessonType === "tanışma"
      ? ["ünite planı", "Atatürk", "Milli Mücadele", "LGS tekrar"]
      : ["ünite özeti", "kronoloji", "kavram haritası", "LGS deneme"];
  }
  return ["konu özeti", "pekiştirme", "alıştırma", "değerlendirme"];
}

function resolveTopics(
  transcript: TranscriptData,
  subject: string,
  lessonType: LessonContext["lessonType"]
): string[] {
  const extracted = extractTopicsFromTranscript(transcript, subject).filter(
    (t) => !/demo ders|ders planı|kaynak/i.test(t)
  );
  const base = extracted.length > 0 ? extracted : defaultTopics(subject, lessonType);
  return [...new Set(base)].slice(0, 5);
}

function weekRange(startWeek: number, span: number): string {
  const end = startWeek + span - 1;
  return startWeek === end ? `Hafta ${startWeek}` : `Hafta ${startWeek}–${end}`;
}

function temperamentNote(
  fn: string,
  metrics: TranscriptMetrics,
  weakArea: string
): string {
  if (metrics.worrySeg) {
    return `${fn} sınav kaygısı taşıyor — ${weakArea} için küçük setlerle başla, her doğruyu vurgula.`;
  }
  if (metrics.shortRatio > 0.5) {
    return `${fn} kısa onaylarla geçiyor — ${weakArea} için 5 dk anlat → hemen soru → tekrar döngüsü kullan.`;
  }
  if (metrics.visualMentions >= 2) {
    return `${fn} görsel materyalle daha aktif — ${weakArea} için tablo/harita/PDF ile somutlaştır.`;
  }
  return `${fn} için ${weakArea} zayıf noktası — önce 3 kolay örnekle güven ver, sonra zorlaştır.`;
}

function buildOutcomes(
  fn: string,
  metrics: TranscriptMetrics,
  topic: string,
  qCount: number,
  passScore: number,
  partialScore: number,
  nextTopic?: string,
  nextId?: string
): RoadmapCheckpoint["outcomes"] {
  const pass: RoadmapOutcome = {
    condition: `≥${passScore}/${qCount} doğru (%${Math.round((passScore / qCount) * 100)}+)`,
    headline: nextTopic ? `→ ${capitalizeTopic(nextTopic)}` : "→ Sonraki faz",
    detail: nextTopic
      ? `${capitalizeTopic(topic)} oturdu; ${capitalizeTopic(nextTopic)} hattına geç.`
      : "Faz hedefleri tamam; bir üst zorluk seviyesine geç.",
    teacherSteps: [
      `${capitalizeTopic(topic)} özetini 5 dk'da kapat`,
      nextTopic
        ? `${capitalizeTopic(nextTopic)} için giriş örneği göster`
        : "Genel tekrar planını güncelle",
    ],
    studentSteps: [
      `Son ${capitalizeTopic(topic)} setini deftere işle`,
      nextTopic
        ? `${capitalizeTopic(nextTopic)} için 5 ön hazırlık sorusu çöz`
        : "Haftalık tekrar listesini yaz",
    ],
    nextCheckpointId: nextId,
    nextCheckpointTitle: nextTopic ? capitalizeTopic(nextTopic) : "Faz kapanışı",
  };

  const partial: RoadmapOutcome = {
    condition: `${partialScore}–${passScore - 1}/${qCount} doğru`,
    headline: `→ ${capitalizeTopic(topic)} destekli pekiştirme`,
    detail: "Temel var ama tam oturmamış — aynı konuda hedefli setle devam.",
    teacherSteps: [
      `Yanlış alt tipi tespit et (${capitalizeTopic(topic)})`,
      "10 dk birebir: 3 kolay + 2 orta örnek",
    ],
    studentSteps: [
      `Zayıf alt tipten 12 soru (${capitalizeTopic(topic)})`,
      "3 örneği sesli çözüm yolu ile anlat",
    ],
    nextCheckpointTitle: `${capitalizeTopic(topic)} tekrar`,
    temperamentNote: temperamentNote(fn, metrics, topic),
  };

  const fail: RoadmapOutcome = {
    condition: `<${partialScore}/${qCount} doğru veya ödev yapılmadı`,
    headline: `→ ${capitalizeTopic(topic)} temel tekrar`,
    detail: "Önce temel kavram ve kolay örneklerle güven inşa et, sonra tekrar ölç.",
    teacherSteps: [
      `15 dk birebir: ${capitalizeTopic(topic)} için 5 kolay + 5 orta soru`,
      "Zayıf alt konuyu birlikte belirle",
    ],
    studentSteps: [
      "Konu listesi çıkar ve işaretle",
      `Zayıf konudan 15 kolay soru (${capitalizeTopic(topic)})`,
    ],
    nextCheckpointTitle: `${capitalizeTopic(topic)} temel tekrar`,
    temperamentNote: temperamentNote(fn, metrics, topic),
  };

  return { pass, partial, fail };
}

function foundationCheckpoint(
  context: LessonContext,
  metrics: TranscriptMetrics,
  topics: string[],
  weekStart: number,
  nextTopic?: string,
  nextId?: string
): RoadmapCheckpoint {
  const fn = firstName(context.student.name);
  const isIntro = context.lessonType === "tanışma" || context.lessonType === "demo";
  const topicHint = topics[0] ?? context.subject;

  const teacherFocus = [
    isIntro
      ? `${lessonTypeLabel(context.lessonType)} notlarını özetle — ${topicHint} önceliği`
      : `Son ders (${topicHint}) özetini 10 dk'da tekrarla`,
    "Haftalık plan ve ödev formatını netleştir (ölçülebilir: '10 soru', '30 dk')",
  ];

  if (isHistorySubject(context.subject)) {
    teacherFocus.push("LGS soru dağılımını veya ünite planını tablo ile göster");
  } else if (isMathSubject(context.subject)) {
    teacherFocus.push("LGS matematik soru dağılımını veya konu listesini tablo ile göster");
  } else {
    teacherFocus.push(`${context.subject} müfredat çerçevesini netleştir`);
  }

  if (metrics.goalMentions > 0) {
    teacherFocus.push(`${fn}'nın hedef/deneme planını programa bağla`);
  }

  const studentTasks = [
    isIntro
      ? `${lessonTypeLabel(context.lessonType)}de işlenen 5 örneği tekrar çöz`
      : `Son derste işlenen ${topicHint} örneklerini tekrar et`,
    "Takıldığın konuları liste halinde yaz",
    `İlk ${context.subject.includes("İnkılap") ? "İnkılap" : "konu"} teşhis testini çöz (sadece tespit)`,
  ];

  const qCount = isHistorySubject(context.subject) ? 10 : 15;
  const passScore = isHistorySubject(context.subject) ? 4 : 7;
  const partialScore = Math.max(2, passScore - 2);

  return {
    id: "cp-foundation",
    title: isIntro ? `${lessonTypeLabel(context.lessonType)} & çalışma sistemi` : "Ders özeti & çalışma ritmi",
    weekRange: weekRange(weekStart, 2),
    status: "foundation",
    transcriptContext: metrics.struggleSeg
      ? `Zorlanma sinyali: "${quoteSnippet(metrics.struggleSeg.text)}"`
      : `${lessonTypeLabel(context.lessonType)} çıktıları ve çalışma ritmi`,
    teacherFocus,
    studentTasks,
    homework: {
      title: "Başlangıç ödev seti",
      description: `${topicHint} teşhis ve tekrar`,
      quantity: isHistorySubject(context.subject) ? "15 soru, 3 gün" : "20 soru, 3 gün",
      estimatedMinutes: 40,
    },
    test: {
      label: "Başlangıç teşhis testi",
      description: `${qCount} soru karışık — seviye tespiti`,
      questionCount: qCount,
      passScore,
      partialScore,
      format: isHistorySubject(context.subject)
        ? "LGS İnkılap karışık"
        : isMathSubject(context.subject)
          ? "LGS matematik karışık"
          : `${context.subject} karışık`,
    },
    outcomes: buildOutcomes(
      fn,
      metrics,
      `genel ${context.subject} temeli`,
      qCount,
      passScore,
      partialScore,
      nextTopic ?? topicHint,
      nextId
    ),
  };
}

function topicCheckpoint(
  topic: string,
  index: number,
  context: LessonContext,
  metrics: TranscriptMetrics,
  weekStart: number,
  nextTopic?: string,
  nextId?: string
): RoadmapCheckpoint {
  const fn = firstName(context.student.name);
  const id = `cp-${slugify(topic) || `topic-${index}`}`;
  const qCount = isHistorySubject(context.subject) ? 10 : 12;
  const passScore = Math.ceil(qCount * 0.7);
  const partialScore = Math.ceil(qCount * 0.5);

  const teacherFocus = [
    `${topic} konusunu transkriptteki örneklerle tekrarla`,
    `Her derste 2 ${context.subject.includes("LGS") || metrics.goalMentions > 0 ? "LGS" : "çıkmış"} sorusu`,
    `${fn}'ın anlama kontrolü: kendi cümlesiyle özet iste`,
  ];

  if (isMathSubject(context.subject) && /rasyonel|ondalık|devirli/i.test(topic)) {
    teacherFocus.push("Sayı doğrusu ve adım adım dönüşüm örnekleri kullan");
  }
  if (isHistorySubject(context.subject)) {
    teacherFocus.push("Kronoloji çizelgesi veya kavram haritası ile pekiştir");
  }

  return {
    id,
    title: capitalizeTopic(topic),
    weekRange: weekRange(weekStart, 3),
    status: "core",
    transcriptContext: metrics.struggleSeg && topic.toLowerCase().includes(metrics.struggleSeg.text.slice(0, 8).toLowerCase())
      ? `Öğrenci bu konuda zorlandığını belirtti`
      : `Transkriptte işlenen konu: ${capitalizeTopic(topic)}`,
    teacherFocus,
    studentTasks: [
      `Haftada 20 ${topic} sorusu`,
      "5 örnek çözümü deftere adım adım yaz",
      `1 mini tekrar testi (${topic})`,
    ],
    homework: {
      title: `${capitalizeTopic(topic)} ödev seti`,
      description: `Hedefli ${topic} pratiği`,
      quantity: "20 soru, 4 gün",
      estimatedMinutes: 50,
    },
    test: {
      label: `${capitalizeTopic(topic)} kontrol testi`,
      description: `${qCount} soru — ${topic}`,
      questionCount: qCount,
      passScore,
      partialScore,
      format: capitalizeTopic(topic),
    },
    outcomes: buildOutcomes(
      fn,
      metrics,
      topic,
      qCount,
      passScore,
      partialScore,
      nextTopic,
      nextId
    ),
  };
}

function examCheckpoint(
  context: LessonContext,
  metrics: TranscriptMetrics,
  topics: string[],
  weekStart: number
): RoadmapCheckpoint {
  const fn = firstName(context.student.name);
  const qCount = isHistorySubject(context.subject) ? 10 : 20;
  const passScore = Math.ceil(qCount * 0.65);
  const partialScore = Math.ceil(qCount * 0.45);
  const topicSummary = topics.slice(0, 3).join(", ") || context.subject;

  return {
    id: "cp-exam",
    title: isHistorySubject(context.subject)
      ? "LGS İnkılap deneme & analiz"
      : "LGS karışık deneme & analiz",
    weekRange: weekRange(weekStart, 4),
    status: "exam",
    transcriptContext: metrics.goalMentions > 0
      ? "Transkriptte LGS/hedef planı konuşuldu"
      : "Faz kapanış performans ölçümü",
    teacherFocus: [
      `${topicSummary} konularını karışık denemede ölç`,
      "Yanlış analizi: konu + hata tipi tablosu",
      `${fn} ile net hedefi güncelle`,
    ],
    studentTasks: [
      `Tam ${qCount} soruluk deneme çöz`,
      "Yanlışları konu bazlı listele",
      "1 haftalık tekrar planı yaz",
    ],
    homework: {
      title: "Deneme öncesi tekrar",
      description: `${topicSummary} karışık set`,
      quantity: `${qCount} soruluk deneme + 10 tekrar sorusu`,
      estimatedMinutes: 90,
    },
    test: {
      label: "Faz kapanış denemesi",
      description: `${qCount} soru karışık — ${topicSummary}`,
      questionCount: qCount,
      passScore,
      partialScore,
      format: "LGS karışık deneme",
    },
    outcomes: {
      pass: {
        condition: `≥${passScore}/${qCount} doğru`,
        headline: "→ Sonraki faz / üst seviye",
        detail: "Faz hedefleri oturdu. Bir üst zorluk seviyesine geç.",
        teacherSteps: [
          "Net hedefini güncelle",
          "Bir sonraki fazın konu önceliğini belirle",
        ],
        studentSteps: [
          "Başarılı olduğun konuları listele",
          "Sonraki faz için haftalık plan yaz",
        ],
        nextCheckpointTitle: "Sonraki faz",
      },
      partial: {
        condition: `${partialScore}–${passScore - 1}/${qCount} doğru`,
        headline: "→ Hedefli tekrar + ikinci deneme",
        detail: "Yakın ama yeterli değil — zayıf 2 konuya odaklan, 1 hafta sonra tekrar deneme.",
        teacherSteps: [
          "En çok düşülen 2 konuyu seç",
          "Her birinden 10 soru + çözüm incelemesi",
        ],
        studentSteps: [
          "Zayıf 2 konu: 20'şer soruluk set",
          "Denemeyi 1 hafta sonra tekrarla",
        ],
        nextCheckpointTitle: "İkinci deneme",
        temperamentNote: temperamentNote(fn, metrics, "karışık deneme"),
      },
      fail: {
        condition: `<${partialScore}/${qCount} doğru veya deneme yapılmadı`,
        headline: "→ Temel tekrar döngüsü",
        detail: "Önce temel konulara dön, küçük setlerle güven inşa et.",
        teacherSteps: [
          "3 temel konuyu seç; her birinden 8 kolay soru",
          "48 saat sonra kısa tekrar testi",
        ],
        studentSteps: [
          "Zayıf 3 konu listesi çıkar",
          "Her konudan 10 kolay soru",
        ],
        nextCheckpointTitle: "Temel tekrar",
        temperamentNote: temperamentNote(fn, metrics, "karışık deneme"),
      },
    },
  };
}

function struggleTopicHint(text: string, subject: string): string | null {
  if (/devirli|ondalık/i.test(text)) return "ondalık gösterim";
  if (/rasyonel/i.test(text)) return "rasyonel sayılar";
  if (/denklem/i.test(text)) return "denklemler";
  if (/geometri|açı|üçgen/i.test(text)) return "geometri";
  if (/kronoloji|ezber|tarih/i.test(text)) return "kronoloji";
  if (/atatürk/i.test(text)) return "Atatürk";
  if (/milli mücadele|kurtuluş/i.test(text)) return "Milli Mücadele";
  const fromText = extractTopicsFromTranscript(
    {
      duration: 0,
      source: "deepgram",
      generatedAt: "",
      speakers: [],
      segments: [{ start: 0, end: 1, text, speaker: STUDENT, words: [] }],
      words: [],
    },
    subject
  )[0];
  return fromText ?? null;
}

function capitalizeTopic(t: string): string {
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function buildPhases(
  context: LessonContext,
  metrics: TranscriptMetrics,
  topics: string[]
): RoadmapPhase[] {
  const coreTopics = topics.filter((t) => !/lgs|deneme|tekrar|ünite planı|çalışma/i.test(t));
  const prioritized = [...coreTopics];

  if (metrics.struggleSeg) {
    const struggleTopic = struggleTopicHint(
      metrics.struggleSeg.text,
      context.subject
    );
    if (struggleTopic && !prioritized.includes(struggleTopic)) {
      prioritized.unshift(struggleTopic);
    }
  }

  const uniqueCore = [...new Set(prioritized.length > 0 ? prioritized : topics)].slice(0, 4);
  const firstCore = uniqueCore[0];
  const firstCoreId = firstCore ? `cp-${slugify(firstCore) || "topic-0"}` : undefined;

  const phase1Checkpoints: RoadmapCheckpoint[] = [
    foundationCheckpoint(context, metrics, topics, 1, firstCore, firstCoreId),
  ];

  let week = 3;
  const phase2Checkpoints = uniqueCore.map((topic, i) => {
    const nextTopic = uniqueCore[i + 1];
    const nextId = nextTopic ? `cp-${slugify(nextTopic) || `topic-${i + 1}`}` : "cp-exam";
    const cp = topicCheckpoint(
      topic,
      i,
      context,
      metrics,
      week,
      nextTopic,
      nextId
    );
    week += 3;
    return cp;
  });

  const phase3Checkpoints = [examCheckpoint(context, metrics, uniqueCore, week)];

  const subjectShort = context.subject.split(" ")[0];

  return [
    {
      id: "phase-1",
      label: "Faz 1",
      months: "Ay 1–2",
      goal: `${lessonTypeLabel(context.lessonType)} çıktıları, çalışma ritmi ve ${subjectShort} temeli`,
      checkpoints: phase1Checkpoints,
    },
    {
      id: "phase-2",
      label: "Faz 2",
      months: "Ay 2–4",
      goal: uniqueCore.length > 0
        ? `${uniqueCore.slice(0, 3).join(", ")} derinleştirme`
        : `${subjectShort} konu pekiştirme`,
      checkpoints: phase2Checkpoints.length > 0 ? phase2Checkpoints : [
        topicCheckpoint("konu pekiştirme", 0, context, metrics, week),
      ],
    },
    {
      id: "phase-3",
      label: "Faz 3",
      months: "Ay 4–6",
      goal: metrics.goalMentions > 0
        ? "LGS deneme ritmi ve net hedef takibi"
        : "Karışık tekrar ve performans ölçümü",
      checkpoints: phase3Checkpoints,
    },
  ];
}

export function buildLessonRoadmap(
  meta: LessonMeta,
  transcript: TranscriptData,
  context: LessonContext
): LessonRoadmap {
  const metrics = collectMetrics(transcript);
  const gaps = detectLessonGaps(transcript, {
    studentName: context.student.name,
    subject: context.subject,
    lessonType: context.lessonType,
  });
  const topics = resolveTopics(transcript, context.subject, context.lessonType);

  return {
    lessonId: meta.id,
    title: `${context.title} · Yol Haritası`,
    subject: context.subject,
    teacher: {
      name: context.teacher.name,
      avatar: context.teacher.avatar,
      title: context.teacher.title,
    },
    student: {
      name: context.student.name,
      avatar: context.student.avatar,
      grade: context.student.grade,
      learningStyle: context.student.learningStyle,
      temperamentSignals: buildTemperamentSignals(context, metrics, gaps),
    },
    introLessonInsights: buildIntroInsights(context, metrics, topics, meta),
    phases: buildPhases(context, metrics, topics),
    generatedFrom: `${lessonTypeLabel(context.lessonType)} — ${meta.id} transkripti`,
  };
}
