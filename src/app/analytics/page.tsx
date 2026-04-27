"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Report } from "@/lib/types";

export default function AnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const run = async () => {
      const snap = await getDocs(collection(db, "reports"));
      setReports(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Report) })));
    };
    run();
  }, []);

  const urgencyStats = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach((r) => {
      base[r.urgency] += 1;
    });
    return base;
  }, [reports]);

  const topLocations = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((report) => {
      map.set(report.location, (map.get(report.location) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(urgencyStats).map(([urgency, count]) => (
          <article key={urgency} className="glass rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-slate-300">{urgency}</p>
            <p className="mt-2 text-3xl font-semibold">{count}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="glass rounded-2xl p-6">
          <h2 className="font-semibold">Urgency distribution</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(urgencyStats).map(([urgency, count]) => {
              const percent = reports.length ? Math.round((count / reports.length) * 100) : 0;
              return (
                <div key={urgency}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span className="uppercase">{urgency}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="glass rounded-2xl p-6">
          <h2 className="font-semibold">Top affected locations</h2>
          <div className="mt-4 space-y-3">
            {topLocations.map(([location, count]) => (
              <div key={location} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-sm">{location}</span>
                <span className="text-sm text-slate-300">{count} reports</span>
              </div>
            ))}
            {!topLocations.length ? <p className="text-sm text-slate-300">No analytics data yet.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
