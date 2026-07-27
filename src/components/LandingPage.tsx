"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import {
  ADMIN_PANEL_URL,
  AUTH_PASSWORD,
  AUTH_USERNAME,
} from "@/lib/auth";

const showcaseLinks = [
  {
    href: "/dersler",
    title: "Lesson analyses",
    description:
      "Browse transcribed intro lessons — coaching metrics, heatmaps, and full transcripts side by side.",
  },
  {
    href: "/ogrenciler",
    title: "Student learning profiles",
    description:
      "How each student learns: learning style, strengths, engagement signals — all derived from real calls.",
  },
  {
    href: "/hocalar",
    title: "Teacher feedback & matching",
    description:
      "Aggregated teaching feedback, style analysis, and which student types each teacher excels with.",
  },
];

const INSTAGRAM_URL = "https://www.instagram.com/ozelderzcom/";

function InstagramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function InstagramReachSection() {
  return (
    <section className="relative mt-12 overflow-hidden rounded-3xl border border-stone-200/80 bg-stone-950 px-6 py-12 sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#dd2a7b]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#f58529]/15 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">
            On Instagram
          </p>
          <p className="mt-6 text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl md:text-7xl">
            12M+
            <span className="block text-2xl font-medium tracking-normal text-stone-400 sm:mt-2 sm:text-3xl">
              views since January
            </span>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-stone-400 sm:text-xl">
            The account families actually watch — not a side project, our main
            stage for how ozelderz shows up in the wild.
          </p>
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/10 sm:min-w-[17rem]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-lg shadow-[#dd2a7b]/25">
            <InstagramIcon size={20} />
          </div>
          <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
            @ozelderzcom
          </p>
          <p className="mt-2 text-sm text-stone-400">See what 12M looks like</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:gap-3">
            Open profile
            <ExternalLink size={15} />
          </span>
        </a>
      </div>
    </section>
  );
}

function LivePanelSection() {
  return (
    <section
      id="live-panel"
      className="relative scroll-mt-36 overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-600 via-red-600 to-red-800 px-6 py-12 shadow-xl shadow-red-900/25 sm:px-10 sm:py-16"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-red-400/20 blur-3xl" />

      <p className="relative text-sm font-bold uppercase tracking-[0.25em] text-red-100">
        Also
      </p>
      <h2 className="relative mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
        There is more.
      </h2>
      <p className="relative mt-6 max-w-2xl text-lg leading-relaxed text-red-50 sm:text-xl">
        We attached the{" "}
        <strong className="font-semibold text-white">live sales &amp; ops panel</strong>{" "}
        our team runs the full customer cycle on — from first touch through close.
        Financial data, customer names, pipeline stages: everything is real because
        we use it daily. Our activity logs are live too. Please take a close look.
      </p>

      <div className="relative mt-10 flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <a
          href={ADMIN_PANEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-1 flex-col justify-between rounded-2xl border border-white/20 bg-white p-6 shadow-lg transition-transform hover:scale-[1.01] sm:p-8"
        >
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
              <LayoutDashboard size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Live admin panel
            </p>
            <p className="mt-2 text-lg font-bold text-stone-900 sm:text-xl">
              panel.ozelderz.com/admin/giris
            </p>
            <p className="mt-3 text-base leading-relaxed text-stone-600">
              Sales cycle, revenue, customers, and ops — the same dashboard our
              team opens every morning.
            </p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-red-600 group-hover:gap-3">
            Open the panel
            <ExternalLink size={18} />
          </span>
        </a>

        <div className="w-full rounded-2xl border border-white/25 bg-white/95 p-6 backdrop-blur sm:p-8 lg:max-w-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">
            Admin credentials
          </p>
          <p className="mt-1 text-sm text-stone-500">Use these to sign in</p>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">
                Username
              </span>
              <input
                type="text"
                readOnly
                value={AUTH_USERNAME}
                className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base font-mono text-stone-900 placeholder:text-stone-300 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">
                Password
              </span>
              <input
                type="text"
                readOnly
                value={AUTH_PASSWORD}
                className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3.5 text-base font-mono text-stone-900 placeholder:text-stone-300 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  useEffect(() => {
    if (window.location.hash !== "#live-panel") return;
    const el = document.getElementById("live-panel");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/40 to-white px-6 py-10 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-red-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-red-200/30 blur-2xl" />

          <span className="relative inline-block rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-red-600 shadow-sm">
            ozelderz × Y Combinator
          </span>

          <h1 className="relative mt-8 text-5xl font-bold leading-[0.95] tracking-tight text-stone-900 sm:text-6xl md:text-7xl">
            Hello{" "}
            <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              YC
            </span>
          </h1>

          <p className="relative mt-5 max-w-2xl text-xl font-medium leading-snug text-stone-800 sm:text-2xl md:text-3xl">
            We didn&apos;t want to hand you 300 teacher logins.
          </p>

          <div className="relative mt-8 max-w-2xl space-y-4 border-l-2 border-red-200 pl-5 text-base leading-relaxed text-stone-600 sm:text-lg">
            <p>
              Letting partners browse hundreds of separate accounts — click
              around, compare outcomes, hunt for signal — didn&apos;t feel like
              the right experience. So instead of a maze of logins, we built one
              showcase.
            </p>
            <p>
              Inside:{" "}
              <strong className="font-semibold text-stone-800">
                lesson analyses
              </strong>
              ,{" "}
              <strong className="font-semibold text-stone-800">
                how each student learns
              </strong>
              , and{" "}
              <strong className="font-semibold text-stone-800">
                aggregated teacher feedback
              </strong>{" "}
              — from real intro-call transcripts. We have ~100 teacher intro
              Meets in production; enjoy exploring a curated slice.
            </p>
          </div>
        </section>

        <div className="mt-10 rounded-2xl border border-red-100 bg-white p-6 shadow-sm shadow-red-950/[0.04] sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-red-700">
            <Sparkles size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Product showcase
            </span>
          </div>
          <div className="space-y-4">
            {showcaseLinks.map(({ href, title, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start justify-between gap-4 rounded-xl border border-red-100/80 bg-white p-4 transition-colors hover:border-red-200 hover:bg-red-50/30"
              >
                <div>
                  <p className="font-semibold text-stone-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">
                    {description}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="mt-1 shrink-0 text-red-400 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
          <Link
            href="/dersler"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Enter the showcase
            <ArrowRight size={16} />
          </Link>
        </div>

        <InstagramReachSection />

        <div className="mt-12">
          <LivePanelSection />
        </div>

        <p className="mt-16 text-center text-xl font-semibold text-stone-900 sm:text-2xl">
          Hope we will meet again.
        </p>
        <p className="mt-3 pb-10 text-center text-sm text-stone-500">
          — the ozelderz team
        </p>
      </main>
    </div>
  );
}
