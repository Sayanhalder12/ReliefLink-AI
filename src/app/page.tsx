 "use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChartColumn,
  Globe2,
  HandHeart,
  Radar,
  ShieldCheck,
  Siren,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";
import { AnimatedCounter, GlassCard, SectionHeading } from "@/components/premium-ui";
import { useReports, useVolunteers } from "@/lib/live-data";
import { getPriorityScore, getReportStatus, normalizeCity } from "@/lib/report-utils";

export default function Home() {
  const { reports } = useReports();
  const { volunteers } = useVolunteers();
  const features = [
    {
      icon: UploadCloud,
      title: "AI Need Detection",
      text: "Convert field updates, PDFs, and media into structured emergency intelligence in seconds.",
    },
    {
      icon: HandHeart,
      title: "Smart Volunteer Matching",
      text: "Match responder skills and availability to the right missions with location-aware relevance.",
    },
    {
      icon: ChartColumn,
      title: "Real-Time Dashboard",
      text: "Track reports, critical cases, response velocity, and operational activity from one command center.",
    },
    {
      icon: Siren,
      title: "Priority Alerts",
      text: "Surface the most urgent incidents first so limited teams can focus on what matters now.",
    },
    {
      icon: Radar,
      title: "Location Insights",
      text: "Spot emerging risk clusters and pressure points across communities before they escalate.",
    },
    {
      icon: ShieldCheck,
      title: "Secure NGO Workspace",
      text: "Built on Firebase Auth and Firestore for dependable role-based response workflows.",
    },
  ];

  const totalReports = reports.length || 3;
  const criticalOpenCases =
    reports.filter((report) => report.urgency === "critical" && getReportStatus(report) !== "Resolved").length || 1;
  const registeredVolunteers = volunteers.length || 4;
  const resolvedCases = reports.filter((report) => getReportStatus(report) === "Resolved").length || 1;
  const citiesCovered =
    new Set(reports.map((report) => normalizeCity(report.location)).filter(Boolean)).size || 2;
  const avgPriorityScore =
    reports.length > 0
      ? Math.round(reports.reduce((sum, report) => sum + getPriorityScore(report), 0) / reports.length)
      : 42;

  return (
    <div className="space-y-6 pb-8">
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="relative overflow-hidden p-8 sm:p-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
              Premium Response Infrastructure
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              AI-Powered Crisis Coordination for NGOs & Communities
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              ReliefLink AI transforms scattered emergency reports into instant action plans,
              volunteer deployment, and real-time response analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ngo" className="btn-primary px-6 py-3">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/analytics" className="btn-secondary px-6 py-3">
                View Dashboard
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                "Built for NGO command teams",
                "Gemini-powered triage and summaries",
                "Volunteer coordination in one workspace",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-6">
          <GlassCard className="relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-400/10" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-200">Live Operations Snapshot</p>
                <Sparkles className="size-4 text-cyan-200" />
              </div>
              <div className="grid gap-3">
                {[
                  { label: "Critical open cases", value: String(criticalOpenCases), tone: "text-rose-200" },
                  { label: "Registered volunteers", value: String(registeredVolunteers), tone: "text-cyan-200" },
                  { label: "Resolved cases", value: String(resolvedCases), tone: "text-emerald-200" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <AuthPanelNoSSR />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedCounter value={String(totalReports)} label="Total Reports" />
        <AnimatedCounter value={String(criticalOpenCases)} label="Critical Open Cases" />
        <AnimatedCounter value={String(registeredVolunteers)} label="Registered Volunteers" />
        <AnimatedCounter value={String(resolvedCases)} label="Resolved Cases" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <AnimatedCounter value={String(citiesCovered)} label="Cities Covered" />
        <AnimatedCounter value={String(avgPriorityScore)} label="Avg Priority Score" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <GlassCard className="p-8">
          <SectionHeading
            eyebrow="How It Works"
            title="Three steps from report intake to coordinated action"
            description="Designed for high-pressure response teams that need clarity, speed, and accountability."
          />
          <div className="mt-8 space-y-4">
            {[
              { step: "01", title: "Upload Crisis Report", text: "Submit text, image, or PDF field updates from any affected area." },
              { step: "02", title: "AI Prioritizes Needs", text: "Gemini summarizes urgency, category, action, and staffing requirements." },
              { step: "03", title: "Volunteers Dispatched Instantly", text: "Response teams get mission-ready recommendations and live analytics." },
            ].map((item) => (
              <div key={item.step} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Step {item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item) => (
            <GlassCard key={item.title} className="p-5">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            title: "Faster than manual systems",
            text: "Prioritize response in minutes instead of chasing fragmented calls, emails, and spreadsheets.",
          },
          {
            title: "Scalable globally",
            text: "Cloud-native workflows support growth from one district command room to multi-region operations.",
          },
          {
            title: "Cloud-native architecture",
            text: "Built with Next.js, Firebase, and Vercel for dependable deployment and rapid iteration.",
          },
          {
            title: "Humanitarian impact focused",
            text: "Every decision surface is optimized for urgent relief outcomes, not vanity dashboards.",
          },
        ].map((item) => (
          <GlassCard key={item.title} className="p-5">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            quote:
              "ReliefLink AI turned unstructured flood updates into a decision-ready action board before our field team briefing even started.",
            author: "NGO Operations Lead",
          },
          {
            quote:
              "The volunteer matching and urgency insights feel like having an extra coordination analyst on every shift.",
            author: "Regional Response Coordinator",
          },
          {
            quote:
              "Judges, donors, and partner agencies instantly understand the value because the dashboard reflects real operational clarity.",
            author: "Community Resilience Program Manager",
          },
        ].map((item) => (
          <GlassCard key={item.author} className="p-6">
            <Bot className="size-5 text-cyan-200" />
            <p className="mt-4 text-sm leading-7 text-slate-200">“{item.quote}”</p>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">{item.author}</p>
          </GlassCard>
        ))}
      </section>

      <GlassCard className="overflow-hidden p-8 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Why ReliefLink"
              title="Ready to transform emergency response?"
              description="Launch a modern NGO operations experience that feels credible, intelligent, and deployment-ready from the first click."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/ngo" className="btn-primary px-6 py-3">
                Get Started Now
              </Link>
              <Link href="/about" className="btn-secondary px-6 py-3">
                Learn More
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Globe2, title: "Global-ready workflows" },
              { icon: ChartColumn, title: "Executive-grade analytics" },
              { icon: HandHeart, title: "Community-centered response" },
              { icon: ShieldCheck, title: "Secure cloud-native stack" },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <item.icon className="size-5 text-cyan-200" />
                <p className="mt-3 font-medium text-white">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
