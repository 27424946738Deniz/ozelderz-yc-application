import type {
  LearningStyleAnalysis,
  LearningStyleDimension,
} from "@/types";
import type { TranscriptSegment } from "@/types/transcript";

function scoreLevel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function dim(
  id: string,
  label: string,
  score: number,
  insight: string,
  evidence: string,
  teachWith: string,
  avoid: string
): LearningStyleDimension {
  return {
    id,
    label,
    score,
    level: scoreLevel(score),
    insight,
    evidence,
    teachWith,
    avoid,
  };
}

export function buildLearningStyleAnalysis(
  studentSegs: TranscriptSegment[],
  firstName: string,
  metrics: {
    studentQuestions: number;
    longAnswers: number;
    shortAnswers: number;
    participationPct: number;
    avgUtteranceLen: number;
    sportHits: TranscriptSegment[];
    lgsHits: TranscriptSegment[];
    resourceHits: TranscriptSegment[];
    historyAffinity: number;
    initiated: TranscriptSegment[];
    techHits: TranscriptSegment[];
    subject: string;
    meetCode?: string;
    approachGuide?: LearningStyleAnalysis["approachGuide"];
    understandsBetter?: LearningStyleAnalysis["understandsBetter"];
    understandsLess?: LearningStyleAnalysis["understandsLess"];
  }
): LearningStyleAnalysis {
  const {
    studentQuestions,
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
    subject,
  } = metrics;

  const total = Math.max(studentSegs.length, 1);
  const shortRatio = shortAnswers / total;
  const questionRate = Math.min(100, (studentQuestions / total) * 120);

  const concreteScore = clampScore(
    resourceHits.length * 18 + lgsHits.length * 10 + (studentQuestions >= 10 ? 15 : 0)
  );
  const visualScore = clampScore(
    resourceHits.length * 15 +
      techHits.length * 8 +
      countPattern(studentSegs, /pdf|ekran|harita|tablo|gör/i) * 12
  );
  const personalScore = clampScore(
    sportHits.length * 22 +
      longAnswers * 8 +
      countPattern(studentSegs, /fen lisesi|galatasaray|hedef|okul/i) * 15
  );
  const goalScore = clampScore(
    lgsHits.length * 20 +
      countPattern(studentSegs, /deneme|net|sınav|lgs/i) * 12 +
      countPattern(studentSegs, /kulüp|hedef/i) * 10
  );
  const activeScore = clampScore(
    questionRate * 0.5 +
      initiated.length * 15 +
      (studentQuestions >= 15 ? 20 : studentQuestions >= 8 ? 10 : 0)
  );
  const passiveListenScore = clampScore(
    shortRatio * 70 + (participationPct < 15 ? 25 : 10) - longAnswers * 5
  );
  const abstractScore = clampScore(
    35 - longAnswers * 4 + (avgUtteranceLen < 30 ? 20 : 0)
  );
  const narrativeScore = clampScore(
    historyAffinity * 25 +
      countPattern(studentSegs, /seviyorum|ilgili|biliyorum/i) * 20
  );

  const dimensions: LearningStyleDimension[] = [
    dim(
      "concrete",
      "Somut & Uygulamalı",
      concreteScore,
      `${firstName} somut materyal ve net görevlerden daha iyi anlıyor`,
      `${resourceHits.length} kez kaynak/PDF/MEB, ${lgsHits.length} kez sınav/deneme konuşması`,
      "Test listesi, PDF bölümü, \"10 soru çöz\" gibi ölçülebilir ödevler",
      "Belirsiz \"çalış\" talimatı, soyut müfredat listesi okuma"
    ),
    dim(
      "visual",
      "Görsel & Materyal",
      visualScore,
      `${firstName} görseller, ekran paylaşımı ve yazılı materyal eşliğinde daha iyi anlıyor`,
      `PDF/ekran/materyal referansları; öğretmen slayt anlatımında soru sorması`,
      "Harita, tablo, şema, ekran paylaşımı, renkli not şablonu",
      "Yalnızca sözlü anlatım, yazısız 15+ dk monolog"
    ),
    dim(
      "personal",
      "Kişisel Bağlantı",
      personalScore,
      `${firstName} kişisel hikâye ve hedef konuşmalarından daha iyi anlıyor`,
      `Spor/takım (${sportHits.length}), okul hedefi, ${longAnswers} uzun kişisel yanıt`,
      "Spor metaforları, \"senin hedefin ne\" soruları, tanışma köprüleri",
      "Tamamen impersonal akademik dil, isim/hedef kullanmama"
    ),
    dim(
      "goal",
      "Hedef & Sınav Odaklı",
      goalScore,
      `${firstName} LGS hedefi ve net plan konuşulduğunda daha iyi anlıyor`,
      `${lgsHits.length} sınav/hedef referansı; deneme kulübü, fen lisesi hedefi`,
      "Ünite başına soru sayısı, net hedefi, haftalık deneme planı",
      "Hedefsiz teorik anlatım, \"neden öğreniyoruz\" sorusunu yanıtsız bırakma"
    ),
    dim(
      "active",
      "Sorgulayıcı & Aktif",
      activeScore,
      `${firstName} soru sorma fırsatı verildiğinde daha iyi anlıyor`,
      `${studentQuestions} soru, ${initiated.length} inisiyatifli giriş`,
      "Açık uçlu sorular, \"sorabilir miyim\" alanı, bekleme süresi tanıma",
      "Sürekli monolog, soru sormadan bir sonraki konuya geçme"
    ),
    dim(
      "passive",
      "Pasif Dinleme Eğilimi",
      passiveListenScore,
      `${firstName} uzun dinleme bloklarında anlama düşüyor — kısa onay verip geçiyor`,
      `%${Math.round(shortRatio * 100)} kısa yanıt, katılım %${participationPct}`,
      "Her 5 dk mini kontrol, adını söyleyerek soru yöneltme",
      "10+ dk kesintisiz anlatım, \"anladın mı\" genel sorusu"
    ),
    dim(
      "abstract",
      "Soyut Teorik",
      abstractScore,
      `${firstName} soyut kavram listelerinden zayıf anlıyor`,
      `Ort. yanıt ${avgUtteranceLen} karakter; uzun teorik bloklarda sessizleşme`,
      "Örnek olay, tarih hikâyesi, neden-sonuç zinciri",
      "Ezber listesi, kronoloji tablosu önce, bağlam sonra"
    ),
    dim(
      "narrative",
      "Anlatı & Hikâye",
      narrativeScore,
      `${firstName} tarih sevgisi ve olay anlatımından daha iyi anlıyor`,
      historyAffinity > 0 ? "\"Tarihi seviyorum\" ifadesi transkriptte" : "Konu ilgisi sınırlı",
      "Olay örgüsü, kahraman hikâyesi, neden-sonuç hikâyeleştirme",
      "Kuru madde madde ezber, bağlamsız tarih listesi"
    ),
  ].sort((a, b) => b.score - a.score);

  const top3 = dimensions.slice(0, 3).map((d) => d.label);
  const primaryStyle = top3[0] ?? "Karma Öğrenen";
  const secondaryStyle = top3[1] ?? "Pratik Odaklı";

  const bestQuote = studentSegs.find((s) => s.text.length > 50)?.text;

  const understandsBetter =
    metrics.understandsBetter ??
    [];
  const understandsLess =
    metrics.understandsLess ??
    [];

  const approachGuide = metrics.approachGuide ?? [
    {
      title: "Katılımı artırma",
      gap: `${firstName} derste sınırlı katılım gösterdi (%${participationPct} konuşma payı).`,
      tactic: `Her konu bloğunda en az bir "sen anlat" görevi ver; kısa yanıtları derinleştirme sorularıyla genişlet.`,
    },
  ];

  const overview = `${firstName} primarily learns through **${primaryStyle.toLowerCase()}** with **${secondaryStyle.toLowerCase()}** support. Transkriptte en uzun yanıtlar kişisel ve hedef konuşmalarında; en kısa yanıtlar uzun öğretmen anlatımlarında. ${bestQuote ? `Örnek: "${bestQuote.slice(0, 90)}…"` : ""}`;

  return {
    primaryStyle,
    secondaryStyle,
    overview: overview.replace(/\*\*/g, ""),
    dimensions,
    understandsBetter,
    understandsLess,
    approachGuide,
  };
}

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

function clampScore(n: number) {
  return Math.max(8, Math.min(95, Math.round(n)));
}
