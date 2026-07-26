"use client";

import { UserCheck } from "lucide-react";
import type { TeacherMatch } from "@/types";

interface TeacherMatchCardProps {
  match: TeacherMatch;
}

export default function TeacherMatchCard({ match }: TeacherMatchCardProps) {
  return (
    <div className="rounded-lg border border-dashed border-red-200 bg-red-50/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck size={16} className="text-red-500" />
        <span className="text-xs font-semibold text-red-700">
          Alternatif Öğretmen Önerisi
        </span>
      </div>
      <div className="flex items-start gap-3">
        <img
          src={match.avatar}
          alt={match.name}
          className="h-10 w-10 rounded-full bg-white"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">{match.name}</p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              %{match.matchScore} uyum
            </span>
          </div>
          <p className="text-xs text-gray-500">{match.specialty}</p>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            {match.reason}
          </p>
        </div>
      </div>
      <button className="mt-3 w-full rounded-md bg-red-500 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600">
        Profili İncele (Demo)
      </button>
    </div>
  );
}
