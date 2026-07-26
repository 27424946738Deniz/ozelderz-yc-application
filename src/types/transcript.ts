export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words: TranscriptWord[];
}

export interface TranscriptData {
  source: string;
  language?: string;
  duration: number;
  speakers: string[];
  segments: TranscriptSegment[];
  words: TranscriptWord[];
  generatedAt?: string;
}

export type HeatLevel = "hot" | "warm" | "neutral" | "cool" | "cold";

export interface HeatmapCell {
  start: number;
  end: number;
  value: number;
  level: HeatLevel;
  label: string;
  title?: string;
  segmentCount?: number;
}

export interface MetricHeatmap {
  metricId: string;
  title: string;
  description: string;
  hotLabel: string;
  coldLabel: string;
  cells: HeatmapCell[];
}
