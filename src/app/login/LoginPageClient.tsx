"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Giriş başarısız");
        return;
      }

      router.push(from.startsWith("/login") ? "/" : from);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-red-50/30 to-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg shadow-red-950/5">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image
            src="/branding/ozelderz-logo.png"
            alt="ozelderz"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg"
          />
          <span className="text-stone-300">×</span>
          <Image
            src="/branding/yc-logo.png"
            alt="Y Combinator"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg"
          />
        </div>

        <h1 className="text-center text-xl font-semibold text-stone-900">
          Showcase Girişi
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          Devam etmek için giriş yapın
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Kullanıcı adı
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">
              Şifre
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
