"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDown } from "lucide-react";

export default function LivePanelBanner() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  function scrollToPanel() {
    document.getElementById("live-panel")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleClick(e: React.MouseEvent) {
    if (onHome) {
      e.preventDefault();
      scrollToPanel();
    }
  }

  return (
    <Link
      href="/#live-panel"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 border-b border-red-700 bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 sm:text-base"
    >
      <span className="uppercase tracking-wide">Also, there is more</span>
      <span className="hidden opacity-90 sm:inline">
        — live admin panel with real financial data
      </span>
      <ArrowDown size={16} className="animate-bounce" />
    </Link>
  );
}
