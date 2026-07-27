import type { TranscriptData, TranscriptSegment } from "@/types/transcript";
import { isQuestion } from "@/lib/transcript-analytics";
import {
  extractTopicsFromTranscript,
  isHistorySubject,
  isMathSubject,
} from "@/lib/lesson-context";

const TEACHER = "SPEAKER_00";
const STUDENT = "SPEAKER_01";

export interface LessonGap {
  id: string;
  severity: number;
  title: string;
  observation: string;
}

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

export function detectLessonGaps(
  transcript: TranscriptData,
  context: {
    studentName: string;
    subject: string;
    lessonType: string;
  }
): LessonGap[] {
  const fn = context.studentName.split(" ")[0];
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
  const teacherTalkPct = 100 - participationPct;

  const studentQuestions = studentSegs.filter((s) =>
    isQuestion(s.text, s.speaker)
  );
  const shortAnswers = studentSegs.filter((s) => s.text.trim().length < 15);
  const longAnswers = studentSegs.filter((s) => s.text.length > 60);
  const shortRatio =
    studentSegs.length > 0 ? shortAnswers.length / studentSegs.length : 1;

  const checkIns = countPattern(
    transcript.segments,
    /anlaştık|tamam mı|anladın|net geliyor/i
  );
  const visualMentions = countPattern(
    transcript.segments,
    /pdf|ekran|harita|tablo|şema|sayı doğrusu/i
  );
  const homeworkMentions = countPattern(
    transcript.segments,
    /ödev|test|çöz|alıştırma/i
  );
  const goalMentions = countPattern(
    studentSegs,
    /fen lisesi|lgs|deneme|hedef|sınav/i
  );
  const struggleSeg = studentSegs.find(
    (s) =>
      /takıl|zorlan|anlamadım|karıştır|bilmiyorum/i.test(s.text) &&
      !/sıkıntı değil|sorun değil/i.test(s.text)
  );
  const worrySeg = studentSegs.find((s) =>
    /endişe|korkuyorum|yapamıyorum|düşük puan/i.test(s.text)
  );
  const topics = extractTopicsFromTranscript(transcript, context.subject);

  const gaps: LessonGap[] = [];

  if (studentSegs.length < 20) {
    gaps.push({
      id: "minimal_voice",
      severity: 95,
      title: "Öğrenci sesi neredeyse yok",
      observation: `${fn} derste ${studentSegs.length} kez konuştu — diarizasyon veya katılım sorunu; öğretmen neredeyse tek başına ilerledi.`,
    });
  } else if (participationPct < 15) {
    gaps.push({
      id: "low_participation",
      severity: 85,
      title: "Düşük katılım oranı",
      observation: `Konuşma süresinin yalnızca %${participationPct}'i öğrencide; ders öğretmen monoloğuna kaymış.`,
    });
  } else if (participationPct < 25) {
    gaps.push({
      id: "moderate_participation",
      severity: 55,
      title: "Sınırlı öğrenci katkısı",
      observation: `Katılım %${participationPct} — öğrenci dinleyici konumunda kalmış, aktif üretim az.`,
    });
  } else if (teacherTalkPct > 70) {
    gaps.push({
      id: "teacher_dominance",
      severity: 60,
      title: "Öğretmen ağırlıklı ders akışı",
      observation: `Konuşmanın %${teacherTalkPct}'i öğretmende; öğrenci fikir üretme fırsatı sınırlı.`,
    });
  }

  if (shortRatio > 0.55 && studentSegs.length > 15) {
    gaps.push({
      id: "surface_responses",
      severity: 65,
      title: "Yüzeysel yanıt kalıbı",
      observation: `Yanıtların %${Math.round(shortRatio * 100)}'i tek kelimelik onay — içerik özümseme sinyali zayıf.`,
    });
  }

  if (longAnswers.length < 3 && studentSegs.length > 30) {
    gaps.push({
      id: "no_elaboration",
      severity: 60,
      title: "Kavramsal açıklama eksikliği",
      observation: `${fn} kendi cümleleriyle uzun açıklama yapmadı (${longAnswers.length} uzun yanıt) — düşünme sürecini dışa vurma pratiği yok.`,
    });
  }

  if (studentQuestions.length < 5 && studentSegs.length > 30) {
    gaps.push({
      id: "low_curiosity",
      severity: 50,
      title: "Merak ve soru üretimi düşük",
      observation: `Öğrenci yalnızca ${studentQuestions.length} soru sordu — pasif alım eğilimi baskın.`,
    });
  } else if (studentQuestions.length >= 15 && shortRatio > 0.4) {
    gaps.push({
      id: "questions_without_depth",
      severity: 45,
      title: "Soru var ama derinlik yok",
      observation: `${studentQuestions.length} soru sormasına rağmen çoğu yanıt kısa — sorular mekanik, içselleştirme takip etmiyor.`,
    });
  }

  if (struggleSeg) {
    const topicHint = topics[0] ?? context.subject;
    gaps.push({
      id: "unresolved_struggle",
      severity: 80,
      title: "Kapatılmamış kavram boşluğu",
      observation: `${fn} ${topicHint} konusunda takıldığını belirtti; derste bu boşluk tam kapanmamış olabilir.`,
    });
  }

  if (worrySeg) {
    gaps.push({
      id: "exam_anxiety",
      severity: 55,
      title: "Özgüven / sınav kaygısı",
      observation: `Performans endişesi dile getirildi — öğrenme motivasyonu kaygıyla bloke olabilir.`,
    });
  }

  if (homeworkMentions > 15 && studentQuestions.length < 8) {
    gaps.push({
      id: "practice_without_comprehension",
      severity: 55,
      title: "Uygulama yoğun, anlama teyidi az",
      observation: `Test/ödev konuşması yoğun (${homeworkMentions} referans) ama öğrencinin anladığını gösteren derin yanıt az.`,
    });
  }

  if (visualMentions < 3 && isMathSubject(context.subject)) {
    gaps.push({
      id: "missing_visual_scaffolding",
      severity: 50,
      title: "Görsel somutlama eksik",
      observation: `Matematik dersinde sayı doğrusu, tablo veya grafik gibi görsel araçlar yeterince kullanılmamış.`,
    });
  }

  if (isHistorySubject(context.subject) && countPattern(studentSegs, /ezber|karış|kronoloji|hatırlayam/i) > 0) {
    gaps.push({
      id: "chronology_struggle",
      severity: 55,
      title: "Kronoloji / ezber zorluğu",
      observation: `Tarih listesi veya kronoloji ezberinde zorlandığını ima etti — anlatı formatı daha uygun olabilir.`,
    });
  }

  if (goalMentions === 0 && context.lessonType !== "tanışma" && studentSegs.length > 20) {
    gaps.push({
      id: "no_goal_anchor",
      severity: 40,
      title: "Hedef bağlantısı kurulmamış",
      observation: `Ders boyunca LGS/hedef referansı yok — öğrenci "neden öğreniyorum" sorusuna yanıt almamış olabilir.`,
    });
  }

  if (checkIns > 20 && shortRatio > 0.5) {
    gaps.push({
      id: "false_checkins",
      severity: 50,
      title: "Yüzeysel anlama kontrolleri",
      observation: `"Anladın mı?" tarzı ${checkIns} kontrol var ama yanıtlar kısa — gerçek anlama ölçülmemiş.`,
    });
  }

  if (context.lessonType === "tanışma" && participationPct > 20 && goalMentions === 0) {
    gaps.push({
      id: "tanisma_no_roadmap",
      severity: 35,
      title: "Tanışma sonrası yol haritası belirsiz",
      observation: `Tanışma iyi geçmiş ama hedef ve çalışma planı netleştirilmemiş — sonraki ders yönü muğlak.`,
    });
  }

  return gaps.sort((a, b) => b.severity - a.severity);
}
