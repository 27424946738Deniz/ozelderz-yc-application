import fs from "fs";
import path from "path";
import {
  getPresignedMediaUrl,
  loadEnvFile,
  objectExists,
  uploadFileToR2,
} from "../lib/r2";

const ROOT = process.cwd();
const DEFAULT_LOCAL_FILE =
  "/Users/bourbaki/Downloads/wty-msyi-khr (2026-07-23 07_52 GMT).mp4";
const DEFAULT_R2_KEY = "lessons/wty-msyi-khr.mp4";

async function main() {
  loadEnvFile();

  const localPath = process.argv[2] ?? DEFAULT_LOCAL_FILE;
  const objectKey = process.argv[3] ?? DEFAULT_R2_KEY;

  if (!fs.existsSync(localPath)) {
    throw new Error(`Dosya bulunamadı: ${localPath}`);
  }

  const exists = await objectExists(objectKey);
  if (exists) {
    console.log(`R2'de zaten var: ${objectKey} — yeniden yüklenmiyor.`);
  } else {
    await uploadFileToR2(localPath, objectKey);
    console.log("Yükleme tamam.");
  }

  const presignedUrl = await getPresignedMediaUrl(objectKey);
  const metaPath = path.join(ROOT, "data/r2-media.json");
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        bucket: process.env.R2_BUCKET_NAME,
        key: objectKey,
        localPath,
        presignedUrl,
        uploadedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\nR2 bilgileri:");
  console.log(`- Bucket: ${process.env.R2_BUCKET_NAME}`);
  console.log(`- Key: ${objectKey}`);
  console.log(`- Meta: ${metaPath}`);
  console.log(`\nTranskript için .env.local'e ekle/güncelle:`);
  console.log(`LESSON_R2_KEY=${objectKey}`);
  console.log(`\nPresigned URL (24 saat geçerli):`);
  console.log(presignedUrl);
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
