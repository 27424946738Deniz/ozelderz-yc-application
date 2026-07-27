import fs from "fs";
import path from "path";
import type {
  StudentProfileDetail,
  StudentTypeMatch,
  TeachingStyleAnalysis,
} from "@/types";

export interface StoredStudentProfileContent {
  meetCode: string;
  school?: string;
  tags: string[];
  goals: string[];
  interestAreas: StudentProfileDetail["interestAreas"];
  strengths: string[];
  challenges: string[];
  motivationTriggers: string[];
  teachingTips: string[];
  notableQuotes: Array<{ text: string; time: string }>;
  generatedAt: string;
}

export interface StoredTeacherProfileContent {
  meetCode: string;
  tags: string[];
  strengths: string[];
  developmentAreas: string[];
  coordinatorTips: string[];
  notableQuotes: Array<{ text: string; time: string }>;
  studentTypeMatches: StudentTypeMatch[];
  overview?: string;
  excelsWith?: TeachingStyleAnalysis["excelsWith"];
  lessSuitedFor?: TeachingStyleAnalysis["lessSuitedFor"];
  matchingGuide?: TeachingStyleAnalysis["matchingGuide"];
  generatedAt: string;
}

interface ProfileIndex {
  version: number;
  students: Record<string, StoredStudentProfileContent>;
  teachers: Record<string, StoredTeacherProfileContent>;
}

const PROFILE_PATH = path.join(process.cwd(), "data/profiles.json");

let cache: ProfileIndex | null = null;

function loadIndex(): ProfileIndex {
  if (cache) return cache;
  if (!fs.existsSync(PROFILE_PATH)) {
    cache = { version: 1, students: {}, teachers: {} };
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8")) as ProfileIndex;
  return cache;
}

export function getStoredStudentProfile(
  meetCode: string
): StoredStudentProfileContent | null {
  return loadIndex().students[meetCode] ?? null;
}

export function getStoredTeacherProfile(
  meetCode: string
): StoredTeacherProfileContent | null {
  return loadIndex().teachers[meetCode] ?? null;
}

export function saveProfiles(input: {
  students: StoredStudentProfileContent[];
  teachers: StoredTeacherProfileContent[];
}) {
  const existing = loadIndex();
  const index: ProfileIndex = {
    version: 1,
    students: {
      ...existing.students,
      ...Object.fromEntries(input.students.map((s) => [s.meetCode, s])),
    },
    teachers: {
      ...existing.teachers,
      ...Object.fromEntries(input.teachers.map((t) => [t.meetCode, t])),
    },
  };
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(index, null, 2));
  cache = index;
}
