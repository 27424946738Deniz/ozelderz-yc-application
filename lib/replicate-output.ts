export async function readReplicateJsonOutput(output: unknown): Promise<unknown> {
  if (typeof output === "string" && output.startsWith("http")) {
    const response = await fetch(output);
    if (!response.ok) {
      throw new Error(`Replicate çıktısı alınamadı: ${response.status}`);
    }
    return response.json();
  }

  if (
    output &&
    typeof output === "object" &&
    "toString" in output &&
    typeof (output as { toString: () => string }).toString === "function"
  ) {
    const url = (output as { toString: () => string }).toString();
    if (url.startsWith("http")) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Replicate çıktısı alınamadı: ${response.status}`);
      }
      return response.json();
    }
  }

  return output;
}
