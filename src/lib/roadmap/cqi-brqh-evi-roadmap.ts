import type { LessonRoadmap } from "@/types/roadmap";

export const cqiRoadmap: LessonRoadmap = {
  lessonId: "cqi-brqh-evi",
  title: "Matematik — Nisa Yol Haritası",
  subject: "Matematik (LGS)",
  teacher: {
    name: "Ceren",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ceren",
    title: "Matematik Öğretmeni",
  },
  student: {
    name: "İnci Nisa",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nisa",
    grade: "8. Sınıf",
    learningStyle: "Görsel-Uygulamalı Öğrenen",
    temperamentSignals: [
      "Takıldığı konuyu açıkça söylüyor — 'devirli ondalıklarda takılıyorum' demesi seviye tespiti için ideal",
      "Denklemlerde kendine güveniyor; güçlü alanı oradan pekiştirilerek zayıf alana köprü kurulmalı",
      "Beyaz tahta ve adım adım çözümle daha aktif — soyut formül ezberinde pasifleşiyor",
      "Kısa onaylarla geçme eğilimi var — her 5–8 dk'da somut soru şart",
    ],
  },
  introLessonInsights: [
    "Demo derste rasyonel sayılar odağında devirli ondalık ↔ rasyonel dönüşüm işlendi.",
    "Nisa toplama/çarpma işlemlerinde sorun yaşamadığını, devirli ondalıklarda takıldığını belirtti.",
    "Denklemler güçlü alan — LGS'de denklemler + rasyoneller + veri işleme üçlüsü öncelik.",
    "Ceren beyaz tahta üzerinde çalışmayı tercih etti; görsel adım adım yaklaşım profile uygun.",
  ],
  generatedFrom: "Demo Ders — cqi-brqh-evi transkripti",
  phases: [
    {
      id: "phase-1",
      label: "Faz 1",
      months: "Ay 1–3",
      goal: "Rasyonel sayılar (devirli ondalık), denklem pekiştirme, çalışma ritmi",
      checkpoints: [
        {
          id: "cp-demo",
          title: "Demo ders & çalışma sistemi",
          weekRange: "Hafta 1–2",
          status: "foundation",
          teacherFocus: [
            "Demo ders notlarını özetle — devirli ondalık zayıf, denklem güçlü",
            "Haftalık plan ve ödev formatını netleştir (ölçülebilir: '10 soru')",
            "LGS matematik soru dağılımını tablo ile göster",
          ],
          studentTasks: [
            "Demo derste işlenen 5 örneği tekrar çöz",
            "Takıldığın konuları liste halinde yaz (devirli, ondalık, problem)",
            "İlk deneme matematik bölümünü çöz (sadece tespit)",
          ],
          test: {
            label: "Başlangıç teşhis testi",
            description: "15 soru karışık — rasyonel, ondalık, denklem (seviye tespiti)",
            questionCount: 15,
            passScore: 7,
            format: "LGS matematik karışık",
          },
          onPass: {
            headline: "Go next → Devirli ondalık yoğunlaştırma",
            detail:
              "≥7/15: Temel seviye yeterli. Demo derste belirlenen devirli ondalık hattına geç.",
          },
          onFail: {
            weakArea: "Genel 8. sınıf matematik temeli",
            temperamentNote:
              "Nisa takıldığı yeri söyleyebiliyor — genel test yerine konu bazlı mini teşhis yap; 'hangi konuda takıldın?' ile başla.",
            teacherAction:
              "15 dk birebir: 5 kolay rasyonel + 5 kolay denklem; zayıf olanı belirle",
            studentRetry: [
              "Konu listesi çıkar (devirli / işlem / denklem)",
              "Zayıf konudan 8 kolay soru",
            ],
          },
        },
        {
          id: "cp-devirli",
          title: "Devirli ondalık ↔ rasyonel dönüşüm",
          weekRange: "Hafta 3–6",
          status: "core",
          teacherFocus: [
            "Demo dersteki formülü beyaz tahtada adım adım tekrarla",
            "Sayı doğrusu ile devirli ondalık görselleştir",
            "Eksi işaretli devirli örneklerine özel dikkat (transkriptte işlendi)",
          ],
          studentTasks: [
            "Haftada 20 devirli ↔ rasyonel dönüşüm sorusu",
            "5 örnek çözümü deftere adım adım yaz",
            "Formül kartı hazırla (virgülden sonra n hane kuralı)",
          ],
          test: {
            label: "Devirli ondalık kontrol testi",
            description: "12 soru — devirli ↔ rasyonel dönüşüm + eksi örnekleri",
            questionCount: 12,
            passScore: 9,
            format: "Rasyonel sayılar — devirli",
          },
          onPass: {
            headline: "Go next → Rasyonel işlemler",
            detail:
              "≥9/12: Devirli ondalık oturdu. Rasyonel toplama/çarpma ve sadeleştirmeye geç.",
          },
          onFail: {
            weakArea: "Devirli ondalık dönüşüm formülü veya eksi işaretli örnekler",
            temperamentNote:
              "Nisa formül ezberinde zorlanıyor — beyaz tahta + 3 somut örnek (0,6̄ / 0,13̄ / −1,4̄) ile tekrar; ezber değil adım.",
            teacherAction:
              "Yanlış yapılan alt tipi tespit et (tek hane devir / çift hane / eksi); o tipten 8 soru + 10 dk görsel",
            studentRetry: [
              "Zayıf alt tip: 10 soruluk hedefli set",
              "3 örneği sayı doğrusunda göster",
              "Ceren ile 15 dk birebir — sadece formül adımları",
            ],
          },
        },
        {
          id: "cp-rasyonel-ops",
          title: "Rasyonel sayı işlemleri & sadeleştirme",
          weekRange: "Hafta 7–9",
          status: "core",
          teacherFocus: [
            "Toplama, çıkarma, çarpma, bölme — Nisa işlemlerde az takılıyor, hızlandır",
            "Sadeleştirme ve ortak payda pratiği",
            "Her derste 2 LGS çıkmış sorusu",
          ],
          studentTasks: [
            "Haftada 25 rasyonel işlem sorusu",
            "Yanlış defteri: işlem tipi + hata nedeni",
            "5 problem sorusu (rasyonel bağlam)",
          ],
          test: {
            label: "Rasyonel işlem ara kontrol",
            description: "10 soru — işlem + sadeleştirme + 2 devirli tekrar",
            questionCount: 10,
            passScore: 7,
            format: "Rasyonel işlemler",
          },
          onPass: {
            headline: "Go next → Denklem pekiştirme",
            detail:
              "≥7/10: İşlemler oturdu. Güçlü alan olan denklemleri LGS seviyesine taşı.",
          },
          onFail: {
            weakArea: "Rasyonel işlem veya sadeleştirme",
            temperamentNote:
              "İşlem hatası yapınca motivasyon düşebilir — denklem gücünü hatırlat: 'denklemde iyisin, aynı dikkati işleme taşı'.",
            teacherAction:
              "Hangi işlem tipinde düştüğünü işaretle; o tipten 6 soru + çözüm kontrolü",
            studentRetry: [
              "Zayıf işlem tipi: 12 soruluk set",
              "3 soruyu sesli çözüm yolu ile anlat (düşünme pratiği)",
            ],
          },
        },
        {
          id: "cp-denklemler",
          title: "Denklemler — güçlü alanı LGS seviyesine taşıma",
          weekRange: "Hafta 10–12",
          status: "core",
          teacherFocus: [
            "Birinci dereceden denklemler + kelime problemleri",
            "Denklem gücünü rasyonel problemlere köprüle",
            "Faz 1 kapanış mini deneme analizi",
          ],
          studentTasks: [
            "Haftada 20 denklem + 5 kelime problemi",
            "Rasyonel-denklem karışık 10 soru",
            "1 parça deneme matematik analizi",
          ],
          test: {
            label: "Faz 1 kapanış testi",
            description: "15 soru — devirli + rasyonel işlem + denklem karışık",
            questionCount: 15,
            passScore: 11,
            format: "Faz 1 genel",
          },
          onPass: {
            headline: "Go next → Faz 2 (Ay 3–6)",
            detail:
              "≥11/15: Faz 1 tamamlandı. Veri işleme ve geometri/cebir konularına geç.",
          },
          onFail: {
            weakArea: "Karışık rasyonel-denklem soruları",
            temperamentNote:
              "Karışık sorularda konu seçimi zorlaşıyor — her soruda 'bu devirli mi denklem mi?' etiketleme alıştırması yap.",
            teacherAction:
              "En çok düşülen 2 konuyu belirle; 2 haftalık yoğunlaştırılmış plan",
            studentRetry: [
              "Zayıf 2 konu × 15 soru",
              "Soru tipi etiketleme çalışması (10 soru)",
            ],
          },
        },
      ],
    },
    {
      id: "phase-2",
      label: "Faz 2",
      months: "Ay 3–6",
      goal: "Veri işleme, geometri/cebir, deneme rutini",
      checkpoints: [
        {
          id: "cp-veri-isleme",
          title: "Veri işleme — daire grafiği & tablo",
          weekRange: "Ay 3–4",
          status: "core",
          teacherFocus: [
            "Demo derste bahsedilen 7. sınıf daire grafiği tekrarı",
            "LGS veri işleme soru tipleri (tablo, grafik, ortalama)",
            "Görsel materyal: grafik çizdirme ve yorumlama",
          ],
          studentTasks: [
            "Haftada 15 veri işleme sorusu",
            "3 daire grafiği çiz ve yorumla",
            "Çıkmış LGS veri işleme soruları (son 3 yıl)",
          ],
          test: {
            label: "Veri işleme kontrol testi",
            description: "10 soru — daire grafiği, tablo, ortalama",
            questionCount: 10,
            passScore: 7,
            format: "Veri işleme",
          },
          onPass: {
            headline: "Go next → Geometri & cebir",
            detail: "≥7/10: Veri işleme oturdu. Üçgenler ve eşitsizliklere geç.",
          },
          onFail: {
            weakArea: "Daire grafiği yorumlama veya yüzde hesabı",
            temperamentNote:
              "Görsel öğrenen profil — grafik çizmeden okumaya geçme; önce elle çiz, sonra soru çöz.",
            teacherAction:
              "3 grafik örneği beyaz tahtada birlikte çiz; ardından 6 yorum sorusu",
            studentRetry: [
              "5 grafik çizim + yorum alıştırması",
              "Zayıf alt konudan 8 soru",
            ],
          },
        },
        {
          id: "cp-geometri-cebir",
          title: "Üçgenler, eşitsizlikler & cebirsel ifadeler",
          weekRange: "Ay 4–5",
          status: "core",
          teacherFocus: [
            "Üçgen eşitsizliği, açı-kenar ilişkileri",
            "Cebirsel ifade sadeleştirme",
            "Rasyonel + geometri karışık LGS soruları",
          ],
          studentTasks: [
            "Haftada 20 geometri + 15 cebir sorusu",
            "2 tam deneme matematik bölümü",
            "Yanlış defteri güncelle",
          ],
          test: {
            label: "Geometri-cebir ara sınav",
            description: "15 soru — üçgen, eşitsizlik, cebirsel ifade",
            questionCount: 15,
            passScore: 10,
            format: "Geometri + cebir",
          },
          onPass: {
            headline: "Go next → Deneme yoğunlaştırma",
            detail: "≥10/15: Orta dönem hedefi tuttu. Haftalık deneme rutinine geç.",
          },
          onFail: {
            weakArea: "Üçgen eşitsizliği veya cebirsel sadeleştirme",
            temperamentNote:
              "Geometride şekil çizmeden çözmeye çalışıyor olabilir — her soruda şekil çizme zorunluluğu koy.",
            teacherAction:
              "Zayıf konuyu 1 derste yoğunlaştır; şekil + 8 soru",
            studentRetry: [
              "Zayıf konu: 15 soruluk set",
              "5 soruyu şekilli çözüm defterine yaz",
            ],
          },
        },
        {
          id: "cp-deneme-rutini",
          title: "Deneme rutini & net takibi",
          weekRange: "Ay 5–6",
          status: "exam",
          teacherFocus: [
            "Haftalık tam LGS denemesi + matematik net analizi",
            "Devirli ondalık tekrarını deneme yanlışlarından besle",
            "Nisa ile net hedefi belirle (haftalık +1 net)",
          ],
          studentTasks: [
            "Haftada 1 tam LGS denemesi",
            "Matematik net hedefi: haftalık +0.5–1 net",
            "Tüm konulardan karışık 20 soru/gün (son 2 hafta)",
          ],
          test: {
            label: "6 aylık genel değerlendirme",
            description: "20 soru — tüm 8. sınıf konuları LGS simülasyonu",
            questionCount: 20,
            passScore: 14,
            format: "LGS matematik simülasyonu",
          },
          onPass: {
            headline: "Go next → Faz 3 (son sprint)",
            detail:
              "≥14/20: 6 aylık plan başarılı. Son sprint ve tam tekrara geç.",
          },
          onFail: {
            weakArea: "Karışık konu / zaman yönetimi",
            temperamentNote:
              "Deneme kaygısı olabilir — net kaybını konu bazlı göster; 'şu 2 konuya 1 hafta' somut plan ver.",
            teacherAction:
              "Deneme analizi: en çok düşülen 2 konu; 2 haftalık yoğunlaştırılmış plan + devirli tekrar",
            studentRetry: [
              "Zayıf 2 konu × 20 soru",
              "1 deneme sadece matematik zamanlı (40 dk)",
              "Haftalık plan revizyonu — Nisa ile birlikte yaz",
            ],
          },
        },
      ],
    },
    {
      id: "phase-3",
      label: "Faz 3",
      months: "Ay 6–8",
      goal: "Tam tekrar, zayıf konu kapanışı, LGS sprint",
      checkpoints: [
        {
          id: "cp-sprint",
          title: "LGS matematik sprint",
          weekRange: "Ay 6–8",
          status: "exam",
          teacherFocus: [
            "Tüm konulardan çıkmış soru maratonu",
            "Devirli ondalık + veri işleme son tekrar (demo zayıflıkları)",
            "Sınav günü stratejisi ve süre yönetimi",
          ],
          studentTasks: [
            "Günlük 20 matematik sorusu (son 8 hafta)",
            "Haftada 2 tam deneme",
            "Tüm konulardan 1 sayfalık formül özeti",
          ],
          test: {
            label: "LGS öncesi final simülasyonu",
            description: "20 soru — gerçek LGS süresi ve zorluğu",
            questionCount: 20,
            passScore: 16,
            format: "LGS matematik final",
          },
          onPass: {
            headline: "Roadmap complete — sınav hazır",
            detail:
              "≥16/20: Nisa LGS matematik için hazır profilde. Son 2 hafta hafif tekrar + deneme.",
          },
          onFail: {
            weakArea: "Son tekrar / eksik kazanım",
            temperamentNote:
              "Panik yerine somut plan — 'son 10 günde şu 3 kazanım' listesi; denklem gücünü hatırlatarak özgüven ver.",
            teacherAction:
              "Final deneme analizi: max 3 zayıf kazanım; günlük 5 soru × 3 kazanım",
            studentRetry: [
              "3 zayıf kazanım × 5 soru/gün",
              "Devirli ondalık formül kartı son tekrar",
              "Hafif tempo — düzenli uyku ve çalışma dengesi",
            ],
          },
        },
      ],
    },
  ],
};
