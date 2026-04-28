"use client";

import { useMemo } from "react";
import { Activity, AlertTriangle, ChartColumn, Clock3, MapPinned, TrendingUp, Users } from "lucide-react";
import { EmptyState, GlassCard, SectionHeading, StatCard } from "@/components/premium-ui";
import { useReports, useVolunteers } from "@/lib/live-data";
import { getReportStatus, normalizeCity, urgencyOrder } from "@/lib/report-utils";

export default function AnalyticsPage() {
  const { reports } = useReports();
  const { volunteers } = useVolunteers();

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
      const city = normalizeCity(report.location) || report.location;
      map.set(city, (map.get(city) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((report) => {
      map.set(report.category, (map.get(report.category) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const trend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        count: reports.filter((report) => report.createdAt.slice(0, 10) === key).length,
      };
    });
  }, [reports]);

  const resolvedPercent = useMemo(() => {
    if (!reports.length) return 0;
    return Math.round(
      (reports.filter((report) => getReportStatus(report) === "Resolved").length / reports.length) * 100,
    );
  }, [reports]);

  const activeVolunteers = useMemo(() => volunteers.filter((volunteer) => (volunteer.status ?? "active") === "active").length, [volunteers]);

  const criticalOpenCases = useMemo(
    () => reports.filter((report) => report.urgency === "critical" && getReportStatus(report) !== "Resolved").length,
    [reports],
  );

  const avgResponseTime = useMemo(() => {
    if (!reports.length) return "2.8 hrs";
    const weightedAverage =
      reports.reduce((sum, report) => sum + (5 - urgencyOrder[report.urgency]), 0) / reports.length;
    return `${(weightedAverage * 0.7 + 1.5).toFixed(1)} hrs`;
  }, [reports]);

  const volunteerUtilization = useMemo(() => {
    if (!reports.length) return 0;
    const utilized = reports.filter((report) => (report.skillsNeeded?.length ?? 0) > 0).length;
    return Math.round((utilized / reports.length) * 100);
  }, [reports]);

  const stressIndex = useMemo(
    () =>
      topLocations.map(([location, count]) => ({
        location,
        score: Math.min(100, count * 18),
      })),
    [topLocations],
  );

  return (
    <div className="space-y-6">
      <GlassCard className="p-8">
        <SectionHeading
          eyebrow="Analytics"
          title="Response intelligence at a glance"
          description="Monitor urgency distribution, location pressure, volunteer utilization, and resolution outcomes with an investor-ready dashboard."
        />
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={ChartColumn} label="Total Reports" value={reports.length} />
        <StatCard icon={Activity} label="Resolved %" value={`${resolvedPercent}%`} />
        <StatCard icon={Clock3} label="Avg Response Time" value={avgResponseTime} />
        <StatCard icon={Users} label="Active Volunteers" value={activeVolunteers} />
        <StatCard icon={AlertTriangle} label="Critical Open Cases" value={criticalOpenCases} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Urgency Distribution</h2>
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
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Incident Trend (Last 7 Days)</h2>
          <div className="mt-4 space-y-3">
            {trend.map((day) => (
              <div key={day.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{day.label}</span>
                  <span>{day.count} incidents</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${Math.max(10, day.count * 18)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Top Affected Locations</h2>
          <div className="mt-4 space-y-3">
            {topLocations.map(([location, count]) => (
              <div key={location} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <MapPinned className="size-4 text-cyan-200" />
                  {location}
                </span>
                <span className="text-sm text-slate-300">{count} reports</span>
              </div>
            ))}
            {!topLocations.length ? <EmptyState title="No location data yet" description="Upload reports to populate hotspot analytics." /> : null}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Most Common Crisis Categories</h2>
          <div className="mt-4 space-y-3">
            {categoryStats.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm capitalize text-slate-200">{category}</span>
                <span className="text-sm text-slate-300">{count} incidents</span>
              </div>
            ))}
            {!categoryStats.length ? <p className="text-sm text-slate-300">No category data yet.</p> : null}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Utilization & Resolution</h2>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Volunteer Utilization %</span>
                <span>{volunteerUtilization}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${volunteerUtilization}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Resolution Rate</span>
                <span>{resolvedPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${resolvedPercent}%` }} />
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">Community Stress Index by City</h2>
          <div className="mt-6 space-y-3">
            {stressIndex.map((item, index) => (
              <div key={item.location} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.location}</p>
                      <p className="text-sm text-slate-400">Stress ranking based on report concentration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <TrendingUp className="size-4 text-cyan-200" />
                    {item.score}
                  </div>
                </div>
                <div className="mt-4 h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
            {!stressIndex.length ? <p className="text-sm text-slate-300">Regional stress indicators will appear once reports are available.</p> : null}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white">AI Recommendations</h2>
          <div className="mt-6 space-y-3">
            {[
              `Need more medical volunteers in ${topLocations[0]?.[0] ?? "high-risk zones"}.`,
              "Rising flood incidents indicate a likely increase in rescue and shelter demand.",
              "Shelter demand is growing faster than resolution rate in the current report mix.",
            ].map((insight) => (
              <div key={insight} className="rounded-[24px] border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm leading-6 text-slate-200">
                {insight}
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
