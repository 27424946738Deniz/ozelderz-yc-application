import type { TeacherProfileDetail, StudentTypeMatch } from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import { buildTeachingStyleAnalysis } from "@/lib/teaching-style-analysis";
import {
  isHistorySubject,
  isMathSubject,
  type ProfileBuildContext,
  teacherProfileId,
} from "@/lib/profile-build-context";
import { getStoredTeacherProfile } from "@/lib/profile-store";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function buildTeacherProfileFromTranscript(
  transcript: TranscriptData,
  context: ProfileBuildContext
): TeacherProfileDetail {
  const teacherSegs = transcript.segments.filter((s) => s.speaker === TEACHER);
  const studentSegs = transcript.segments.filter((s) => s.speaker === STUDENT);
  const teacherWords = transcript.words.filter((w) => w.speaker === TEACHER);
  const teacherMin =
    teacherSegs.reduce((sum, s) => sum + (s.end - s.start), 0) / 60 || 1;
  const wpm = Math.round(teacherWords.length / teacherMin);

  const teacherTalk = teacherSegs.reduce((s, seg) => s + (seg.end - seg.start), 0);
  const totalTalk = transcript.segments.reduce(
    (s, seg) => s + (seg.end - seg.start),
    0
  );
  const talkRatioPct = Math.round((teacherTalk / Math.max(totalTalk, 1)) * 100);

  const questions = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  );
  const teacherQuestions = questions.filter((s) => s.speaker === TEACHER);

  const gaps: number[] = [];
  for (let i = 0; i < transcript.segments.length - 1; i++) {
    const cur = transcript.segments[i];
    const next = transcript.segments[i + 1];
    if (cur.speaker === TEACHER && next.speaker === STUDENT) {
      gaps.push(Math.max(0, next.start - cur.end));
    }
  }
  const avgGap = gaps.length
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : 0;

  const checkIns = countPattern(
    transcript.segments,
    /anlaştık|tamam mı|anladın|net geliyor|uygun mudur|ne dersin/i
  );
  const planMentions = countPattern(
    transcript.segments,
    /whatsapp|haftalık plan|yol haritası|program|ders program/i
  );
  const lgsMentions = countPattern(
    transcript.segments,
    /\blgs\b|sınav|soru dağılım|sözel test|veri işleme/i
  );
  const visualMentions = countPattern(
    transcript.segments,
    /pdf|ekran|sunum|harita|tablo|şema|slayt|sayı doğrusu/i
  );
  const unitMentions = countPattern(
    transcript.segments,
    /ünite|birinci ünite|ikinci ünite|7 ünite/i
  );
  const mathTopicMentions = countPattern(
    transcript.segments,
    /rasyonel|ondalık|denklem|devirli|veri işleme|daire grafiği/i
  );
  const demoMentions = countPattern(transcript.segments, /demo ders/i);
  const rapportMentions = countPattern(
    transcript.segments,
    /spor|voleybol|takım|tanış|hedef|motiv|memnun oldum|nasılsın/i
  );
  const empathyMentions = countPattern(
    transcript.segments,
    /sıkıntı değil|anlıyorum|haklısın|sorun değil|tebrik|aferin|çok güzel/i
  );
  const studentLongTurns = studentSegs.filter((s) => s.text.length > 80).length;

  const name = context.teacherName;
  const firstName = name.split(" ")[0];
  const studentFirst = context.studentName.split(" ")[0];

  const stored = getStoredTeacherProfile(context.lessonId);

  const teachingStyleAnalysis = buildTeachingStyleAnalysis(
    teacherSegs,
    firstName,
    {
      talkRatioPct,
      wpm,
      checkIns,
      planMentions,
      lgsMentions,
      visualMentions,
      unitMentions,
      rapportMentions,
      empathyMentions,
      teacherQuestions: teacherQuestions.length,
      avgGap,
      studentLongTurns,
      excelsWith: stored?.excelsWith,
      lessSuitedFor: stored?.lessSuitedFor,
      matchingGuide: stored?.matchingGuide,
      overview: stored?.overview,
    }
  );

  const tags: string[] = [context.subject.split(" ")[0]];
  if (planMentions >= 3) tags.push("Planlı");
  if (lgsMentions >= 2) tags.push("LGS Uzmanı");
  if (isMathSubject(context.subject)) tags.push("Matematik");
  if (demoMentions >= 1) tags.push("Demo Ders");
  if (visualMentions >= 4) tags.push("Uygulamalı Anlatım");
  if (rapportMentions >= 3) tags.push("İlişki Kurucu");
  if (checkIns >= 15) tags.push("Geri Bildirim Güçlü");
  if (talkRatioPct > 75) tags.push("Anlatım Ağırlıklı");

  const strengths: string[] = [];

  if (isMathSubject(context.subject) && mathTopicMentions >= 5) {
    strengths.push(
      `Matematik demo akışı güçlü — rasyonel, ondalık ve denklemler transkriptte ${mathTopicMentions} kez somut örnekle işlendi`
    );
  }
  if (demoMentions >= 1) {
    strengths.push(
      "Demo ders formatında öğrenci seviyesini konuşarak tespit ediyor — takılma noktasından başlama stratejisi etkili"
    );
  }
  if (planMentions >= 2) {
    strengths.push(
      `Ders planı net — program ve iletişim vurgusu (${planMentions} kez)`
    );
  }
  if (lgsMentions >= 2) {
    strengths.push(
      isMathSubject(context.subject)
        ? "LGS matematik çerçevesi kuruyor — veri işleme ve soru tiplerini derse bağlıyor"
        : "LGS çerçevesi güçlü: soru dağılımı ve sınav yapısı net anlatılıyor"
    );
  }
  if (isHistorySubject(context.subject) && unitMentions >= 5) {
    strengths.push(
      "Üniteleri tek tek tanıtarak müfredatı somutlaştırıyor — öğrenci yol haritasını görüyor"
    );
  }
  if (checkIns >= 15) {
    strengths.push(
      `Anlık geri bildirim güçlü — ${checkIns} kez "Tamam mı?", "Ne dersin?" kontrolü`
    );
  }
  if (visualMentions >= 4) {
    strengths.push(
      "Sayı doğrusu, ekran ve görsel materyal kullanımı — uygulamalı matematik profiline uygun"
    );
  }
  if (rapportMentions >= 2) {
    strengths.push(
      "Tanışma ve ilişki kurma başarılı — öğrenci kendini rahat ifade edebiliyor"
    );
  }
  if (empathyMentions >= 1) {
    strengths.push(
      "Destekleyici dil — olumlu geri bildirim ve sabırlı yönlendirme"
    );
  }
  if (strengths.length === 0) {
    strengths.push("Transkriptte yapılandırılmış ve öğrenci odaklı bir anlatım tespit edildi");
  }

  const developmentAreas: string[] = [];
  if (talkRatioPct > 70) {
    developmentAreas.push(
      `Konuşma oranı %${talkRatioPct} — öğrenciyi daha fazla konuşturma alanı açılmalı`
    );
  }
  if (studentLongTurns < 5) {
    developmentAreas.push(
      "Derinleştirici takip soruları artırılmalı — öğrenci çoğunlukla kısa onay veriyor"
    );
  }
  if (wpm < 145) {
    developmentAreas.push(
      `Anlatım hızı ${wpm} kel/dk — önerilen aralığın altında, tempo artırılabilir`
    );
  }
  if (countPattern(transcript.segments, /espir|gül|şaka|komik/i) === 0) {
    developmentAreas.push(
      "Hafif mizah kullanımı artırılabilir — demo/tanışma derslerinde bağ kurmayı güçlendirir"
    );
  }

  const studentTypeMatches: StudentTypeMatch[] = [
    isMathSubject(context.subject)
      ? {
          studentType: "LGS matematik hazırlığı yapan, seviye tespiti isteyen öğrenci",
          matchScore: clamp(
            72 + lgsMentions * 5 + mathTopicMentions * 2 + demoMentions * 8,
            75,
            95
          ),
          reason:
            "Demo ders formatında seviye tespiti, rasyonel/ondalık konularını somut örnekle işleme becerisi",
          traits: ["LGS hedefi", "Matematik demo", "Seviye analizi"],
        }
      : {
          studentType: "LGS odaklı, plan arayan öğrenci",
          matchScore: clamp(
            70 + lgsMentions * 5 + planMentions * 4 - (talkRatioPct > 80 ? 5 : 0),
            75,
            95
          ),
          reason:
            "Haftalık program, soru dağılımı ve net hedef konuşmaları bu profilin ihtiyacı",
          traits: ["LGS hedefi net", "Plan isteyen", "Yapı arayan"],
        },
    isMathSubject(context.subject)
      ? {
          studentType: "Rasyonel/ondalıkta takılan, somut örnek isteyen öğrenci",
          matchScore: clamp(
            68 + visualMentions * 3 + checkIns * 0.8 + demoMentions * 6,
            70,
            92
          ),
          reason:
            "Devirli ondalık gibi spesifik zorluklarda adım adım çözüm ve sayı doğrusu kullanımı",
          traits: ["Devirli ondalık", "Görsel örnek", "Adım adım"],
        }
      : {
          studentType: "Sorgulayıcı-görsel öğrenen",
          matchScore: clamp(65 + visualMentions * 2 + checkIns * 0.5, 70, 92),
          reason:
            "PDF, MEB kaynağı ve materyal planı sunma becerisi; pratik sorulara somut yanıt",
          traits: ["Kaynak soran", "PDF/MEB meraklı", "Somut görev isteyen"],
        },
    {
      studentType: "Yeni başlayan / demo ders alan öğrenci",
      matchScore: clamp(
        68 + rapportMentions * 4 + empathyMentions * 8 + demoMentions * 5,
        72,
        90
      ),
      reason:
        "Tanışma/demo derslerinde kişisel ilgi, seviye tespiti ve destekleyici dil ile güven inşa ediyor",
      traits: ["İlk ders", "Demo", "Güven arayan"],
    },
    {
      studentType: "Düşük katılımlı dinleyici",
      matchScore: clamp(
        60 + checkIns * 1.2 + structureScore(planMentions, unitMentions),
        65,
        85
      ),
      reason:
        "Sık kontrol ve net yapı, pasif dinleme eğilimindeki öğrenciyi takip etmeyi kolaylaştırır",
      traits: ["Kısa yanıt veren", "Planla ilerleyen", "Sessiz ama uyumlu"],
      caution: "Uzun vadede katılım artırılmazsa motivasyon düşebilir",
    },
    {
      studentType: "Tartışmacı, yüksek katılımlı öğrenci",
      matchScore: clamp(
        35 + (100 - talkRatioPct) * 0.3 + studentLongTurns * 2,
        25,
        45
      ),
      reason:
        "Monolog ağırlıklı akış — öğrencinin fikir üretmesi için yeterli alan açılmıyor",
      traits: ["Çok konuşan", "Tartışmayı seven", "Derinlemesine meraklı"],
      caution: "Daha interaktif profilli hoca önerilir",
    },
  ].sort((a, b) => b.matchScore - a.matchScore);

  const coordinatorTips: string[] = [
    isMathSubject(context.subject)
      ? `${firstName}'nın güçlü yönü demo ders + somut matematik örneği + LGS çerçevesi — bu üç ihtiyacı olan öğrenciyi öncelikle yönlendirin`
      : `${firstName}'nın güçlü yönü yapı + LGS + materyal — bu ihtiyaçları olan öğrenciyi öncelikle yönlendirin`,
    isMathSubject(context.subject)
      ? "Matematik demo ve seviye tespiti dersleri için ideal profil; uzun vadeli ileri düzey olimpiyat profillerinde alternatif değerlendirin"
      : "İlk tanışma ve program kurma dersleri için ideal profil; uzun vadeli derin tartışma gerektiren öğrencilerde alternatif değerlendirin",
    `Konuşma oranı %${talkRatioPct} — katılımı düşük öğrencilerde eşleştirmeden önce hocanın gelişim planına bakın`,
    `${studentFirst} profili (${context.lessonTitle} transkripti) bu hocayla eşleşme sinyali veriyor — demo/konu akışı profille uyumlu`,
  ];

  if (talkRatioPct > 75) {
    coordinatorTips.push(
      "Yüksek katılım isteyen öğrencileri atarken haftalık koçluk geri bildirimi verin — öğrenciyi konuşturma hedefi konulsun"
    );
  }

  const notableQuotes = teacherSegs
    .filter((s) => s.text.length > 40)
    .slice(0, 6)
    .map((s) => ({
      text: s.text.trim(),
      time: formatTime(s.start),
    }));

  let teachingScore = 6.5;
  if (planMentions >= 3) teachingScore += 0.6;
  if (lgsMentions >= 2) teachingScore += 0.5;
  if (isHistorySubject(context.subject) && unitMentions >= 5) teachingScore += 0.5;
  if (isMathSubject(context.subject) && mathTopicMentions >= 8) teachingScore += 0.6;
  if (demoMentions >= 1) teachingScore += 0.3;
  if (checkIns >= 20) teachingScore += 0.7;
  if (visualMentions >= 5) teachingScore += 0.4;
  if (rapportMentions >= 3) teachingScore += 0.4;
  if (talkRatioPct > 80) teachingScore -= 1.5;
  else if (talkRatioPct > 70) teachingScore -= 1.0;
  if (studentLongTurns < 5) teachingScore -= 0.5;
  teachingScore = Math.round(clamp(teachingScore, 4, 9.5) * 10) / 10;

  const teachingStyle = `${teachingStyleAnalysis.primaryStyle} + ${teachingStyleAnalysis.secondaryStyle}`;

  return {
    id: teacherProfileId(context),
    lessonId: context.lessonId,
    name,
    title: context.teacherTitle,
    subject: context.subject,
    avatar: context.teacherAvatar,
    tags: stored?.tags?.length ? stored.tags : [...new Set(tags)],
    teachingScore,
    teachingStyle,
    teachingStyleDescription: teachingStyleAnalysis.overview,
    teachingStyleAnalysis,
    strengths: stored?.strengths?.length ? stored.strengths : strengths.slice(0, 6),
    developmentAreas: stored?.developmentAreas?.length
      ? stored.developmentAreas
      : developmentAreas.slice(0, 4),
    studentTypeMatches: stored?.studentTypeMatches?.length
      ? stored.studentTypeMatches
      : studentTypeMatches,
    coordinatorTips: stored?.coordinatorTips?.length
      ? stored.coordinatorTips
      : coordinatorTips,
    notableQuotes: stored?.notableQuotes?.length
      ? stored.notableQuotes
      : notableQuotes,
    teachingMetrics: {
      talkRatioPct,
      questionCount: teacherQuestions.length,
      wpm,
      checkInCount: checkIns,
      avgWaitSec: Math.round(avgGap * 100) / 100,
      turnCount: teacherSegs.length,
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

function structureScore(plan: number, units: number) {
  return plan * 3 + units * 2;
}
