import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

const content = {
  features: {
    eyebrow: "Everything in one calm place",
    title: "A clear path through every clinic visit.",
    body: "Thoughtful booking, timely reminders, private live queues, and focused dashboards for the people delivering care."
  },
  "how-it-works": {
    eyebrow: "Simple by design",
    title: "Choose a doctor. Join the queue. Arrive on time.",
    body: "CuraFlow keeps each step visible, so patients feel prepared and care teams stay in rhythm."
  },
  about: {
    eyebrow: "Why CuraFlow",
    title: "We believe waiting rooms should feel less crowded.",
    body: "We are building a calmer operating layer for clinics—one that respects patient time and gives teams a reliable shared view."
  },
  contact: {
    eyebrow: "Talk to our team",
    title: "Let’s make your clinic day flow better.",
    body: "Tell us how your clinic works today. We’ll show you a thoughtful path to simpler scheduling and queues."
  },
  faq: {
    eyebrow: "Good questions, clear answers",
    title: "Everything you need to feel ready.",
    body: "CuraFlow is free for patients, protects personal information, and keeps live queue displays free of names and medical details."
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Care data deserves careful handling.",
    body: "CuraFlow is designed around least-privilege access, strict role checks, secure sessions, and public queue views that never reveal patient identity."
  },
  terms: {
    eyebrow: "Terms",
    title: "Clear expectations make better partnerships.",
    body: "These product terms will be finalized with deployment-specific service, support, and data-processing details before production launch."
  }
} as const;

export function generateStaticParams() {
  return Object.keys(content).map((slug) => ({ slug }));
}

export default async function MarketingContentPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = content[slug as keyof typeof content];
  if (!page) notFound();

  return (
    <main className="content-page">
      <div className="content-glow" />
      <div className="container content-page-inner">
        <span className="eyebrow eyebrow-plain">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
        <Link className="button button-primary button-large" href="/register">
          Get started <ArrowRight size={18} />
        </Link>
      </div>
    </main>
  );
}
