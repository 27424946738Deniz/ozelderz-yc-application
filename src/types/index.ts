export type MetricStatus = "good" | "warning" | "bad";

export interface Metric {
  id: string;
  label: string;
  value: string;
  status: MetricStatus;
  suggested: string;
  trend?: "up" | "down";
}

export interface StatusPill {
  id: string;
  label: string;
  value: string;
  type: "success" | "neutral" | "score";
}

export interface SpeechSegment {
  start: number;
  end: number;
}

export interface AttentionSegment {
  start: number;
  end: number;
  level: "high" | "medium" | "low";
  label?: string;
}

export interface InsightItem {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
  expanded?: boolean;
}

export interface StudentProfile {
  name: string;
  grade: string;
  avatar: string;
  learningStyle: string;
  learningStyleDescription: string;
  strengths: string[];
  challenges: string[];
  comprehensionScore: number;
  tags: string[];
}

export interface LearningStyleDimension {
  id: string;
  label: string;
  score: number;
  level: "high" | "medium" | "low";
  insight: string;
  evidence: string;
  teachWith: string;
  avoid: string;
}

export interface LearningStyleAnalysis {
  primaryStyle: string;
  secondaryStyle: string;
  overview: string;
  dimensions: LearningStyleDimension[];
  understandsBetter: Array<{ area: string; reason: string; example?: string }>;
  understandsLess: Array<{ area: string; reason: string; alternative: string }>;
  approachGuide: Array<{
    when: string;
    doThis: string;
    because: string;
  }>;
}

export interface StudentProfileDetail extends StudentProfile {
  id: string;
  lessonId?: string;
  school: string;
  goals: string[];
  learningStyleAnalysis: LearningStyleAnalysis;
  interestAreas: Array<{
    label: string;
    detail: string;
    level: "high" | "medium" | "low";
  }>;
  motivationTriggers: string[];
  teachingTips: string[];
  notableQuotes: Array<{ text: string; time: string }>;
  engagementMetrics: {
    turnCount: number;
    questionCount: number;
    wordCount: number;
    participationPct: number;
    avgUtteranceLength: number;
    longResponses: number;
    lessonCount: number;
    lastLessonDate: string;
  };
  lessonsSummary: {
    totalMinutes: number;
    subjects: string[];
    lastLessonTitle: string;
  };
}

export interface TeacherMatch {
  name: string;
  specialty: string;
  matchScore: number;
  reason: string;
  avatar: string;
}

export interface TeacherStyleDimension {
  id: string;
  label: string;
  score: number;
  level: "high" | "medium" | "low";
  insight: string;
  evidence: string;
}

export interface StudentTypeMatch {
  studentType: string;
  matchScore: number;
  reason: string;
  traits: string[];
  caution?: string;
}

export interface TeachingStyleAnalysis {
  primaryStyle: string;
  secondaryStyle: string;
  overview: string;
  dimensions: TeacherStyleDimension[];
  excelsWith: Array<{ type: string; reason: string; example?: string }>;
  lessSuitedFor: Array<{ type: string; reason: string; alternative: string }>;
  matchingGuide: Array<{ when: string; recommend: string; because: string }>;
}

export interface LessonCatalogItem {
  id: string;
  meetCode: string;
  title: string;
  subject: string;
  duration: number;
  durationMin: number;
  transcriptSource: string;
  segmentCount: number;
  wordCount: number;
  speakers: string[];
  speakerSplit: Record<string, number>;
  evaluationScore?: number;
  hasVideo: boolean;
  videoType: "stream" | "mp4";
  transcribedAt?: string;
  r2Key?: string;
  summaryBrief?: string;
  evaluationOverview?: string;
  topStrength?: string;
  topWeakness?: string;
  questionCount?: number;
  partCount?: number;
  topTopics?: string[];
  topSections?: string[];
}

export interface TeacherProfileDetail {
  id: string;
  lessonId?: string;
  name: string;
  title: string;
  subject: string;
  avatar: string;
  tags: string[];
  teachingScore: number;
  teachingStyle: string;
  teachingStyleDescription: string;
  teachingStyleAnalysis: TeachingStyleAnalysis;
  strengths: string[];
  developmentAreas: string[];
  studentTypeMatches: StudentTypeMatch[];
  coordinatorTips: string[];
  notableQuotes: Array<{ text: string; time: string }>;
  teachingMetrics: {
    talkRatioPct: number;
    questionCount: number;
    wpm: number;
    checkInCount: number;
    avgWaitSec: number;
    turnCount: number;
    lessonCount: number;
    lastLessonDate: string;
  };
  lessonsSummary: {
    totalMinutes: number;
    subjects: string[];
    lastLessonTitle: string;
  };
}

export interface LessonSummary {
  brief: string;
  detailed: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
}

export interface LessonEvaluation {
  score: number;
  scoreLabel: string;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  studentProfileInsights: string[];
  nextLessonRecommendations: string[];
  homeworkRecommendation: {
    intensity: "Hafif" | "Orta" | "Yoğun";
    items: string[];
  };
}

export interface LessonData {
  id: string;
  title: string;
  subject: string;
  duration: number;
  teacher: {
    name: string;
    title: string;
    avatar: string;
  };
  student: StudentProfile;
  videoUrl: string;
  videoType?: "stream" | "mp4";
  posterUrl: string;
  statusPills: StatusPill[];
  metrics: Metric[];
  speechTimeline: SpeechSegment[];
  attentionTimeline: AttentionSegment[];
  summary: LessonSummary;
  actionItems: ActionItem[];
  lessonEvaluation: LessonEvaluation;
  scribePrompts?: string[];
  completedInsights: InsightItem[];
  growthInsights: InsightItem[];
  teacherMatch?: TeacherMatch;
  heatmaps?: Record<string, import("@/types/transcript").MetricHeatmap>;
  transcript?: import("@/types/transcript").TranscriptData;
}

export interface UserData {
  name: string;
  avatar: string;
  role: string;
}
