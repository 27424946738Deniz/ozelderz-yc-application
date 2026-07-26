export type DiarizationSegment = {
  speaker: string;
  start: number;
  end: number;
};

export type DiarizationResult = {
  segments: DiarizationSegment[];
  speakers: string[];
};

export function parseDiarizationTime(value: string): number {
  const parts = value.split(":");
  if (parts.length !== 3) return 0;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

export function normalizeDiarizationOutput(raw: {
  segments?: Array<{ speaker?: string; start?: string; stop?: string }>;
  speakers?: { labels?: string[] };
}): DiarizationResult {
  const segments: DiarizationSegment[] = (raw.segments ?? []).map((seg) => ({
    speaker: seg.speaker ?? "UNKNOWN",
    start: parseDiarizationTime(seg.start ?? "0:0:0"),
    end: parseDiarizationTime(seg.stop ?? "0:0:0"),
  }));

  const labels = raw.speakers?.labels ?? [];
  const speakers = labels.length
    ? labels.map((label, i) => `SPEAKER_${String(i).padStart(2, "0")}`)
    : [...new Set(segments.map((s) => s.speaker))];

  const labelMap = Object.fromEntries(
    (raw.speakers?.labels ?? []).map((label, i) => [
      label,
      `SPEAKER_${String(i).padStart(2, "0")}`,
    ])
  );

  return {
    segments: segments.map((seg) => ({
      ...seg,
      speaker: labelMap[seg.speaker] ?? seg.speaker,
    })),
    speakers,
  };
}

export function assignSpeakerByOverlap(
  start: number,
  end: number,
  diarization: DiarizationSegment[]
): string | undefined {
  let bestSpeaker: string | undefined;
  let bestOverlap = 0;

  for (const seg of diarization) {
    const overlap =
      Math.max(0, Math.min(end, seg.end) - Math.max(start, seg.start));
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestSpeaker = seg.speaker;
    }
  }

  return bestSpeaker;
}

export function applyDiarizationToTranscript<
  T extends {
    segments: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
      words: Array<{
        word: string;
        start: number;
        end: number;
        speaker?: string;
      }>;
    }>;
    speakers: string[];
    source: string;
  },
>(transcript: T, diarization: DiarizationResult): T {
  const segments = transcript.segments.map((seg) => {
    const speaker =
      assignSpeakerByOverlap(seg.start, seg.end, diarization.segments) ??
      seg.speaker;

    return {
      ...seg,
      speaker,
      words: seg.words.map((word) => ({
        ...word,
        speaker:
          assignSpeakerByOverlap(word.start, word.end, diarization.segments) ??
          speaker,
      })),
    };
  });

  const words = segments.flatMap((s) => s.words);
  const speakers = [
    ...new Set(words.map((w) => w.speaker).filter(Boolean)),
  ] as string[];

  return {
    ...transcript,
    source: `${transcript.source}+pyannote-diarization`,
    speakers,
    segments,
    words: segments.flatMap((s) => s.words),
  };
}
