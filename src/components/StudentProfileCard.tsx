"use client";

import type { StudentProfile } from "@/types";

interface StudentProfileCardProps {
  student: StudentProfile;
}

export default function StudentProfileCard({ student }: StudentProfileCardProps) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">
        Öğrenme Profili
      </h3>
      <div className="mb-4 flex items-center gap-3">
        <img
          src={student.avatar}
          alt={student.name}
          className="h-12 w-12 rounded-full bg-gray-100"
        />
        <div>
          <p className="font-medium text-gray-800">{student.name}</p>
          <p className="text-xs text-gray-500">{student.grade}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {student.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-4 rounded-lg bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">
          {student.learningStyle}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-red-600/80">
          {student.learningStyleDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-green-600">Güçlü Yönler</p>
          <ul className="space-y-1">
            {student.strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-600">
                ✓ {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-red-500">Zorluklar</p>
          <ul className="space-y-1">
            {student.challenges.map((c, i) => (
              <li key={i} className="text-xs text-gray-600">
                △ {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
