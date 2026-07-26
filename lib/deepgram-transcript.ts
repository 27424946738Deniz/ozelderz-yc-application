import type { TranscriptData, TranscriptSegment, TranscriptWord } from "@/types/transcript";

type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  speaker?: number;
  confidence?: number;
  punctuated_word?: string;
};

type DeepgramUtterance = {
  start: number;
  end: number;
  transcript: string;
  speaker?: number;
  words?: DeepgramWord[];
};

type DeepgramResponse = {
  metadata?: { duration?: number };
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        words?: DeepgramWord[];
      }>;
    }>;
    utterances?: DeepgramUtterance[];
  };
};

function speakerLabel(id: number | undefined): string | undefined {
  if (id === undefined) return undefined;
  return `SPEAKER_${String(id).padStart(2, "0")}`;
}

function mapWord(w: DeepgramWord): TranscriptWord {
  return {
    word: (w.punctuated_word ?? w.word).trim(),
    start: w.start,
    end: w.end,
    speaker: speakerLabel(w.speaker),
  };
}

function buildFromUtterances(
  utterances: DeepgramUtterance[],
  language: string
): TranscriptData {
  const segments: TranscriptSegment[] = utterances.map((u) => {
    const words = (u.words ?? []).map(mapWord);
    return {
      start: u.start,
      end: u.end,
      text: u.transcript.trim(),
      speaker: speakerLabel(u.speaker),
      words,
    };
  });

  const words = segments.flatMap((s) => s.words);
  const speakers = [
    ...new Set(words.map((w) => w.speaker).filter(Boolean)),
  ] as string[];

  return {
    source: "deepgram-nova-3",
    language,
    duration: segments.at(-1)?.end ?? words.at(-1)?.end ?? 0,
    speakers,
    segments,
    words,
    generatedAt: new Date().toISOString(),
  };
}

function buildFromWords(wordsRaw: DeepgramWord[], language: string): TranscriptData {
  const words = wordsRaw.map(mapWord).filter((w) => w.word.length > 0);
  const segments: TranscriptSegment[] = [];
  let current: TranscriptSegment | null = null;

  for (const word of words) {
    const sameSpeaker = current?.speaker === word.speaker;
    const gap = current ? word.start - current.end : 0;
    if (!current || !sameSpeaker || gap > 1.5) {
      if (current) segments.push(current);
      current = {
        start: word.start,
        end: word.end,
        text: word.word,
        speaker: word.speaker,
        words: [word],
      };
    } else {
      current.end = word.end;
      current.text = `${current.text} ${word.word}`.trim();
      current.words.push(word);
    }
  }
  if (current) segments.push(current);

  const speakers = [
    ...new Set(words.map((w) => w.speaker).filter(Boolean)),
  ] as string[];

  return {
    source: "deepgram-nova-3",
    language,
    duration: segments.at(-1)?.end ?? words.at(-1)?.end ?? 0,
    speakers,
    segments,
    words,
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeDeepgramResponse(
  raw: DeepgramResponse,
  language = "tr"
): TranscriptData {
  const utterances = raw.results?.utterances;
  if (utterances?.length) {
    const result = buildFromUtterances(utterances, language);
    if (raw.metadata?.duration) {
      result.duration = raw.metadata.duration;
    }
    return result;
  }

  const words = raw.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  if (!words.length) {
    throw new Error("Deepgram yanıtında kelime/utterance bulunamadı");
  }

  const result = buildFromWords(words, language);
  if (raw.metadata?.duration) {
    result.duration = raw.metadata.duration;
  }
  return result;
}
