"use client";

import { useState } from "react";
import type { LessonData } from "@/types";
import Tabs, { Panel } from "@/components/ui/Tabs";
import LessonEvaluationPanel from "./LessonEvaluationPanel";
import SummaryPanel from "./SummaryPanel";
import ActionItems from "./ActionItems";

interface LessonInsightsProps {
  lesson: LessonData;
}

export default function LessonInsights({ lesson }: LessonInsightsProps) {
  const [tab, setTab] = useState("evaluation");

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
          Ders özeti
        </p>
        <Tabs
          tabs={[
            { id: "evaluation", label: "Değerlendirme" },
            { id: "summary", label: "Özet" },
            { id: "tasks", label: "Görevler", badge: lesson.actionItems.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-0.5">
        {tab === "evaluation" && (
          <LessonEvaluationPanel
            evaluation={lesson.lessonEvaluation}
            studentName={lesson.student.name}
            embedded
          />
        )}

        {tab === "summary" && (
          <Panel noPadding>
            <SummaryPanel summary={lesson.summary} embedded />
          </Panel>
        )}

        {tab === "tasks" && (
          <Panel noPadding>
            <ActionItems items={lesson.actionItems} embedded />
          </Panel>
        )}
      </div>
    </div>
  );
}
