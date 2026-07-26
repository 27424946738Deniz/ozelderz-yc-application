import fs from "fs";
import path from "path";
import Replicate from "replicate";
import { getPresignedMediaUrl, loadEnvFile } from "../lib/r2";
import {
  applyDiarizationToTranscript,
  normalizeDiarizationOutput,
} from "../lib/diarization";
import { readReplicateJsonOutput } from "../lib/replicate-output";

const ROOT = process.cwd();
const R2_KEY = process.argv[2] ?? process.env.LESSON_R2_KEY;
const TRANSCRIPT_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "data/transcript.json");
const DIARIZATION_RAW_PATH = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.join(ROOT, "data/diarization-raw.json");
const PYANNOTE_DIARIZATION =
  "meronym/speaker-diarization:64b78c82f74d78164b49178443c819445f5dca2c51c8ec374783d49382342119";

loadEnvFile();

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN bulunamadı");
  }
  if (!R2_KEY) {
    throw new Error("R2 key gerekli: LESSON_R2_KEY veya argv[2]");
  }
  if (!fs.existsSync(TRANSCRIPT_PATH)) {
    throw new Error(`Transkript bulunamadı: ${TRANSCRIPT_PATH}`);
  }

  const transcript = JSON.parse(fs.readFileSync(TRANSCRIPT_PATH, "utf8"));
  const mediaUrl = await getPresignedMediaUrl(R2_KEY);
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  console.log(`Pyannote diarization başlıyor: ${R2_KEY}`);
  const output = await replicate.run(PYANNOTE_DIARIZATION, {
    input: { audio: mediaUrl },
  });

  const raw = await readReplicateJsonOutput(output);
  fs.mkdirSync(path.dirname(DIARIZATION_RAW_PATH), { recursive: true });
  fs.writeFileSync(DIARIZATION_RAW_PATH, JSON.stringify(raw, null, 2), "utf8");

  const diarization = normalizeDiarizationOutput(
    raw as Parameters<typeof normalizeDiarizationOutput>[0]
  );

  if (diarization.speakers.length < 2) {
    console.warn(
      `\nPyannote yalnızca ${diarization.speakers.length} konuşmacı buldu — wty dersinde 2 bulunmuştu.`
    );
    console.warn(
      "Pause-diarization sonucu korunuyor (Pyannote bu videoda yetersiz)."
    );
    console.log(`- Dosya değişmedi: ${TRANSCRIPT_PATH}`);
    return;
  }

  const enriched = applyDiarizationToTranscript(transcript, diarization);

  fs.mkdirSync(path.dirname(TRANSCRIPT_PATH), { recursive: true });
  fs.writeFileSync(TRANSCRIPT_PATH, JSON.stringify(enriched, null, 2), "utf8");

  console.log("\nDiarization uygulandı:");
  console.log(`- Kaynak: ${enriched.source}`);
  console.log(`- Konuşmacılar: ${enriched.speakers.join(", ")}`);
  console.log(`- Pyannote segment: ${diarization.segments.length}`);
  console.log(`- Dosya: ${TRANSCRIPT_PATH}`);
  console.log(`- Ham diarization: ${DIARIZATION_RAW_PATH}`);

  console.log("\nİlk 5 kelime:");
  for (const w of enriched.words.slice(0, 5)) {
    console.log(
      `  [${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.speaker}: ${w.word}`
    );
  }
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
