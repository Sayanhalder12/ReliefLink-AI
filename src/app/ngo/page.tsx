"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { AlertTriangle, ArrowUpRight, ClipboardList, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import type { Report } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";

export default function NGODashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const run = async () => {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      setReports(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Report) })));
    };
    run();
  }, []);

  const criticalCount = useMemo(
    () => reports.filter((report) => ["critical", "high"].includes(report.urgency)).length,
    [reports],
  );

  if (!user) {
    return <AuthPanelNoSSR />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass rounded-2xl p-5">
          <ClipboardList className="size-5 text-cyan-200" />
          <p className="mt-3 text-sm text-slate-300">Total reports</p>
          <p className="mt-1 text-2xl font-semibold">{reports.length}</p>
        </article>
        <article className="glass rounded-2xl p-5">
          <AlertTriangle className="size-5 text-amber-200" />
          <p className="mt-3 text-sm text-slate-300">Critical + high</p>
          <p className="mt-1 text-2xl font-semibold">{criticalCount}</p>
        </article>
        <Link href="/ngo/upload" className="glass rounded-2xl p-5 hover:bg-white/10">
          <ArrowUpRight className="size-5 text-emerald-200" />
          <p className="mt-3 text-sm text-slate-300">Add new report</p>
          <p className="mt-1 text-2xl font-semibold">Upload</p>
        </Link>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Recent incident reports</h2>
        <div className="mt-4 space-y-3">
          {reports.slice(0, 8).map((report) => (
            <article
              key={report.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 sm:flex sm:items-start sm:justify-between"
            >
              <div>
                <h3 className="font-medium">{report.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{report.summary}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="size-3.5" /> {report.location}
                </p>
              </div>
              <span className="mt-3 inline-block rounded-full border border-white/20 px-3 py-1 text-xs uppercase sm:mt-0">
                {report.urgency}
              </span>
            </article>
          ))}
          {!reports.length ? <p className="text-slate-300">No reports uploaded yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
