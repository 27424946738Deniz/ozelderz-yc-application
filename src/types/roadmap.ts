export interface RoadmapTest {
  label: string;
  description: string;
  questionCount: number;
  passScore: number;
  format: string;
}

export interface RoadmapBranch {
  weakArea: string;
  temperamentNote: string;
  teacherAction: string;
  studentRetry: string[];
}

export interface RoadmapCheckpoint {
  id: string;
  title: string;
  weekRange: string;
  status: "foundation" | "core" | "exam";
  teacherFocus: string[];
  studentTasks: string[];
  test: RoadmapTest;
  onPass: {
    headline: string;
    detail: string;
  };
  onFail: RoadmapBranch;
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
