"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

interface FloatingWidgetProps {
  studentName?: string;
}

export default function FloatingWidget({ studentName = "Kayra" }: FloatingWidgetProps) {
  const [showToast, setShowToast] = useState(true);
  const firstName = studentName.split(" ")[0];

  return (
    <>
      {showToast && (
        <div className="fixed bottom-20 right-6 z-50 flex max-w-xs items-start gap-3 rounded-xl border border-red-100 bg-white p-4 shadow-lg">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            CL
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-stone-800">ozelderz</p>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              {firstName} ile ders değerlendirmesi hazır. Koçluk panelinden
              detaylı geri bildirime bakabilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-stone-400 hover:text-stone-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <button className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-600">
        <MessageCircle size={22} />
      </button>
    </>
  );
}
