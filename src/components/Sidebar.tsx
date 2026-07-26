"use client";

import {
  Home,
  FileText,
  LayoutGrid,
  Target,
  MessageCircle,
  Clock,
  Pencil,
  BarChart3,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Ana Sayfa", active: false },
  { icon: FileText, label: "Dersler", active: false },
  { icon: LayoutGrid, label: "Kütüphane", active: false },
  { icon: Target, label: "Hedefler", active: false },
  { icon: MessageCircle, label: "Mesajlar", active: false },
  { icon: Clock, label: "Geçmiş", active: false },
  { icon: Pencil, label: "Analiz", active: true },
  { icon: BarChart3, label: "Raporlar", active: false },
];

export default function Sidebar() {
  return (
    <aside className="flex w-14 flex-col items-center gap-1 border-r border-[#e2e8f0] bg-white py-4">
      {navItems.map(({ icon: Icon, label, active }) => (
        <button
          key={label}
          title={label}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            active
              ? "bg-red-700 text-white"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
    </aside>
  );
}
