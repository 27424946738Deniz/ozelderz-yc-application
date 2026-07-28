import type { Metadata } from "next";
import { Geist } from "next/font/google";
import GoogleTranslateBar from "@/components/GoogleTranslateBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ozelderz × Y Combinator — Ders Analiz",
  description:
    "ozelderz ve Y Combinator iş birliğiyle öğretmen-öğrenci ders analizi, öğrenme profili ve koçluk platformu",
  icons: {
    icon: [{ url: "/branding/ozelderz-logo.png", type: "image/png" }],
    apple: "/branding/ozelderz-logo.png",
    shortcut: "/branding/ozelderz-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-stone-900">
        <GoogleTranslateBar />
        {children}
      </body>
    </html>
  );
}
