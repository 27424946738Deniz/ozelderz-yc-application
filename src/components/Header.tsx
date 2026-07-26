"use client";

import Image from "next/image";
import Link from "next/link";
import type { UserData } from "@/types";

interface HeaderProps {
  user: UserData;
  activeNav?:
    | "Dersler"
    | "Öğrenciler"
    | "Hocalar"
    | "Yol Haritası"
    | "Kütüphane"
    | "Ayarlar";
}

const navLinks: Array<{
  label:
    | "Dersler"
    | "Öğrenciler"
    | "Hocalar"
    | "Yol Haritası"
    | "Kütüphane"
    | "Ayarlar";
  href: string;
}> = [
  { label: "Dersler", href: "/dersler" },
  { label: "Öğrenciler", href: "/ogrenciler" },
  { label: "Hocalar", href: "/hocalar" },
  { label: "Yol Haritası", href: "/yol-haritasi" },
  { label: "Kütüphane", href: "#" },
  { label: "Ayarlar", href: "#" },
];

export default function Header({ user, activeNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-red-100 bg-white px-4 shadow-sm shadow-red-950/[0.04] sm:px-6">
      <div className="flex min-w-0 items-center gap-5 sm:gap-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 sm:gap-3"
          aria-label="ozelderz x Y Combinator"
        >
          <Image
            src="/branding/ozelderz-logo.png"
            alt="ozelderz"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
            priority
          />
          <span className="hidden text-sm font-semibold tracking-tight text-stone-800 sm:inline">
            ozelderz
          </span>
          <span className="px-0.5 text-sm font-light text-stone-300 sm:px-1">×</span>
          <Image
            src="/branding/yc-logo.png"
            alt="Y Combinator"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
            priority
          />
          <span className="hidden text-sm font-semibold tracking-tight text-stone-800 lg:inline">
            Y Combinator
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ label, href }) => {
            const active = label === activeNav;
            const className = `relative pb-0.5 text-sm font-medium transition-colors ${
              active
                ? "text-red-600 after:absolute after:bottom-[-21px] after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-red-600"
                : "text-stone-500 hover:text-stone-800"
            }`;

            if (href === "#") {
              return (
                <button key={label} className={className}>
                  {label}
                </button>
              );
            }

            return (
              <Link key={label} href={href} className={className}>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-xs text-stone-400 sm:block">{user.role}</span>
        <img
          src={user.avatar}
          alt={user.name}
          className="h-8 w-8 rounded-full bg-red-50 ring-1 ring-red-100"
        />
        <span className="text-sm font-medium text-stone-800">{user.name}</span>
      </div>
    </header>
  );
}
