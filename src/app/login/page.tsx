import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Giriş — ozelderz × YC",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
