import type { LessonEvaluation, StudentProfile } from "@/types";
import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import {
  extractTopicsFromTranscript,
  isHistorySubject,
  isMathSubject,
  type LessonContext,
} from "@/lib/lesson-context";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

function findSample(
  segments: TranscriptSegment[],
  re: RegExp,
  maxLen = 90
): string | null {
  const hit = segments.find((s) => re.test(s.text));
  if (!hit) return null;
  const t = hit.text.trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(score: number): string {
  if (score >= 9) return "Mükemmel";
  if (score >= 8) return "Çok iyi";
  if (score >= 7) return "İyi";
  if (score >= 6) return "Orta";
  if (score >= 5) return "Gelişime açık";
  return "Destek gerekli";
}

function homeworkIntensity(score: number, studentTurns: number): "Hafif" | "Orta" | "Yoğun" {
  if (score >= 8 && studentTurns >= 80) return "Orta";
  if (score < 6 || studentTurns < 60) return "Hafif";
  return "Orta";
}

export function evaluateLesson(
  transcript: TranscriptData,
  student: StudentProfile,
  context?: Pick<LessonContext, "subject" | "lessonType" | "title">
): LessonEvaluation {
  const subject = context?.subject ?? "Ders";
  const lessonType = context?.lessonType ?? "ders";
  const topics = extractTopicsFromTranscript(transcript, subject);

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
  const talkRatio = Math.round((teacherTalk / Math.max(totalTalk, 1)) * 100);

  const questions = transcript.segments.filter((s) =>
    isQuestion(s.text, s.speaker)
  );
  const studentQuestions = questions.filter((s) => s.speaker === STUDENT);

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
    /\blgs\b|sınav|soru dağılım|sözel test/i
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
  const homeworkMentions = countPattern(
    transcript.segments,
    /ödev|test|deneme|kaynak|çöz|müfredat|alıştırma/i
  );
  const rapportMentions = countPattern(
    transcript.segments,
    /spor|voleybol|takım|tanış|hedef|motiv|memnun oldum/i
  );
  const empathyMentions = countPattern(
    transcript.segments,
    /sıkıntı değil|anlıyorum|haklısın|sorun değil|tebrik|aferin|çok güzel/i
  );
  const studentLongTurns = studentSegs.filter((s) => s.text.length > 80).length;
  const studentInitiated = countPattern(
    studentSegs,
    /sorabilir miyim|bir şey diy|peki|hocam|bence|takıl/i
  );
  const demoMentions = countPattern(transcript.segments, /demo ders/i);

  let score = 6.5;
  if (planMentions >= 3) score += 0.6;
  if (lgsMentions >= 2) score += 0.5;
  if (isHistorySubject(subject) && unitMentions >= 5) score += 0.5;
  if (isMathSubject(subject) && mathTopicMentions >= 8) score += 0.6;
  if (checkIns >= 20) score += 0.7;
  if (visualMentions >= 5) score += 0.4;
  if (avgGap >= 1 && avgGap <= 2) score += 0.3;
  if (rapportMentions >= 3) score += 0.4;
  if (empathyMentions >= 2) score += 0.2;
  if (demoMentions >= 1 && studentLongTurns >= 3) score += 0.3;

  if (talkRatio > 80) score -= 1.5;
  else if (talkRatio > 70) score -= 1.0;
  else if (talkRatio > 65) score -= 0.5;

  if (studentSegs.length < 80) score -= 0.4;
  if (studentLongTurns < 3) score -= 0.5;
  if (studentQuestions.length < 10) score -= 0.3;
  if (wpm < 145) score -= 0.2;
  if (wpm > 175) score -= 0.2;

  score = Math.round(clamp(score, 4, 9.5) * 10) / 10;

  const durationMin = Math.round(transcript.duration / 60);
  const studentFirstName = student.name.split(" ")[0];
  const strengths: string[] = [];

  if (isMathSubject(subject) && mathTopicMentions >= 5) {
    const sample = findSample(transcript.segments, /rasyonel|ondalık|denklem/i);
    strengths.push(
      sample
        ? `Matematik demo akışı somut ilerledi — transkriptte "${sample}" gibi bölümlerde konu örnekle anlatıldı.`
        : `Matematik konuları (rasyonel, denklem, ondalık) transkriptte ${mathTopicMentions} kez işlendi; demo ders yapısına uygun.`
    );
  }

  if (demoMentions >= 1) {
    strengths.push(
      `Demo ders formatı net — öğrencinin seviyesi konuşularak tespit edildi, takılınan noktadan (devirli ondalık vb.) başlanması planlandı.`
    );
  }

  if (planMentions >= 2) {
    strengths.push(
      `Ders planı ve iletişim net konuşuldu (${planMentions} kez plan/program vurgusu).`
    );
  }

  if (lgsMentions >= 2) {
    strengths.push(
      isMathSubject(subject)
        ? `LGS matematik çerçevesi kuruldu — veri işleme, soru tipleri ve sınav yapısı derse bağlandı.`
        : `LGS odaklı çerçeve iyi kuruldu: soru dağılımı ve sınav yapısı anlatıldı.`
    );
  }

  if (isHistorySubject(subject) && unitMentions >= 5) {
    strengths.push(
      `Üniteler tek tek tanıtılarak müfredat somutlaştırıldı; öğrenci dersin nereye gideceğini gördü.`
    );
  }

  if (checkIns >= 15) {
    strengths.push(
      `Anlık geri bildirim güçlü — "Tamam mı?", "Ne dersin?" gibi ${checkIns} kontrol anı kullanıldı.`
    );
  }

  if (visualMentions >= 4) {
    strengths.push(
      `Görsel/uygulamalı anlatım (ekran, sayı doğrusu, tablo) derse yedirildi — ${visualMentions} materyal referansı.`
    );
  }

  if (rapportMentions >= 2) {
    const sample = findSample(transcript.segments, /memnun oldum|iyi misin|nasılsın/i);
    strengths.push(
      sample
        ? `İlişki kurma başarılı — tanışma/sohbet öğrenciyi derse hazırladı ("${sample}").`
        : `Tanışma ve motivasyon konuşmalarıyla güven ortamı oluşturuldu.`
    );
  }

  if (avgGap >= 0.8 && avgGap <= 2) {
    strengths.push(
      `Öğrenciye düşünme süresi tanındı — soru sonrası ortalama ${avgGap.toFixed(1)} sn bekleme.`
    );
  }

  if (empathyMentions >= 1) {
    strengths.push(
      `Destekleyici dil kullanıldı — olumlu geri bildirim ve sabırlı yönlendirme tespit edildi.`
    );
  }

  const weaknesses: string[] = [];

  if (talkRatio > 70) {
    weaknesses.push(
      `Konuşma süresinin %${talkRatio}'i öğretmende — ${studentFirstName} ${studentSegs.length} tur aldı. Demo/konu derslerinde bile öğrenciyi daha fazla konuşturmak gerekir.`
    );
  }

  if (studentLongTurns < 3) {
    weaknesses.push(
      `${studentFirstName}'nın uzun açıklamaları az (${studentLongTurns} adet) — çoğunlukla kısa onaylarla geçildi; "neden?", "nasıl düşündün?" takipleri artırılmalı.`
    );
  }

  if (studentQuestions.length < 8) {
    weaknesses.push(
      `Öğrencinin kendi inisiyatifiyle sorduğu soru sayısı düşük (${studentQuestions.length}) — ${questions.length} sorunun çoğu öğretmenden geldi.`
    );
  }

  if (wpm < 145) {
    weaknesses.push(
      `Anlatım hızı ${wpm} kel/dk — önerilen 150–170 aralığının altında; ${durationMin} dk'lık derste tempo düşük kaldı.`
    );
  }

  if (isMathSubject(subject)) {
    const struggleSample = findSample(studentSegs, /takıl|zor|karış|devirli/i);
    if (struggleSample) {
      weaknesses.push(
        `${studentFirstName} zorlandığı noktayı açıkça belirtti ("${struggleSample}") — bir sonraki derste bu boşluk öncelikli kapatılmalı.`
      );
    }
  }

  if (homeworkMentions > 20 && studentQuestions.length < 8) {
    weaknesses.push(
      `Alıştırma/test referansı yoğun (${homeworkMentions}) ama öğrencinin anlayıp anlamadığına dair teyit az — uygulama-katılım dengesi kurulmalı.`
    );
  }

  const studentProfileInsights: string[] = [];

  studentProfileInsights.push(
    `${studentFirstName} "${student.learningStyle}" profiline sahip — transkriptte ${studentQuestions.length} soru ve ${studentLongTurns} uzun yanıt var; ${isMathSubject(subject) ? "somut örnek ve adım adım çözüm" : "somut materyal ve soru"} sunumu bu profile uygun.`
  );

  for (const challenge of student.challenges.slice(0, 2)) {
    studentProfileInsights.push(
      `Profildeki "${challenge}" zorluğu transkriptle örtüşüyor — bir sonraki derste bu noktaya özel mini tekrar ve soru seti planlayın.`
    );
  }

  if (student.tags.some((t) => /lgs/i.test(t))) {
    studentProfileInsights.push(
      `LGS odaklı profil — ${isMathSubject(subject) ? "veri işleme ve rasyonel sayılar gibi LGS konularına ilgi gösterdiğinde katılım artıyor." : "sınav yapısı ve soru dağılımı anlatımına olumlu yanıt veriyor."}`
    );
  }

  if (studentInitiated >= 3) {
    studentProfileInsights.push(
      `"Hocam…" / "bence…" ile başlayan ${studentInitiated} öğrenci inisiyatifi tespit edildi — bu anları genişleterek öğrenmeyi derinleştirin.`
    );
  }

  const intensity = homeworkIntensity(score, studentSegs.length);
  const topicHint =
    topics.length > 0 ? topics.slice(0, 3).join(", ") : subject;

  const nextLessonRecommendations: string[] = [];

  if (isMathSubject(subject)) {
    const nextTopic = topics.includes("ondalık gösterim")
      ? "devirli ondalık → rasyonel dönüşüm"
      : topics[0] ?? "rasyonel sayılar";
    nextLessonRecommendations.push(
      `Demo dersin devamında "${nextTopic}" konusunu pekiştirin — ${studentFirstName}'nın belirttiği takılma noktasından başlayın.`
    );
  } else if (isHistorySubject(subject) && unitMentions >= 3) {
    nextLessonRecommendations.push(
      `Transkriptte geçen ünite planına göre somut kazanım sorusu çözümüne geçin.`
    );
  } else if (topics.length > 0) {
    nextLessonRecommendations.push(
      `"${topics[0]}" konusunu pekiştiren kısa tekrar + 5 soruluk mini quiz ile devam edin.`
    );
  } else {
    nextLessonRecommendations.push(
      `Sonraki derste bu kaydın kaldığı yerden devam edin; son bölümü açılışta 2 dk özetleyin.`
    );
  }

  nextLessonRecommendations.push(
    `Her 8–10 dk anlatımdan sonra ${studentFirstName}'ya somut bir soru yöneltin; konuşma oranını %${talkRatio} → %60 altına çekin.`
  );

  if (planMentions >= 2) {
    nextLessonRecommendations.push(
      `Ders planını yazılı olarak paylaşın — sözlü anlatılan yapıyı pekiştirir.`
    );
  }

  if (talkRatio > 75) {
    nextLessonRecommendations.push(
      `Ders başında "${studentFirstName}, en çok nerede takılıyorsun?" diye öğrenciye konuşturun.`
    );
  }

  const homeworkItems: string[] = [];

  if (intensity === "Hafif") {
    if (isMathSubject(subject)) {
      homeworkItems.push(
        `Devirli ondalık → rasyonel dönüşüm: 5 örnek çöz (${studentFirstName}'nın demo derste belirttiği zorluk)`
      );
    } else {
      homeworkItems.push(`Bu derste geçen "${topicHint}" konularını 10 dk tekrar et`);
    }
    homeworkItems.push("Haftalık çalışma planını takvimine işaretle");
  } else if (intensity === "Orta") {
    if (isMathSubject(subject)) {
      homeworkItems.push("Rasyonel sayılarda toplama-çıkarma: 10 soru");
      homeworkItems.push("LGS formatında veri işleme/daire grafiği: 5 soru");
    } else if (lgsMentions >= 2) {
      homeworkItems.push("LGS formatında 10 soruluk mini set çöz");
    } else {
      homeworkItems.push(`${topicHint} konusundan 10 alıştırma sorusu`);
    }
    homeworkItems.push("Yanlış yapılan soruları işaretle; sonraki derste birlikte inceleyin");
  } else {
    homeworkItems.push(`${topicHint} tam tekrar + 20 soru + 1 deneme bölümü analizi`);
  }

  const lessonLabel =
    lessonType === "demo"
      ? "Matematik demo dersi"
      : lessonType === "tanışma"
        ? "Tanışma dersi"
        : isMathSubject(subject)
          ? "Matematik dersi"
          : isHistorySubject(subject)
            ? "İnkılap Tarihi dersi"
            : "Ders kaydı";

  const overview = `${lessonLabel}, ${durationMin} dakika (${topicHint}). Öğretmen konuşma oranı %${talkRatio}, ${studentFirstName} ${studentSegs.length} tur aldı, ${questions.length} soru tespit edildi. Genel değerlendirme: ${score}/10 — ${scoreLabel(score)}.`;

  return {
    score,
    scoreLabel: scoreLabel(score),
    overview,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 5),
    studentProfileInsights: studentProfileInsights.slice(0, 4),
    nextLessonRecommendations: nextLessonRecommendations.slice(0, 5),
    homeworkRecommendation: {
      intensity,
      items: homeworkItems,
    },
  };
}
