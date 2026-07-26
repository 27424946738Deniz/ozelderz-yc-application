"use client";

import { ChevronDown, Star } from "lucide-react";
import type { LessonEvaluation } from "@/types";
import { Panel } from "@/components/ui/Tabs";

interface LessonEvaluationPanelProps {
  evaluation: LessonEvaluation;
  studentName: string;
  embedded?: boolean;
}

function DetailSection({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-stone-100 bg-stone-50/50"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-stone-700 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={14}
          className="text-stone-400 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-stone-100 px-4 py-3">{children}</div>
    </details>
  );
}

export default function LessonEvaluationPanel({
  evaluation,
  studentName,
  embedded,
}: LessonEvaluationPanelProps) {
  const studentFirst = studentName.split(" ")[0];

  const scoreBlock = (
    <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-4">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
        <span className="text-xl font-bold text-red-600">
          {evaluation.score}
        </span>
        <span className="text-[9px] text-stone-400">/10</span>
      </div>
      <div>
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-red-400 text-red-400" />
          <span className="text-sm font-semibold text-stone-800">
            {evaluation.scoreLabel}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-stone-600 line-clamp-3">
          {evaluation.overview}
        </p>
      </div>
    </div>
  );

  const accordionContent = (
    <div className="space-y-2">
      <DetailSection title="Güçlü yönler" defaultOpen>
        <ul className="bullet-list green">
          {evaluation.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection title="Geliştirilebilir">
        <ul className="bullet-list orange">
          {evaluation.weaknesses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection title="Sonraki ders">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-sky-700">
              {studentFirst} profiline göre
            </p>
            <ul className="bullet-list sky">
              {evaluation.studentProfileInsights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-stone-700">Öneriler</p>
            <ul className="bullet-list stone">
              {evaluation.nextLessonRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-red-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-700">Ödev</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-red-700">
                {evaluation.homeworkRecommendation.intensity}
              </span>
            </div>
            <ul className="bullet-list orange">
              {evaluation.homeworkRecommendation.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </DetailSection>
    </div>
  );

  if (embedded) {
    return (
      <Panel noPadding>
        <div className="space-y-4 p-4">
          {scoreBlock}
          {accordionContent}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Ders Değerlendirmesi">
      <div className="space-y-4">
        {scoreBlock}
        {accordionContent}
      </div>
    </Panel>
  );
}
