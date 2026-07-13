"use client";

import { HomePage } from "@/components/marketing/home-page";
import { ArcRevealHero } from "@/components/marketing/arc-reveal-hero";

export default function Page() {
  return (
    <ArcRevealHero>
      <HomePage />
    </ArcRevealHero>
  );
}
