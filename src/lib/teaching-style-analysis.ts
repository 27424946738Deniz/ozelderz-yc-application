import type {
  TeachingStyleAnalysis,
  TeacherStyleDimension,
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
  evidence: string
): TeacherStyleDimension {
  return {
    id,
    label,
    score,
    level: scoreLevel(score),
    insight,
    evidence,
  };
}

function countPattern(segments: TranscriptSegment[], re: RegExp): number {
  return segments.filter((s) => re.test(s.text)).length;
}

function clampScore(n: number) {
  return Math.max(8, Math.min(95, Math.round(n)));
}

export function buildTeachingStyleAnalysis(
  teacherSegs: TranscriptSegment[],
  teacherFirst: string,
  metrics: {
    talkRatioPct: number;
    wpm: number;
    checkIns: number;
    planMentions: number;
    lgsMentions: number;
    visualMentions: number;
    unitMentions: number;
    rapportMentions: number;
    empathyMentions: number;
    teacherQuestions: number;
    avgGap: number;
    studentLongTurns: number;
    excelsWith?: TeachingStyleAnalysis["excelsWith"];
    lessSuitedFor?: TeachingStyleAnalysis["lessSuitedFor"];
    matchingGuide?: TeachingStyleAnalysis["matchingGuide"];
    overview?: string;
  }
): TeachingStyleAnalysis {
  const {
    talkRatioPct,
    wpm,
    checkIns,
    planMentions,
    lgsMentions,
    visualMentions,
    unitMentions,
    rapportMentions,
    empathyMentions,
    teacherQuestions,
    avgGap,
    studentLongTurns,
  } = metrics;

  const structureScore = clampScore(
    planMentions * 15 + unitMentions * 8 + checkIns * 1.5
  );
  const examStrategyScore = clampScore(
    lgsMentions * 22 + countPattern(teacherSegs, /deneme|net|soru dağılım|sözel test/i) * 12
  );
  const visualScore = clampScore(
    visualMentions * 8 + countPattern(teacherSegs, /pdf|ekran|harita|tablo|slayt/i) * 10
  );
  const feedbackScore = clampScore(
    checkIns * 2.5 + empathyMentions * 18 + countPattern(teacherSegs, /tamam mı|anlaştık|anladın/i) * 8
  );
  const rapportScore = clampScore(
    rapportMentions * 14 +
      countPattern(teacherSegs, /tanış|hedef|motiv|spor|voleybol/i) * 12
  );
  const questioningScore = clampScore(
    teacherQuestions * 0.8 +
      countPattern(teacherSegs, /soru sor|düşün|neden|nasıl|peki sen/i) * 10
  );
  const participationScore = clampScore(
    100 - talkRatioPct * 0.7 + studentLongTurns * 6 + avgGap * 8
  );
  const pacingScore = clampScore(
    (wpm >= 145 && wpm <= 170 ? 70 : wpm >= 130 ? 50 : 35) +
      (teacherSegs.length > 200 ? 10 : 0)
  );

  const dimensions: TeacherStyleDimension[] = [
    dim(
      "structure",
      "Yapılandırma & Planlama",
      structureScore,
      `${teacherFirst} dersi net bir yol haritası ve program çerçevesinde yönetiyor`,
      `${planMentions} plan/program, ${unitMentions} ünite referansı, ${checkIns} geri bildirim anı`
    ),
    dim(
      "exam",
      "Sınav Stratejisi (LGS)",
      examStrategyScore,
      `${teacherFirst} sınav yapısını ve hedef odaklı çalışmayı ön plana çıkarıyor`,
      `${lgsMentions} LGS/sınav referansı; soru dağılımı ve deneme planı anlatımı`
    ),
    dim(
      "visual",
      "Görsel & Materyal",
      visualScore,
      `${teacherFirst} PDF, ekran ve görsel materyalle destekli anlatım yapıyor`,
      `${visualMentions} materyal/ekran referansı transkriptte`
    ),
    dim(
      "feedback",
      "İletişim & Geri Bildirim",
      feedbackScore,
      `${teacherFirst} anlık kontrol ve destekleyici dil kullanıyor`,
      `"Tamam mı?", "Anlaştık mı?" — ${checkIns} kontrol; ${empathyMentions} empati ifadesi`
    ),
    dim(
      "rapport",
      "İlişki Kurma",
      rapportScore,
      `${teacherFirst} tanışma ve kişisel bağ kurmada güçlü`,
      `${rapportMentions} motivasyon/tanışma/spor referansı`
    ),
    dim(
      "questioning",
      "Sorgulama & Derinleştirme",
      questioningScore,
      `${teacherFirst} soru sorma ve öğrenciyi düşündürme tarzında`,
      `${teacherQuestions} öğretmen sorusu; derinleştirici takip sınırlı olabilir`
    ),
    dim(
      "participation",
      "Öğrenci Katılımı Teşviki",
      participationScore,
      `${teacherFirst} öğrenciyi konuşturma konusunda ${participationScore >= 55 ? "orta-iyi" : "gelişime açık"}`,
      `Konuşma oranı %${talkRatioPct}; öğrenci uzun yanıt: ${studentLongTurns}`
    ),
    dim(
      "pacing",
      "Anlatım Temposu",
      pacingScore,
      `${teacherFirst} ${wpm} kel/dk hızında anlatıyor`,
      wpm >= 145 && wpm <= 170
        ? "Önerilen tempo aralığında"
        : wpm < 145
          ? "Tempo biraz düşük — uzun derslerde dikkat dağılabilir"
          : "Tempo yüksek — not alma zorlaşabilir"
    ),
  ].sort((a, b) => b.score - a.score);

  const primaryStyle = dimensions[0]?.label ?? "Karma Öğretmen";
  const secondaryStyle = dimensions[1]?.label ?? "Yapılandırılmış Anlatım";

  const excelsWith =
    metrics.excelsWith && metrics.excelsWith.length > 0
      ? metrics.excelsWith
      : ([
    structureScore >= 55
      ? {
          type: "Yapı ve plan arayan öğrenciler",
          reason:
            "Haftalık program, WhatsApp iletişimi ve ünite yol haritası net — belirsizlikten hoşlanmayan profiller için ideal",
          example: planMentions >= 3 ? "Yol haritası + haftalık plan anlatımı" : undefined,
        }
      : null,
    examStrategyScore >= 55
      ? {
          type: "LGS / sınav odaklı öğrenciler",
          reason:
            "Soru dağılımı, deneme stratejisi ve net hedef konuşmaları bu hocanın doğal güçlü yönü",
          example: "Ünite başına kaç soru gelir sorusuna detaylı yanıt",
        }
      : null,
    visualScore >= 50
      ? {
          type: "Sorgulayıcı-görsel öğrenenler",
          reason:
            "PDF, MEB kaynağı, ekran paylaşımı ve materyal planı sunma becerisi yüksek",
        }
      : null,
    rapportScore >= 50
      ? {
          type: "Yeni başlayan / tanışma aşamasındaki öğrenciler",
          reason:
            "Kişisel ilgi, hedef sohbeti ve güven ortamı kurma — ilk derslerde kaygılı öğrenciler için uygun",
        }
      : null,
    feedbackScore >= 55
      ? {
          type: "Düşük özgüvenli, onay arayan öğrenciler",
          reason:
            "Sık \"tamam mı?\" kontrolü ve destekleyici dil — adım adım ilerlemek isteyenlerle iyi eşleşir",
        }
      : null,
  ].filter(Boolean) as TeachingStyleAnalysis["excelsWith"]);

  const lessSuitedFor =
    metrics.lessSuitedFor && metrics.lessSuitedFor.length > 0
      ? metrics.lessSuitedFor
      : ([
    talkRatioPct > 75
      ? {
          type: "Yüksek katılım isteyen tartışmacı öğrenciler",
          reason: `Konuşma süresinin %${talkRatioPct}'i hocada — öğrencinin fikir üretmesi için alan sınırlı`,
          alternative:
            "Daha interaktif, öğrenci merkezli bir hoca veya grup dersi düşünün",
        }
      : null,
    participationScore < 45
      ? {
          type: "Sessiz ama derinlemesine düşünen öğrenciler",
          reason:
            "Uzun monolog sonrası kısa onay yeterli sayılıyor; içsel düşünceyi açacak takip soruları az",
          alternative:
            "Sokratik soru sorma ve bekleme süresi kullanan bir profil tercih edin",
        }
      : null,
    examStrategyScore > 60 && questioningScore < 45
      ? {
          type: "Soyut teoriyi seven, sınav dışı meraklı öğrenciler",
          reason:
            "Anlatım LGS çerçevesine sıkışıyor — \"neden öğreniyoruz\" sorusunu felsefi derinlikle yanıtlamaz",
          alternative:
            "Kavram odaklı, hikâye anlatan veya proje tabanlı öğretmen",
        }
      : null,
    visualScore < 40
      ? {
          type: "Tamamen görsel-kinestetik öğrenenler",
          reason: "Materyal kullanımı transkriptte sınırlı kalıyor",
          alternative: "Ekran/harita/etkinlik ağırlıklı profil",
        }
      : null,
  ].filter(Boolean) as TeachingStyleAnalysis["lessSuitedFor"]);

  const matchingGuide =
    metrics.matchingGuide && metrics.matchingGuide.length > 0
      ? metrics.matchingGuide
      : [
    {
      when: "Öğrenci LGS hazırlığına yeni başlıyorsa",
      recommend: `${teacherFirst}'ya yönlendirin — müfredat haritası ve sınav çerçevesi kurar`,
      because: "Yapılandırma ve sınav stratejisi boyutları güçlü",
    },
    {
      when: "Öğrenci kaynak/PDF soruyor, \"ne çalışayım\" diyorsa",
      recommend: `${teacherFirst} ideal — somut materyal planı ve MEB odaklı yol haritası sunar`,
      because: "Görsel-materyal ve hedef odaklı anlatım uyumu yüksek",
    },
    {
      when: "İlk tanışma dersi / güven inşa aşaması",
      recommend: `${teacherFirst} — spor, hedef ve kişisel sohbetle öğrenciyi açar`,
      because: "İlişki kurma ve empati boyutları transkriptte belirgin",
    },
    {
      when: "Öğrenci çok konuşmak, tartışmak istiyorsa",
      recommend: `${teacherFirst} yerine daha interaktif profilli hoca düşünün`,
      because: `Konuşma oranı %${talkRatioPct} — katılım teşviki gelişim alanı`,
    },
    {
      when: "Öğrenci uzun sessizlikte düşünüp sonra derin yanıt veriyorsa",
      recommend: "Bekleme süresi ve takip sorusu güçlü alternatif hoca",
      because: "Derinleştirici sorgulama skoru orta-altı; monolog ağırlıklı akış",
    },
    {
      when: "Koordinatör eşleştirme kararı verirken",
      recommend:
        "Bu hocanın güçlü yönleri: plan + LGS + materyal. Bu üç ihtiyacı olan öğrenciyi önceliklendirin.",
      because: primaryStyle + " ve " + secondaryStyle + " baskın öğretim tarzı",
    },
  ];

  const bestQuote = teacherSegs.find((s) => s.text.length > 60)?.text;

  const overview =
    metrics.overview?.trim() ||
    `${teacherFirst}, transkriptte **${primaryStyle.toLowerCase()}** ve **${secondaryStyle.toLowerCase()}** ile öne çıkıyor. Güçlü yönleri yapılandırma, sınav stratejisi ve materyal planlaması; gelişim alanı öğrenciyi aktif konuşturma. ${bestQuote ? `Örnek: "${bestQuote.slice(0, 85)}…"` : ""} Bu profildeki hoca, plan ve hedef arayan öğrencilere yönlendirilmelidir.`.replace(
      /\*\*/g,
      ""
    );

  return {
    primaryStyle,
    secondaryStyle,
    overview: overview.replace(/\*\*/g, ""),
    dimensions,
    excelsWith,
    lessSuitedFor,
    matchingGuide,
  };
}
