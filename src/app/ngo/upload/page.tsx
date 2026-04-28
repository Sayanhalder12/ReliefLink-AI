"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { FileText, Loader2, MapPin, Sparkles, UploadCloud } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";
import { GlassCard, SectionHeading, StatusBadge, ToastMessage } from "@/components/premium-ui";
import { getCategoryMeta, getUrgencyMeta } from "@/lib/report-utils";

async function fileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

type AnalysisResult = {
  summary: string;
  urgency: "critical" | "high" | "medium" | "low";
  category: string;
  recommendedAction: string;
  skillsNeeded: string[];
  estimatedVolunteersNeeded: number;
  priorityScore: number;
};

export default function UploadPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  if (!user) return <AuthPanelNoSSR />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ tone: "info", text: "Analyzing report with AI and preparing Firestore save..." });
    try {
      const payload: Record<string, string | undefined> = { title, location, text };
      if (file) {
        payload.fileBase64 = await fileToBase64(file);
        payload.mimeType = file.type;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const analysis = (await response.json()) as AnalysisResult | { error?: string };

      if (!response.ok) {
        throw new Error(("error" in analysis ? analysis.error : undefined) ?? "Gemini analysis failed");
      }

      const result = analysis as AnalysisResult;
      setAnalysisResult(result);

      await addDoc(collection(db, "reports"), {
        title,
        location,
        contentType: file?.type ?? "text/plain",
        summary: result.summary,
        urgency: result.urgency,
        category: result.category,
        recommendedAction: result.recommendedAction,
        skillsNeeded: result.skillsNeeded ?? [],
        volunteersNeeded: result.estimatedVolunteersNeeded,
        priorityScore: result.priorityScore,
        status: result.urgency === "low" ? "Resolved" : "Pending",
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      setTitle("");
      setLocation("");
      setText("");
      setFile(null);
      setMessage({ tone: "success", text: "Report analyzed successfully and saved to Firestore." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <GlassCard className="p-6 sm:p-8">
        <SectionHeading
          eyebrow="Upload Report"
          title="Premium intake for crisis reports"
          description="Submit field updates, attach evidence, run AI triage, and save response-ready reports directly into Firestore."
        />

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Bridge collapse affecting nearby households"
                className="premium-input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="Kolkata, West Bengal"
                className="premium-input"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Detailed Report</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Describe what happened, who is affected, immediate needs, severity, and access constraints."
              className="premium-input min-h-44 resize-y"
            />
          </div>

          <label className="rounded-[24px] border border-dashed border-white/20 bg-white/5 px-5 py-6 text-sm text-slate-300">
            <span className="flex items-center gap-2 text-white">
              <UploadCloud className="size-4 text-cyan-200" />
              Optional Image / PDF upload
            </span>
            <p className="mt-2 text-xs text-slate-400">Attach evidence to improve context for AI analysis.</p>
            <input
              type="file"
              accept=".pdf,image/*,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-4 block w-full text-xs text-slate-300"
            />
            {file ? <p className="mt-3 text-xs text-cyan-200">Selected: {file.name}</p> : null}
          </label>

          <div className="flex flex-wrap gap-3">
            <button disabled={busy} className="btn-primary px-6 py-3 text-sm disabled:opacity-70">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze with AI
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setLocation("");
                setText("");
                setFile(null);
                setAnalysisResult(null);
                setMessage(null);
              }}
              className="btn-secondary px-6 py-3 text-sm"
            >
              Clear
            </button>
          </div>
        </form>

        {message ? <div className="mt-5"><ToastMessage tone={message.tone} message={message.text} /></div> : null}
      </GlassCard>

      <GlassCard className="p-6 sm:p-8">
        <SectionHeading
          eyebrow="AI Analysis Result"
          title="Command-ready summary"
          description="Results appear here after analysis, including urgency, recommended action, staffing need, and priority score."
        />

        {analysisResult ? (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                label={getUrgencyMeta(analysisResult.urgency).label}
                className={getUrgencyMeta(analysisResult.urgency).badgeClassName}
              />
              <span className={`text-sm ${getCategoryMeta(analysisResult.category).colorClassName}`}>
                {getCategoryMeta(analysisResult.category).label}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Summary</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{analysisResult.summary}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended Action</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{analysisResult.recommendedAction}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Required Skills</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {analysisResult.skillsNeeded.join(", ") || "General assessment"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Volunteers Needed</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {analysisResult.estimatedVolunteersNeeded}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority Score</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analysisResult.priorityScore}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Context Snapshot</p>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-cyan-200" />
                    {location || "Awaiting location input"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="size-4 text-cyan-200" />
                    {file ? file.name : "Text-only submission"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <Sparkles className="mx-auto size-6 text-cyan-200" />
            <p className="mt-4 text-lg font-medium text-white">Analysis results will appear here</p>
            <p className="mt-2 text-sm text-slate-300">
              Submit a detailed report to unlock summary, urgency, category, staffing estimate, and priority score.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
