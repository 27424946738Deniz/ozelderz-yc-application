import fs from "fs";
import path from "path";
import {
  getPresignedMediaUrl,
  loadEnvFile,
  objectExists,
  uploadFileToR2,
} from "../lib/r2";

const ROOT = process.cwd();
const DOWNLOADS = "/Users/bourbaki/Downloads";
const MEET_RE = /^([a-z]{3}-[a-z]{4}-[a-z]{3}) \(/;

function findMeetVideos(): Array<{ meetCode: string; localPath: string }> {
  return fs
    .readdirSync(DOWNLOADS)
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => {
      const match = f.match(MEET_RE);
      if (!match) return null;
      return { meetCode: match[1], localPath: path.join(DOWNLOADS, f) };
    })
    .filter((x): x is { meetCode: string; localPath: string } => x !== null)
    .sort((a, b) => a.meetCode.localeCompare(b.meetCode));
}

async function main() {
  loadEnvFile();

  const videos = findMeetVideos();
  if (videos.length === 0) {
    console.log("Meet formatında video bulunamadı.");
    return;
  }

  console.log(`${videos.length} video bulundu.\n`);

  const results: Array<{
    meetCode: string;
    key: string;
    localPath: string;
    sizeMb: number;
    status: "uploaded" | "skipped";
  }> = [];

  for (const { meetCode, localPath } of videos) {
    const key = `lessons/${meetCode}.mp4`;
    const sizeMb =
      Math.round((fs.statSync(localPath).size / 1024 / 1024) * 10) / 10;

    console.log(`\n--- ${meetCode} (${sizeMb} MB) ---`);

    const exists = await objectExists(key);
    if (exists) {
      console.log(`Zaten var: ${key} — atlanıyor.`);
      results.push({ meetCode, key, localPath, sizeMb, status: "skipped" });
      continue;
    }

    await uploadFileToR2(localPath, key);
    results.push({ meetCode, key, localPath, sizeMb, status: "uploaded" });
  }

  const batchPath = path.join(ROOT, "data/r2-media-batch.json");
  const existing = fs.existsSync(batchPath)
    ? (JSON.parse(fs.readFileSync(batchPath, "utf8")) as {
        bucket: string;
        lessons: Array<{ meetCode: string; key: string; localPath: string; sizeMb: number }>;
      })
    : { bucket: process.env.R2_BUCKET_NAME, lessons: [] };

  const byMeet = new Map(existing.lessons.map((l) => [l.meetCode, l]));
  for (const r of results) {
    byMeet.set(r.meetCode, {
      meetCode: r.meetCode,
      key: r.key,
      localPath: r.localPath,
      sizeMb: r.sizeMb,
    });
  }

  const batch = {
    bucket: process.env.R2_BUCKET_NAME,
    uploadedAt: new Date().toISOString(),
    lessons: [...byMeet.values()].sort((a, b) =>
      a.meetCode.localeCompare(b.meetCode)
    ),
  };

  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), "utf8");

  const uploaded = results.filter((r) => r.status === "uploaded").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  console.log(`\nTamam: ${uploaded} yüklendi, ${skipped} atlandı.`);
  console.log(`Manifest: ${batchPath}`);
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
