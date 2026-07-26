import type { LessonRoadmap } from "@/types/roadmap";

export const wtyRoadmap: LessonRoadmap = {
  lessonId: "wty-msyi-khr",
  title: "İnkılap Tarihi — Kayra Yol Haritası",
  subject: "İnkılap Tarihi ve Atatürkçülük",
  teacher: {
    name: "Mustafa Arda Andirlik",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mustafa",
    title: "İnkılap Tarihi Öğretmeni",
  },
  student: {
    name: "Kayra Mete Özcan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kayra",
    grade: "8. Sınıf",
    learningStyle: "Sorgulayıcı-Görsel Öğrenen",
    temperamentSignals: [
      "Kaynak ve PDF soruyor — somut materyal olmadan soyut anlatımda pasifleşiyor",
      "LGS soru dağılımı ve net hedefi konuşulunca ilgisi artıyor",
      "Spor/takım deneyiminden örneklerle bağ kurulunca daha açık yanıt veriyor",
      "Uzun teorik bloklarda kısa onaylarla geçiyor — 8–10 dk'da bir soru şart",
    ],
  },
  introLessonInsights: [
    "Tanışma dersinde 7 ünite ve LGS'de 10 soruluk dağılım netleştirildi.",
    "1. ünite (Atatürk hayatı) ve 2. ünite (Milli Uyanış) her yıl 2–3 soru getiriyor — öncelik burada.",
    "Kayra fen lisesi hedefi ve deneme kulübü planından bahsetti; hedef odaklı ilerleme uygun.",
    "Transkriptte görsel materyal (PDF, harita, MEB testi) planı öğrenci profiline uygun.",
  ],
  generatedFrom: "Tanışma Dersi — wty-msyi-khr transkripti",
  phases: [
    {
      id: "phase-1",
      label: "Faz 1",
      months: "Ay 1–3",
      goal: "Temel yapı, 1.–2. ünite, LGS çerçevesi ve çalışma ritmi",
      checkpoints: [
        {
          id: "cp-intro",
          title: "Tanışma & çalışma sistemi",
          weekRange: "Hafta 1–2",
          status: "foundation",
          teacherFocus: [
            "Haftalık plan ve WhatsApp grubunu netleştir",
            "LGS'de 10 soru / 7 ünite dağılımını tablo ile göster",
            "Kayra'nın fen lisesi hedefini programa bağla",
          ],
          studentTasks: [
            "Haftalık planı takvime işaretle",
            "MEB kazanım listesini PDF olarak indir",
            "İlk deneme İnkılap bölümünü çöz (sadece tespit)",
          ],
          test: {
            label: "Başlangıç teşhis testi",
            description: "10 soruluk karışık LGS formatı — seviye tespiti, not verilmez",
            questionCount: 10,
            passScore: 4,
            format: "MEB kazanım karışık",
          },
          onPass: {
            headline: "Go next → 1. ünite girişi",
            detail:
              "Kayra en az 4 doğru yaptıysa temel kavramlar oturmuş demektir; 1. ünite konu anlatımına geç.",
          },
          onFail: {
            weakArea: "Genel LGS İnkılap çerçevesi / temel kavramlar",
            temperamentNote:
              "Kayra sorgulayıcı profil — 'neden 10 soru?' sorusunu LGS dağılım tablosuyla cevapla; ezber değil harita göster.",
            teacherAction:
              "15 dk görsel özet: 7 ünite + yıllık soru sayısı infografiği; ardından 5 kolay doğru-yanlış",
            studentRetry: [
              "Ünite-soru dağılım tablosunu 3 kez gözden geçir",
              "5 kolay MEB kazanım sorusu (sadece 1. ünite ön bilgi)",
            ],
          },
        },
        {
          id: "cp-unit1",
          title: "1. Ünite — Bir Kahraman Doğuyor (Atatürk)",
          weekRange: "Hafta 3–6",
          status: "core",
          teacherFocus: [
            "Osmanlı son dönem + Atatürk'ün hayatı kronolojisi",
            "Her 8 dk'da Kayra'ya somut soru (transkript önerisi)",
            "PDF konu özeti + çıkmış soru örnekleri paylaş",
          ],
          studentTasks: [
            "1. ünite konu anlatım PDF'i (max 20 dk/gün)",
            "Haftalık 15 MEB kazanım sorusu",
            "Kronoloji çizelgesi çıkar (10 kilit tarih)",
          ],
          test: {
            label: "1. ünite kontrol testi",
            description: "MEB kazanım formatında 12 soru — Atatürk hayatı ve dönem",
            questionCount: 12,
            passScore: 8,
            format: "Ünite 1 kazanım",
          },
          onPass: {
            headline: "Go next → 2. ünite (Milli Uyanış)",
            detail:
              "≥8/12 doğru: 1. ünite oturdu. 2. üniteye geç; Samsun çıkışı ve kongreler hattına gir.",
          },
          onFail: {
            weakArea: "Atatürk kronolojisi veya Osmanlı son dönem bağlantısı",
            temperamentNote:
              "Kayra kronoloji ezberinde zorlanıyor — hikâye anlatımı + spor benzetmesi ('maç planı gibi sıra') kullan.",
            teacherAction:
              "Yanlış yapılan alt başlığı tespit et (ör. Selanik-çocukluk vs askerlik yılları); 10 dk görsel timeline ile tekrar",
            studentRetry: [
              "Yanlış konudan 8 soruluk mini set",
              "3 dk'lık kronoloji videosu + 5 tarih kartı",
              "Mustafa Hoca ile 15 dk birebir tekrar (sadece zayıf alt başlık)",
            ],
          },
        },
        {
          id: "cp-unit2-start",
          title: "2. Ünite — Milli Uyanış (giriş)",
          weekRange: "Hafta 7–12",
          status: "core",
          teacherFocus: [
            "19 Mayıs / Samsun çıkışı ve kongreler zinciri",
            "Harita üzerinde göster — görsel öğrenen profiline uygun",
            "İlk mini deneme İnkılap parçası analizi",
          ],
          studentTasks: [
            "2. ünite ilk yarı konu anlatımı",
            "Harita üzerinde 5 kilit olay işaretle",
            "1 parça deneme İnkılap + yanlış analizi",
          ],
          test: {
            label: "2. ünite ara kontrol",
            description: "10 soru — Milli Uyanış giriş + 1. ünite tekrar karışık",
            questionCount: 10,
            passScore: 7,
            format: "Ünite 1–2 karışık",
          },
          onPass: {
            headline: "Go next → Faz 2 (Ay 3–6)",
            detail:
              "≥7/10: Faz 1 tamamlandı. 3–6. ayda 3.–5. üniteler ve deneme rutinine geç.",
          },
          onFail: {
            weakArea: "Milli Uyanış olay zinciri veya 1. ünite karışık tekrar",
            temperamentNote:
              "Uzun anlatım bloklarında dikkat dağılıyor — 2. üniteyi 4 parçaya böl, her parçada mini quiz.",
            teacherAction:
              "Hangi soru tipinde düştüğünü işaretle (tarih sıralama / kavram / yorum); o tip için 6 soruluk set",
            studentRetry: [
              "Zayıf alt başlık: sadece kongreler veya sadece Samsun hattı",
              "Kaynak PDF'ten ilgili 2 sayfa + 6 soru",
              "Haftalık planda +1 kısa tekrar seansı",
            ],
          },
        },
      ],
    },
    {
      id: "phase-2",
      label: "Faz 2",
      months: "Ay 3–6",
      goal: "3.–5. üniteler, deneme ritmi, paragraf + İnkılap entegrasyonu",
      checkpoints: [
        {
          id: "cp-unit3-4",
          title: "3.–4. Ünite — Milli Mücadele & Cumhuriyet",
          weekRange: "Ay 3–4",
          status: "core",
          teacherFocus: [
            "TBMM, cepheler, Lozan, inkılaplar girişi",
            "Her derste 2 çıkmış LGS sorusu çöz",
            "Kayra'ya 'hangi üniteden kaç soru' hedef tablosu güncelle",
          ],
          studentTasks: [
            "3. ve 4. ünite MEB testleri (haftada 20 soru)",
            "2 tam deneme İnkılap bölümü analizi",
            "Yanlış defteri: konu + soru tipi",
          ],
          test: {
            label: "Ünite 3–4 ara sınav",
            description: "15 soru — Milli Mücadele + İnkılaplar temel",
            questionCount: 15,
            passScore: 10,
            format: "Ünite 3–4",
          },
          onPass: {
            headline: "Go next → 5. ünite + deneme yoğunlaştırma",
            detail: "≥10/15: Orta dönem hedefi tuttu. 5. ünite ve haftalık deneme planına geç.",
          },
          onFail: {
            weakArea: "Cepheler / antlaşmalar / inkılap kavramları",
            temperamentNote:
              "Kayra kaynak odaklı — hangi MEB testinden düştüğünü göster; 'şu PDF sayfa X' ile somutlaştır.",
            teacherAction:
              "Antlaşma veya cephe alt konusunu 1 derste yoğunlaştır; tablo + 8 soru",
            studentRetry: [
              "Zayıf alt konu: 10 soruluk hedefli set",
              "Çıkmış 3 yıl LGS sorusu aynı kazanımdan",
              "15 dk birebir — sadece yanlış kazanım",
            ],
          },
        },
        {
          id: "cp-unit5-6",
          title: "5.–6. Ünite + deneme rutini",
          weekRange: "Ay 5–6",
          status: "exam",
          teacherFocus: [
            "Atatürk dönemi ve çağdaş Türkiye",
            "Haftalık deneme + net takibi",
            "Kayra ile deneme kulübü planını netleştir",
          ],
          studentTasks: [
            "Haftada 1 tam LGS denemesi",
            "İnkılap net hedefi: haftalık +0.5 net",
            "6. ünite konu tekrarı + çıkmış sorular",
          ],
          test: {
            label: "6 aylık genel değerlendirme",
            description: "20 soru — 1.–6. ünite karışık LGS simülasyonu",
            questionCount: 20,
            passScore: 14,
            format: "Tam LGS İnkılap simülasyonu",
          },
          onPass: {
            headline: "Go next → Faz 3 (son sprint)",
            detail:
              "≥14/20: 6 aylık plan başarılı. 7. ünite + tam tekrar ve sınav stratejisine geç.",
          },
          onFail: {
            weakArea: "Karışık ünite soruları / zaman yönetimi",
            temperamentNote:
              "Hedef odaklı profil — net kaybını ünite bazlı göster; 'şu 2 üniteye 1 hafta ayır' de.",
            teacherAction:
              "Deneme analizi: en çok düşülen 2 üniteyi belirle; 2 haftalık yoğunlaştırılmış plan",
            studentRetry: [
              "Zayıf 2 ünite için 20'şer soruluk set",
              "1 deneme sadece İnkılap zamanlı (20 dk)",
              "Haftalık plan revizyonu — Kayra ile birlikte yaz",
            ],
          },
        },
      ],
    },
    {
      id: "phase-3",
      label: "Faz 3",
      months: "Ay 6–8",
      goal: "7. ünite, tam tekrar, LGS sprint",
      checkpoints: [
        {
          id: "cp-sprint",
          title: "7. ünite + LGS sprint",
          weekRange: "Ay 6–8",
          status: "exam",
          teacherFocus: [
            "7. ünite + tüm ünitelerden çıkmış soru maratonu",
            "Sınav günü stratejisi ve süre yönetimi",
            "Kayra motivasyonu: fen lisesi hedefi hatırlatma",
          ],
          studentTasks: [
            "Günlük 15 İnkılap sorusu (son 8 hafta)",
            "Haftada 2 deneme",
            "Tüm ünitelerden 1 sayfalık özet",
          ],
          test: {
            label: "LGS öncesi final simülasyonu",
            description: "10 soru — gerçek LGS süresi ve zorluğu",
            questionCount: 10,
            passScore: 8,
            format: "LGS final",
          },
          onPass: {
            headline: "Roadmap complete — sınav hazır",
            detail:
              "≥8/10: Kayra LGS İnkılap için hazır profilde. Son 2 hafta hafif tekrar + deneme.",
          },
          onFail: {
            weakArea: "Son tekrar / eksik kazanım",
            temperamentNote:
              "Panik yerine somut plan — 'son 10 günde şu 3 kazanım' listesi ver; görsel checklist.",
            teacherAction:
              "Final deneme analizi: max 3 zayıf kazanım; günlük 5 soru × 3 kazanım",
            studentRetry: [
              "3 zayıf kazanım × 5 soru/gün",
              "1 sayfalık kronoloji posteri",
              "Hafif tempo — uyku ve denge (spor rutinini koru)",
            ],
          },
        },
      ],
    },
  ],
};
