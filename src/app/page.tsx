import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Hello YC — ozelderz × Y Combinator",
  description:
    "A single showcase for lesson analysis, learning profiles, and teacher feedback — plus our live sales panel.",
};

export default function Home() {
  return <LandingPage />;
}
