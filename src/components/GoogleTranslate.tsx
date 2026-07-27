"use client";

import { useEffect, useState } from "react";
import { loadGoogleTranslate } from "@/lib/google-translate-loader";

export default function GoogleTranslate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);

    // Defer until after React hydration — Google mutates the DOM and breaks SSR matching.
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadGoogleTranslate();
      });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return <div className="google-translate-widget h-9 w-[9rem]" aria-hidden />;
  }

  return (
    <div id="google_translate_element" className="google-translate-widget" />
  );
}
