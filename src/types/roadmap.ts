export interface RoadmapTest {
  label: string;
  description: string;
  questionCount: number;
  passScore: number;
  partialScore?: number;
  format: string;
}

export interface RoadmapHomework {
  title: string;
  description: string;
  quantity: string;
  estimatedMinutes?: number;
}

export interface RoadmapOutcome {
  condition: string;
  headline: string;
  detail: string;
  teacherSteps: string[];
  studentSteps: string[];
  nextCheckpointId?: string;
  nextCheckpointTitle?: string;
  temperamentNote?: string;
}

export interface RoadmapCheckpoint {
  id: string;
  title: string;
  weekRange: string;
  status: "foundation" | "core" | "exam";
  transcriptContext?: string;
  teacherFocus: string[];
  studentTasks: string[];
  homework: RoadmapHomework;
  test: RoadmapTest;
  outcomes: {
    pass: RoadmapOutcome;
    partial?: RoadmapOutcome;
    fail: RoadmapOutcome;
  };
}

export interface RoadmapPhase {
  id: string;
  label: string;
  months: string;
  goal: string;
  checkpoints: RoadmapCheckpoint[];
}

export interface LessonRoadmap {
  lessonId: string;
  title: string;
  subject: string;
  teacher: {
    name: string;
    avatar: string;
    title: string;
  };
  student: {
    name: string;
    avatar: string;
    grade: string;
    learningStyle: string;
    temperamentSignals: string[];
  };
  introLessonInsights: string[];
  phases: RoadmapPhase[];
  generatedFrom: string;
}

export interface RoadmapCatalogItem {
  lessonId: string;
  title: string;
  subject: string;
  teacherName: string;
  studentName: string;
  phaseCount: number;
  checkpointCount: number;
}
