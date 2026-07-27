const TEACHER_PHOTOS: Record<string, string> = {
  "ahmet baştuğ": "https://images.ozelderz.com/hocalar/temp_w83ex_1775159190124.jpg",
  "ayşegül dinçer": "https://images.ozelderz.com/hocalar/207_1774961821440.jpg",
  "barış öztürk": "https://images.ozelderz.com/hocalar/temp_subeyo_1783321715006.jpeg",
  "burak çınar": "https://images.ozelderz.com/hocalar/temp_76eobg_1772435855524.jpg",
  "büşra çelik": "https://images.ozelderz.com/hocalar/temp_wvnbkd_1777221370324.jpg",
  "ceren nur sarıkavak": "https://images.ozelderz.com/hocalar/temp_1iz4c6_1778957998222.jpg",
  "emine nur pınar": "https://pub-e9746fd3c59d479f924589177ae87857.r2.dev/hocalar/28_1767728146429.jpg",
  "fatma nur yıldırım": "https://images.ozelderz.com/hocalar/temp_ymrmgg_1772391627146.png",
  "hasan karabela": "https://images.ozelderz.com/hocalar/temp_eqzz5_1769774985871.jpg",
  "mehmet alioğlu": "https://images.ozelderz.com/hocalar/94_1775012260716.jpg",
  "melisa kıroğlu": "https://pub-e9746fd3c59d479f924589177ae87857.r2.dev/hocalar/12_1767788374144.jpg",
  "muhammed korhan": "https://images.ozelderz.com/hocalar/temp_4kcb1b_1772436520284.jpeg",
  "mustafa ardahan dirlik": "https://images.ozelderz.com/hocalar/temp_p9m377_1775383413595.jpg",
  "mustafa enes kırtış": "https://images.ozelderz.com/hocalar/temp_bxvz1_1775159185002.jpeg",
  "nursima başaran": "https://images.ozelderz.com/hocalar/598_1779018885496.jpg",
  "osman kandemir": "https://pub-e9746fd3c59d479f924589177ae87857.r2.dev/hocalar/95_1767781268551.jpeg",
  "rabia arife aslan": "https://images.ozelderz.com/hocalar/temp_nwz95l_1770225772656.jpg",
  "rümeysa geçer": "https://images.ozelderz.com/hocalar/temp_6mmwpq_1772899843363.jpeg",
  "serhat cinoğlu": "https://images.ozelderz.com/hocalar/temp_lyt91_1778525930168.jpg",
  "sude başkaya": "https://images.ozelderz.com/hocalar/162_1781030474777.jpeg",
  "yaren yalım": "https://images.ozelderz.com/hocalar/temp_gudb12c_1780987863703.jpeg",
  "yiğit sakur": "https://images.ozelderz.com/hocalar/temp_v8lik_1781895895665.jpg",
  "zeynep oral": "https://images.ozelderz.com/hocalar/temp_8rd6xn_1772391166170.png",
  "zübeyde hakyoldaş": "https://images.ozelderz.com/hocalar/27_1767967501069.jpeg",
  "elif ece kılboz": "https://images.ozelderz.com/hocalar/temp_zotmdt_1772392093589.jpg",
  "muhammed bozboğa": "https://images.ozelderz.com/hocalar/temp_b19z3l_1777228582441.png",
  "serpil çalışkanoğlu": "https://images.ozelderz.com/hocalar/temp_amyyoh_1773243955204.png",
  "ilkay sevilmiş": "https://images.ozelderz.com/hocalar/33_1773101688015.jpg",
};

function normalizeTeacherName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function compactName(name: string): string {
  return normalizeTeacherName(name).replace(/\s/g, "");
}

export function getTeacherPhoto(name: string): string | null {
  const key = normalizeTeacherName(name);
  if (TEACHER_PHOTOS[key]) return TEACHER_PHOTOS[key];

  const compact = compactName(name);
  for (const [k, url] of Object.entries(TEACHER_PHOTOS)) {
    if (compactName(k) === compact) return url;
  }
  return null;
}

export function resolveTeacherAvatar(name: string, fallbackSeed?: string): string {
  return (
    getTeacherPhoto(name) ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed ?? name)}`
  );
}
