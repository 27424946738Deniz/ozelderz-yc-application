import type { LearningStyleAnalysis } from "@/types";
import type { LessonGap } from "@/lib/lesson-gaps";

const TACTIC_LIBRARY: Record<
  string,
  (fn: string, subject: string) => { title: string; tactic: string }
> = {
  minimal_voice: (fn) => ({
    title: "İlk turda ses alma protokolü",
    tactic: `Dersin ilk 3 dakikasında ${fn}'ya sırayla 2 açık uçlu soru sor (hobi, zorlandığı konu). Kısa yanıt gelirse "bir cümle daha ekle" de — konuşma alışkanlığı oluşana kadar her derste bu ritüeli tekrarla.`,
  }),
  low_participation: (fn) => ({
    title: "Konuşma kotası",
    tactic: `Her 10 dakikada ${fn}'nın en az 2 dakika konuşmasını hedefle. Bunun için "sen anlat" görevleri ver: bir örneği çözmesini iste, bir kuralı kendi cümlesiyle açıklamasını iste.`,
  }),
  moderate_participation: (fn) => ({
    title: "Pasiften aktife geçiş",
    tactic: `${fn}'yı dinleyici olmaktan çıkarmak için her konu bloğunda 1 mini görev koy: tahtaya yaz, örneği seç, hatayı bul. Küçük sorumluluklar katılımı kademeli artırır.`,
  }),
  teacher_dominance: (fn, subject) => ({
    title: "Öğrenci-öğretmen rol değişimi",
    tactic: `15 dakikalık bloklarda 5 dk ${fn} anlatsın, 10 dk sen destekle. "${subject} konusunu bir arkadaşına anlatıyor gibi anlat" formatı öğretmen monoloğunu kırar.`,
  }),
  surface_responses: (fn) => ({
    title: "Derinleştirme soruları",
    tactic: `"Evet/hayır" yanıtlarını kabul etme. Her kısa yanıttan sonra "neden?", "nasıl emin oldun?", "başka nasıl olabilirdi?" sorularından birini zorunlu takip et.`,
  }),
  no_elaboration: (fn) => ({
    title: "Düşünme sesli hale getirme",
    tactic: `${fn}'dan çözümü sadece yapmasını değil, adımları sesli anlatmasını iste. "Şu an ne düşünüyorsun?" sorusunu takıldığı her noktada kullan — uzun yanıt kası kaslanır.`,
  }),
  low_curiosity: (fn) => ({
    title: "Merak tetikleyicileri",
    tactic: `Konuya girmeden önce çelişkili veya şaşırtıcı bir örnek göster, ${fn}'ya "bu neden böyle?" diye sor. Merak oluşmadan soru sormayan öğrencide dış tetikleyici gerekir.`,
  }),
  questions_without_depth: (fn) => ({
    title: "Soru kalitesini yükseltme",
    tactic: `${fn} soru sorduğunda hemen cevap verme — "bu soruyu biraz daha netleştir" de. Soruyu yeniden formüle ettirmek yüzeysel soru alışkanlığını derin sorgulamaya çevirir.`,
  }),
  unresolved_struggle: (fn, subject) => ({
    title: "Boşluk kapatma protokolü",
    tactic: `Sonraki derse ${fn}'nın takıldığı ${subject} konusuyla başla; önce 3 kolay örnek, sonra 2 orta, en son 1 zor. Her seviyede başarı yaşat — boşluk kapanmadan yeni konu ekleme.`,
  }),
  exam_anxiety: (fn) => ({
    title: "Kaygıyı öğrenmeye kanalize etme",
    tactic: `Sınav baskısını azaltmak için küçük kazanımları kutla. ${fn}'ya "bugün şunu çözdün" listesi tut; net hedefi büyük değil haftalık küçük adımlara böl.`,
  }),
  practice_without_comprehension: (fn) => ({
    title: "Anlama-uygulama dengesi",
    tactic: `Her 5 soruluk setten önce 1 kavram sorusu sor: "bu kural ne zaman işe yarar?" Uygulama öncesi 30 sn'lik kavram teyidi, kör çözüm döngüsünü kırar.`,
  }),
  missing_visual_scaffolding: () => ({
    title: "Görsel araç zorunluluğu",
    tactic: `Her yeni kavramda en az 1 görsel araç kullan: sayı doğrusu, tablo veya grafik. Soyut anlatım yerine önce görsel, sonra sembol — matematikte bu sıra kritik.`,
  }),
  chronology_struggle: (fn) => ({
    title: "Hikâye-önce, tarih-sonra",
    tactic: `${fn} için kronoloji tablosu verme. Önce olay örgüsünü anlat, "ne oldu → neden oldu → sonuç ne" zinciri kur; tarihleri en son 3-5 maddelik özet olarak bırak.`,
  }),
  no_goal_anchor: (fn) => ({
    title: "Hedef köprüsü",
    tactic: `Her konunun başında ${fn}'nın hedefine bağla: "Bu konu LGS'de X soru geliyor, senin hedefin Y net — bu ders o hedefe şu kadar yaklaştırır." Motivasyon somut hedefe bağlanmalı.`,
  }),
  false_checkins: (fn) => ({
    title: "Gerçek anlama ölçümü",
    tactic: `"Anladın mı?" yerine ${fn}'ya mini uygulama yaptır: 1 örnek çözdür veya kavramı kendi cümlesiyle özetlet. Doğru yaparsa anlamış demektir — onay yanıtı yetmez.`,
  }),
  tanisma_no_roadmap: (fn) => ({
    title: "Tanışmadan plana geçiş",
    tactic: `Tanışma dersinin son 5 dakikasında ${fn} ile birlikte 3 maddelik çalışma planı yaz: haftalık ders saati, hedef net, kullanılacak kaynak. Planı WhatsApp'ta paylaş — sonraki ders bu plana referansla başlasın.`,
  }),
};

export function generateTeachingTactics(
  gaps: LessonGap[],
  studentName: string,
  subject: string
): LearningStyleAnalysis["approachGuide"] {
  const fn = studentName.split(" ")[0];
  const tactics: LearningStyleAnalysis["approachGuide"] = [];

  for (const gap of gaps) {
    const builder = TACTIC_LIBRARY[gap.id];
    if (!builder) continue;
    const { title, tactic } = builder(fn, subject);
    tactics.push({
      title,
      gap: gap.observation,
      tactic,
    });
  }

  return tactics;
}
