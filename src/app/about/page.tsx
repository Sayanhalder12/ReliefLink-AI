import { Bot, Database, ShieldCheck, Zap } from "lucide-react";
import { GlassCard, SectionHeading } from "@/components/premium-ui";

export default function AboutPage() {
  return (
    <div className="space-y-6 pb-8">
      <GlassCard className="p-8 sm:p-10">
        <SectionHeading
          eyebrow="About ReliefLink AI"
          title="Built to help emergency teams move from chaos to coordinated action"
          description="ReliefLink AI combines premium product design with practical crisis workflows so NGOs can triage reports, match volunteers, and communicate operational clarity in real time."
        />
      </GlassCard>

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white">Mission</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Give NGOs and community responders a modern command center that turns fragmented field
            inputs into timely, actionable decisions during high-pressure emergencies.
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white">Why We Built This</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Many relief teams still rely on spreadsheets, calls, and scattered notes. ReliefLink AI
            brings those workflows into one intelligent, real-time coordination layer.
          </p>
        </GlassCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            icon: Zap,
            title: "Next.js + Vercel",
            text: "Fast, deployable, modern web experience for judges, partners, and operations teams.",
          },
          {
            icon: ShieldCheck,
            title: "Firebase Auth",
            text: "Secure sign-in for NGO and volunteer workflows without disrupting existing auth logic.",
          },
          {
            icon: Database,
            title: "Firestore",
            text: "Structured incident and volunteer data storage for live dashboards and analytics.",
          },
          {
            icon: Bot,
            title: "Gemini AI",
            text: "Summarization, urgency detection, category classification, and next-action recommendations.",
          },
        ].map((item) => (
          <GlassCard key={item.title} className="p-5">
            <item.icon className="size-5 text-cyan-200" />
            <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
          </GlassCard>
        ))}
      </section>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold text-white">Impact Vision</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          ReliefLink AI is designed to feel like a credible startup-grade humanitarian platform:
          fast to use, easy to trust, and strong enough to scale from hackathon prototype to
          real-world deployment across disaster response, public health, and community resilience.
        </p>
      </GlassCard>
    </div>
  );
}
