import Link from "next/link";
import { Bot, ChartColumn, HandHeart, ShieldCheck, UploadCloud } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
      <section className="glass rounded-3xl p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">NGO Coordination Platform</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Coordinate relief faster with <span className="text-gradient">ReliefLink AI</span>
        </h1>
        <p className="mt-5 max-w-2xl text-slate-300">
          Upload field reports, let Gemini classify urgency, and match skilled volunteers by
          location in one responsive command center.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/ngo" className="rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-900">
            Go to NGO Dashboard
          </Link>
          <Link href="/volunteer" className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10">
            Volunteer Dashboard
          </Link>
        </div>
      </section>
      <AuthPanel />

      <section className="grid gap-4 md:col-span-2 md:grid-cols-4">
        {[
          { icon: UploadCloud, title: "Report Intake", text: "Upload text, image, and PDF reports instantly." },
          { icon: Bot, title: "Gemini Analysis", text: "Auto-summary, urgency scoring, and action recommendations." },
          { icon: HandHeart, title: "Volunteer Matching", text: "Match volunteers by location and skill overlap." },
          { icon: ChartColumn, title: "Real-time Analytics", text: "See trends and urgency distribution by area." },
        ].map((item) => (
          <article key={item.title} className="glass rounded-2xl p-5">
            <item.icon className="size-5 text-cyan-200" />
            <h2 className="mt-3 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="glass md:col-span-2 rounded-2xl p-6 flex items-center gap-3 text-sm text-slate-300">
        <ShieldCheck className="size-4 text-emerald-300" />
        Built with Next.js, Tailwind, Firebase Auth + Firestore, and Gemini API for deployment-ready workflows.
      </section>
    </div>
  );
}
