"use client";

import GoogleTranslate from "@/components/GoogleTranslate";

export default function GoogleTranslateBar() {
  return (
    <div className="pointer-events-none fixed right-4 top-3.5 z-[60] sm:right-6">
      <div className="pointer-events-auto">
        <GoogleTranslate />
      </div>
    </div>
  );
}
