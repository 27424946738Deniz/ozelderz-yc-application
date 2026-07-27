import type { StudentProfileDetail } from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import { buildLearningStyleAnalysis } from "@/lib/learning-style-analysis";
import { detectLessonGaps } from "@/lib/lesson-gaps";
import { getStoredApproachGuide, getStoredUnderstandingInsights } from "@/lib/learning-guide-store";
import { generateTeachingTactics } from "@/lib/teaching-tactics-generator";
import {
  isHistorySubject,
  isMathSubject,
  type ProfileBuildContext,
} from "@/lib/profile-build-context";
import { studentProfileId } from "@/lib/profile-build-context";
import { getStoredStudentProfile } from "@/lib/profile-store";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

function findSegments(segments: TranscriptSegment[], re: RegExp): TranscriptSegment[] {
  return segments.filter((s) => re.test(s.text));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractSchool(segments: TranscriptSegment[]): string | null {
  const hit = segments.find((s) => /okuyorum|ortaokul|lisesi/i.test(s.text));
  if (!hit) return null;
  const match = hit.text.match(
    /([A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ\s']+(?:Ortaokulu|Lisesi|Okulu))/
  );
  return match?.[1] ?? hit.text.slice(0, 60);
}

function extractGoals(
  segments: TranscriptSegment[],
  subject: string
): string[] {
  const goals: string[] = [];
  if (segments.some((s) => /fen lisesi/i.test(s.text))) goals.push("Fen lisesi hedefi");
  if (segments.some((s) => /galatasaray lisesi/i.test(s.text)))
    goals.push("Galatasaray Lisesi ilgisi");
  if (segments.some((s) => /lgs|deneme/i.test(s.text))) goals.push("LGS hazırlığı");
  if (segments.some((s) => /deneme kulübü/i.test(s.text)))
    goals.push("Deneme kulübüne katılım planı");
  if (isMathSubject(subject)) {
    if (segments.some((s) => /rasyonel|ondalık|devirli/i.test(s.text)))
      goals.push("Rasyonel sayılar ve ondalık gösterimde güçlenme");
    if (segments.some((s) => /denklem/i.test(s.text)))
      goals.push("Denklemlerde seviyeyi koruma ve pekiştirme");
    if (segments.some((s) => /veri işleme|daire grafiği/i.test(s.text)))
      goals.push("LGS veri işleme sorularına hazırlık");
  }
  if (isHistorySubject(subject)) {
    goals.push("İnkılap Tarihi müfredatını tamamlama");
  }
  return goals;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildStudentProfileFromTranscript(
  transcript: TranscriptData,
  context: ProfileBuildContext
): StudentProfileDetail {
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const studentWords = studentSegs.flatMap((s) => s.words);
  const studentQuestions = studentSegs.filter((s) =>
    isQuestion(s.text, s.speaker)
  );
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
  const avgUtteranceLen =
    studentSegs.length > 0
      ? Math.round(
          studentSegs.reduce((a, s) => a + s.text.length, 0) / studentSegs.length
        )
      : 0;

  const sportHits = findSegments(studentSegs, /voleybol|spor|takım|telekom/i);
  const lgsHits = findSegments(studentSegs, /lgs|deneme|sınav|net|hedef/i);
  const resourceHits = findSegments(
    studentSegs,
    /kaynak|pdf|kitap|meb|müfredat|çıkmış soru/i
  );
  const mathHits = findSegments(
    studentSegs,
    /rasyonel|denklem|ondalık|matematik|veri işleme|daire grafiği/i
  );
  const mathStruggleHits = findSegments(
    studentSegs,
    /takıl|zor|karış|devirli|sıkıntı/i
  );
  const historyAffinity = countPattern(
    studentSegs,
    /tarih|inkılap|atatürk|seviyorum/i
  );
  const techHits = findSegments(studentSegs, /ekran|ses|kamera|internet|pdf|meet/i);
  const initiated = findSegments(studentSegs, /sorabilir miyim|bir şey diy|peki hocam|bence|takıl/i);
  const shortAnswers = studentSegs.filter((s) => s.text.length < 15).length;
  const longAnswers = studentSegs.filter((s) => s.text.length > 50).length;

  const school = extractSchool(studentSegs);
  const goals = extractGoals(transcript.segments, context.subject);
  const name = context.studentName;
  const firstName = name.split(" ")[0];

  const tags: string[] = [context.studentGrade];
  if (isMathSubject(context.subject)) tags.push("Matematik");
  if (isHistorySubject(context.subject) && historyAffinity > 0) tags.push("Tarih Meraklısı");
  if (lgsHits.length >= 1) tags.push("LGS Odaklı");
  if (sportHits.length >= 2) tags.push("Sporcu");
  if (resourceHits.length >= 2) tags.push("Kaynak Araştırmacı");
  if (mathStruggleHits.length >= 1) tags.push("Rasyonel Sayılar");
  if (studentQuestions.length >= 15) tags.push("Sorgulayıcı");
  else if (studentQuestions.length >= 8) tags.push("Seçici Soru Soran");

  const strengths: string[] = [];

  if (isMathSubject(context.subject)) {
    if (countPattern(studentSegs, /denklem.*iyi|denklemim de iyi/i) > 0) {
      strengths.push(
        "Denklemlerde kendine güveniyor — \"denklemim de iyi\" ifadesi güçlü bir temel gösteriyor"
      );
    }
    if (mathStruggleHits.length >= 1) {
      strengths.push(
        "Takıldığı konuyu açıkça paylaşıyor (devirli ondalıklar) — seviye tespiti için ideal iletişim"
      );
    }
    if (mathHits.length >= 3) {
      strengths.push(
        "Rasyonel sayılar, ondalık gösterim ve LGS veri işleme konularına aktif yanıt veriyor"
      );
    }
  }

  if (isHistorySubject(context.subject) && historyAffinity > 0) {
    strengths.push(
      "İnkılap Tarihi'ne karşı pozitif tutum — ders motivasyonu için güçlü bir temel"
    );
  }
  if (studentQuestions.length >= 10) {
    strengths.push(
      `Derste ${studentQuestions.length} soru sordu — merakını somut sorularla ortaya koyuyor`
    );
  }
  if (resourceHits.length >= 2) {
    strengths.push(
      "MEB kaynakları ve çıkmış sorulara proaktif ilgi — kendi öğrenme materyalini takip ediyor"
    );
  }
  if (goals.length >= 2) {
    strengths.push(
      `Net hedefleri var: ${goals.slice(0, 2).join(", ")} — planlı çalışmaya yatkın`
    );
  }
  if (sportHits.length >= 2) {
    strengths.push(
      "Spor/takım deneyimi — disiplin ve takım çalışması okul motivasyonuna taşınabilir"
    );
  }
  if (initiated.length >= 2) {
    strengths.push(
      "İnisiyatifli girişler yapıyor — güven ortamında daha açık konuşuyor"
    );
  }
  if (strengths.length === 0) {
    strengths.push("Derse katılım gösterdi ve öğretmenin yönlendirmelerine yanıt verdi");
  }

  const challenges: string[] = [];
  if (participationPct < 25) {
    challenges.push(
      `Konuşma süresinin %${participationPct}'i — çoğunlukla kısa onaylarla (%${Math.round((shortAnswers / Math.max(studentSegs.length, 1)) * 100)} kısa yanıt) geçiyor`
    );
  }
  if (longAnswers < 5) {
    challenges.push(
      "Uzun açıklama veya kendi çözüm yolunu anlatma nadiren — düşünme sürecini sesli ifade pratiği geliştirilmeli"
    );
  }
  if (isMathSubject(context.subject) && mathStruggleHits.length >= 1) {
    challenges.push(
      "Devirli ondalık gösterimlerde takılma — rasyonel sayılara dönüşüm adımlarında ek destek gerekiyor"
    );
  }
  if (lgsHits.some((s) => /düşük|zor/i.test(s.text))) {
    challenges.push(
      "Sınav performansı konusunda endişe belirtti — özgüven ve sınav stratejisi desteği gerekebilir"
    );
  }
  if (countPattern(studentSegs, /pandemi|kapandık/i) > 0) {
    challenges.push(
      "Pandemi döneminde evde kalma deneyiminden bahsetti — uzun bireysel çalışma alışkanlığı olabilir"
    );
  }
  if (challenges.length < 2) {
    challenges.push(
      isMathSubject(context.subject)
        ? "Uzun anlatım bloklarında sayısal kavramlar karışabilir — sık mini uygulama ve soru gerekir"
        : "Uzun teorik anlatım bloklarında dikkat dağılabilir — interaktif materyalle desteklenmeli"
    );
  }

  const motivationTriggers: string[] = [];
  if (sportHits.length) {
    motivationTriggers.push("Spor ve takım deneyiminden örneklerle konuya bağlanma");
  }
  if (lgsHits.length) {
    motivationTriggers.push(
      isMathSubject(context.subject)
        ? "LGS matematik soru tipleri ve veri işleme örnekleri konuşulduğunda ilgi artıyor"
        : "LGS soru dağılımı ve sınav stratejisi konuşulduğunda ilgi artıyor"
    );
  }
  if (isMathSubject(context.subject) && mathHits.length) {
    motivationTriggers.push(
      "Somut sayı örneği ve adım adım çözüm gösterildiğinde daha aktif katılıyor"
    );
  }
  if (resourceHits.length) {
    motivationTriggers.push(
      "Somut kaynak önerisi (PDF, MEB testi, çıkmış soru) verildiğinde aktifleşiyor"
    );
  }
  motivationTriggers.push(
    "Kişisel hedef ve seviye soruları — gelecek planı ve güçlü/zayıf yönlerini konuşmak motive ediyor"
  );

  const teachingTips: string[] = [
    `Her 5–8 dakikada bir doğrudan ${firstName}'ya soru yöneltin — pasif dinleme eğilimini kırar`,
  ];

  if (isMathSubject(context.subject)) {
    teachingTips.push(
      "Sayı doğrusu, ondalık-rasyonel dönüşüm gibi görsel araçlar kullanın — devirli ondalık zorluğu için kritik",
      "Takıldığı noktayı sorarak derse girin — transkriptte en verimli akış bu şekilde başladı",
      "Ödevleri net ve ölçülebilir verin: \"5 devirli ondalık sorusu\", \"10 rasyonel toplama\" gibi"
    );
  } else {
    teachingTips.push(
      "Görsel materyal (harita, tablo, PDF) kullanın — profil görsel-pratik odaklı",
      "Ödevleri net ve ölçülebilir verin: \"10 MEB sorusu\", \"1 PDF bölümü\" gibi",
      "Tanışma ve kişisel ilgi (spor, okul hedefleri) ile derse girin"
    );
  }

  if (isHistorySubject(context.subject) && historyAffinity > 0) {
    teachingTips.push(
      "Tarih sevgisini kullanın — kronoloji ezberi yerine olay hikâyeleştirme ve neden-sonuç ilişkisi kurun"
    );
  }

  const notableQuotes = studentSegs
    .filter((s) => s.text.length > 30)
    .slice(0, 6)
    .map((s) => ({
      text: s.text.trim(),
      time: formatTime(s.start),
    }));

  const interestAreas = [
    isMathSubject(context.subject) && mathHits.length
      ? {
          label: "Matematik",
          detail: "Rasyonel sayılar, denklemler, ondalık gösterim",
          level: "high" as const,
        }
      : null,
    isMathSubject(context.subject) && mathStruggleHits.length
      ? {
          label: "Devirli Ondalıklar",
          detail: "Takıldığı noktayı açıkça belirtti",
          level: "medium" as const,
        }
      : null,
    sportHits.length
      ? { label: "Spor", detail: "Voleybol / takım deneyimi", level: "high" as const }
      : null,
    isHistorySubject(context.subject) && historyAffinity
      ? { label: "İnkılap Tarihi", detail: "Derse olumlu tutum", level: "high" as const }
      : null,
    lgsHits.length
      ? { label: "LGS / Sınav", detail: "Sınav hazırlığı ve hedefler", level: "medium" as const }
      : null,
    resourceHits.length
      ? { label: "Kaynak & Materyal", detail: "MEB, PDF, çıkmış sorular", level: "medium" as const }
      : null,
  ].filter(Boolean) as StudentProfileDetail["interestAreas"];

  const engagementScore = Math.round(
    clamp(
      50 +
        studentQuestions.length * 1.5 +
        longAnswers * 3 +
        participationPct * 0.5 +
        initiated.length * 4 -
        shortAnswers * 0.15,
      45,
      92
    )
  );

  const gaps = detectLessonGaps(transcript, {
    studentName: name,
    subject: context.subject,
    lessonType: context.lessonType,
  });
  const approachGuide =
    getStoredApproachGuide(context.lessonId) ??
    generateTeachingTactics(gaps, name, context.subject);
  const understandingInsights = getStoredUnderstandingInsights(context.lessonId);

  const learningStyleAnalysis = buildLearningStyleAnalysis(studentSegs, firstName, {
    studentQuestions: studentQuestions.length,
    longAnswers,
    shortAnswers,
    participationPct,
    avgUtteranceLen,
    sportHits,
    lgsHits,
    resourceHits,
    historyAffinity,
    initiated,
    techHits,
    subject: context.subject,
    meetCode: context.lessonId,
    approachGuide,
    understandsBetter: understandingInsights?.understandsBetter,
    understandsLess: understandingInsights?.understandsLess,
  });

  const learningStyle = `${learningStyleAnalysis.primaryStyle} + ${learningStyleAnalysis.secondaryStyle}`;

  const defaultGoals = isMathSubject(context.subject)
    ? ["LGS matematik hazırlığı", "Rasyonel sayılarda güçlenme"]
    : ["LGS hazırlığı", `${context.subject} başarısını artırma`];

  const stored = getStoredStudentProfile(context.lessonId);

  return {
    id: studentProfileId(context),
    lessonId: context.lessonId,
    name,
    grade: context.studentGrade,
    avatar: context.studentAvatar,
    school:
      stored?.school ??
      school ??
      (isMathSubject(context.subject) ? "Ortaokul" : "Torunoglu Ortaokulu"),
    learningStyle,
    learningStyleDescription: learningStyleAnalysis.overview,
    learningStyleAnalysis,
    tags: stored?.tags?.length ? stored.tags : [...new Set(tags)],
    strengths: stored?.strengths?.length ? stored.strengths : strengths.slice(0, 5),
    challenges: stored?.challenges?.length ? stored.challenges : challenges.slice(0, 4),
    comprehensionScore: engagementScore,
    interestAreas: stored?.interestAreas?.length
      ? stored.interestAreas
      : interestAreas,
    goals: stored?.goals?.length ? stored.goals : goals.length ? goals : defaultGoals,
    motivationTriggers: stored?.motivationTriggers?.length
      ? stored.motivationTriggers
      : motivationTriggers,
    teachingTips: stored?.teachingTips?.length ? stored.teachingTips : teachingTips,
    notableQuotes: stored?.notableQuotes?.length
      ? stored.notableQuotes
      : notableQuotes,
    engagementMetrics: {
      turnCount: studentSegs.length,
      questionCount: studentQuestions.length,
      wordCount: studentWords.length,
      participationPct,
      avgUtteranceLength: avgUtteranceLen,
      longResponses: longAnswers,
      lessonCount: 1,
      lastLessonDate: transcript.generatedAt?.slice(0, 10) ?? "2026-07-24",
    },
    lessonsSummary: {
      totalMinutes: Math.round(transcript.duration / 60),
      subjects: [context.subject],
      lastLessonTitle: context.lessonTitle,
    },
  };
}
