"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Loader2, UploadCloud } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";

async function fileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export default function UploadPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) return <AuthPanelNoSSR />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
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
      const analysis = await response.json();

      if (!response.ok) {
        throw new Error(analysis.error ?? "Gemini analysis failed");
      }

      await addDoc(collection(db, "reports"), {
        title,
        location,
        contentType: file?.type ?? "text/plain",
        summary: analysis.summary,
        urgency: analysis.urgency,
        category: analysis.category,
        recommendedAction: analysis.recommendedAction,
        skillsNeeded: analysis.skillsNeeded ?? [],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      setTitle("");
      setLocation("");
      setText("");
      setFile(null);
      setMessage("Report uploaded and analyzed successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Upload survey report</h1>
      <p className="mt-2 text-sm text-slate-300">
        Submit text, image, or PDF; Gemini classifies urgency and recommends next actions.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Report title"
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 outline-none focus:border-cyan-300"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="Location (e.g. Jaipur, Rajasthan)"
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 outline-none focus:border-cyan-300"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste report text or field notes"
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 outline-none focus:border-cyan-300"
        />
        <label className="rounded-xl border border-dashed border-white/30 bg-white/5 px-4 py-6 text-sm text-slate-300">
          <span className="mb-2 flex items-center gap-2">
            <UploadCloud className="size-4" /> Attach image/PDF (optional)
          </span>
          <input
            type="file"
            accept=".pdf,image/*,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs"
          />
        </label>
        <button
          disabled={busy}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 font-medium text-slate-900 disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Analyze & Save
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-slate-200">{message}</p> : null}
    </section>
  );
}
