"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanel } from "@/components/auth-panel";
import type { Report } from "@/lib/types";

export default function VolunteerPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("Weekends");
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      const profile = await getDoc(doc(db, "volunteers", user.uid));
      if (profile.exists()) {
        const data = profile.data();
        setName(data.name ?? "");
        setLocation(data.location ?? "");
        setSkills((data.skills ?? []).join(", "));
        setAvailability(data.availability ?? "Weekends");
      }

      const reportSnap = await getDocs(collection(db, "reports"));
      setReports(reportSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Report) })));
    };
    run();
  }, [user]);

  const matchedReports = useMemo(() => {
    const skillList = skills
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return reports
      .filter((report) => report.location.toLowerCase().includes(location.toLowerCase()))
      .filter((report) =>
        report.skillsNeeded?.some((needed) => skillList.includes(needed.toLowerCase())),
      )
      .sort((a, b) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return rank[b.urgency] - rank[a.urgency];
      });
  }, [reports, location, skills]);

  if (!user) return <AuthPanel />;

  const saveProfile = async () => {
    await setDoc(doc(db, "volunteers", user.uid), {
      uid: user.uid,
      name,
      location,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      availability,
    });
    setMessage("Volunteer profile saved.");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
      <section className="glass rounded-2xl p-6">
        <h1 className="text-xl font-semibold">Volunteer profile</h1>
        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Primary location" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, comma separated" className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <option className="bg-slate-900">Weekdays</option>
            <option className="bg-slate-900">Weekends</option>
            <option className="bg-slate-900">Anytime</option>
          </select>
          <button onClick={saveProfile} className="rounded-lg bg-cyan-400 px-4 py-2 font-medium text-slate-900">Save profile</button>
          {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold">Matched opportunities</h2>
        <p className="mt-1 text-sm text-slate-300">Matching by location and skills needed in AI-prioritized reports.</p>
        <div className="mt-4 space-y-3">
          {matchedReports.slice(0, 8).map((report) => (
            <article key={report.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{report.title}</h3>
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">{report.urgency}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{report.recommendedAction}</p>
              <p className="mt-2 text-xs text-slate-400">
                Skills needed: {(report.skillsNeeded ?? []).join(", ") || "General support"}
              </p>
            </article>
          ))}
          {!matchedReports.length ? (
            <p className="text-sm text-slate-300">No matches yet. Update your location/skills to improve matching.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
