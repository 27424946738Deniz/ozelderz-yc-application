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

  const understandsBetter = [
    {
      area: "Somut kaynak & test planları",
      reason: "Ne yapacağını net bilince aktifleşiyor",
      example: resourceHits[0]?.text.slice(0, 80),
    },
    {
      area: "Kişisel hedef konuşmaları",
      reason: "Fen lisesi, okul hedefi gibi gelecek planları motive ediyor",
      example: studentSegs.find((s) => /fen lisesi|galatasaray/i.test(s.text))?.text.slice(0, 80),
    },
    {
      area: "Görsel materyal eşliğinde anlatım",
      reason: "PDF, ekran, MEB kaynağı soruları sordu — materyal varlığına ihtiyaç duyuyor",
      example: resourceHits[0]?.text.slice(0, 80),
    },
    {
      area: "Spor & takım benzetmeleri",
      reason: "Voleybol deneyiminde en uzun ve açık yanıtları verdi",
      example: sportHits.find((s) => s.text.length > 30)?.text.slice(0, 80),
    },
    {
      area: "LGS stratejisi & soru dağılımı",
      reason: "Sınav yapısını duyunca \"kaç soru, hangi ünite\" soruları soruyor",
      example: lgsHits[0]?.text.slice(0, 80),
    },
    historyAffinity > 0
      ? {
          area: "Hikâye ve olay anlatımı (tarih)",
          reason: "Tarihi sevdiğini belirtti — ezber değil olay akışı tercih eder",
          example: studentSegs.find((s) => /seviyorum/i.test(s.text))?.text.slice(0, 80),
        }
      : null,
  ].filter(Boolean) as LearningStyleAnalysis["understandsBetter"];

  const understandsLess = [
    {
      area: "Uzun sözlü monolog",
      reason: `%${Math.round(shortRatio * 100)} yanıtı 15 karakterden kısa — dinliyor ama içselleştirmiyor`,
      alternative: "5 dk anlat → 1 somut soru → devam",
    },
    {
      area: "Soyut müfredat listesi",
      reason: "7 ünite sayımı dinlerken soru sormuyor; materyal gelince soruyor",
      alternative: "Her üniteye \"1 örnek soru + 1 PDF sayfası\" eşle",
    },
    {
      area: "Belirsiz ödev talimatı",
      reason: "\"Çalış\" yerine \"10 MEB sorusu, 1 PDF\" istediğinde takip edebilir",
      alternative: "Sayı, süre ve kaynak adı ver",
    },
    {
      area: "Kronoloji ezberi (önce tarih, sonra bağlam)",
      reason: "Profil ve transkript: liste ezberinde zorlanma eğilimi",
      alternative: "Önce olay hikâyesi, sonra tarih hafızaya al",
    },
  ];

  const approachGuide: LearningStyleAnalysis["approachGuide"] = [
    {
      when: "Yeni konu anlatımına başlarken",
      doThis: `2 dk kişisel köprü kur (${firstName}'nın hedefi veya sporu) → PDF/ekran aç → 5 dk anlat`,
      because: "Kişisel bağlantı + görsel materyal birlikte en yüksek skorlu boyutlar",
    },
    {
      when: "Öğrenci sessizleştiğinde",
      doThis: "Adını söyle + somut soru: \"Bu PDF'teki 3. soruyu birlikte okuyalım mı?\"",
      because: "Pasif dinleme eğilimi yüksek; doğrudan çağrı ve somut görev uyandırır",
    },
    {
      when: "Motivasyon düştüğünde",
      doThis: "LGS net hedefi ve ünite soru sayısını hatırlat; deneme planına bağla",
      because: "Hedef odaklı boyut güçlü — \"neden\" sorusunu sınav stratejisiyle yanıtla",
    },
    {
      when: "Kaynak seçimi sorulduğunda",
      doThis: "MEB + 1 alternatif kaynak ver; çıkmış soru seti ekle",
      because: "Transkriptte MEB ve geçmiş yıllar sorularına proaktif ilgi var",
    },
    {
      when: "Tarih konusu anlatırken",
      doThis: "Olay hikâyesi + neden-sonuç; kronolojiyi sona bırak",
      because: "Anlatı boyutu yüksek, soyut ezber boyutu düşük",
    },
    {
      when: "Ödev verirken",
      doThis: "Orta yoğunluk: 10 MEB sorusu + 1 PDF bölümü (~30 dk) — yazılı WhatsApp'ta tekrarla",
      because: "Somut-uygulamalı boyut baskın; belirsizlik takibi düşürür",
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
