"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Download,
  MapPin,
  Megaphone,
  CheckSquare,
  Siren,
  Users2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import type { Report } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";
import {
  EmptyState,
  GlassCard,
  Modal,
  SectionHeading,
  StatCard,
  StatusBadge,
  ToastMessage,
} from "@/components/premium-ui";
import { useReports, useVolunteers } from "@/lib/live-data";
import {
  formatDisplayTime,
  formatRelativeTime,
  getAssignedVolunteerNames,
  getEscalatedUrgency,
  getCategoryMeta,
  getIncidentSortRank,
  getPriorityScore,
  getReportStatus,
  getStatusMeta,
  getUrgencyMeta,
  getVolunteerEstimate,
  normalizeCity,
} from "@/lib/report-utils";

export default function NGODashboardPage() {
  const { user } = useAuth();
  const { reports } = useReports();
  const { volunteers } = useVolunteers();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("Urgent Flood Response Needed in Kolkata");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  const criticalCount = useMemo(() => reports.filter((report) => report.urgency === "critical").length, [reports]);
  const pendingCount = useMemo(() => reports.filter((report) => getReportStatus(report) === "Pending").length, [reports]);
  const resolvedCount = useMemo(() => reports.filter((report) => getReportStatus(report) === "Resolved").length, [reports]);
  const volunteersAssignedToday = useMemo(
    () => reports.filter((report) => Boolean(report.assignedVolunteerId)).length,
    [reports],
  );
  const activity = useMemo(
    () =>
      reports.slice(0, 5).map((report) => {
        const status = getReportStatus(report);
        return `${report.title} marked ${status.toLowerCase()} for ${report.location}`;
      }),
    [reports],
  );
  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const aRank = getIncidentSortRank(a);
        const bRank = getIncidentSortRank(b);

        if (aRank !== bRank) return aRank - bRank;
        if (aRank === 4) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return getPriorityScore(b) - getPriorityScore(a);
      }),
    [reports],
  );
  const availableVolunteers = useMemo(() => {
    if (!selectedReport) return volunteers;
    const reportCity = normalizeCity(selectedReport.location);
    return [...volunteers].sort((a, b) => {
      const aCity = normalizeCity(a.location);
      const bCity = normalizeCity(b.location);
      const aScore =
        (aCity === reportCity ? 2 : 0) +
        (a.skills ?? []).filter((skill) => selectedReport.skillsNeeded?.includes(skill)).length;
      const bScore =
        (bCity === reportCity ? 2 : 0) +
        (b.skills ?? []).filter((skill) => selectedReport.skillsNeeded?.includes(skill)).length;
      return bScore - aScore;
    });
  }, [selectedReport, volunteers]);

  if (!user) {
    return <AuthPanelNoSSR />;
  }

  const assignVolunteer = async () => {
    if (!selectedReport?.id || selectedVolunteerIds.length === 0) return;
    const selectedVolunteers = volunteers.filter((item) => item.id && selectedVolunteerIds.includes(item.id));
    if (selectedVolunteers.length === 0) return;

    try {
      await updateDoc(doc(db, "reports", selectedReport.id), {
        assignedVolunteerId: selectedVolunteers[0]?.id,
        assignedVolunteerName: selectedVolunteers[0]?.name,
        assignedVolunteerIds: selectedVolunteers.map((volunteer) => volunteer.id ?? ""),
        assignedVolunteerNames: selectedVolunteers.map((volunteer) => volunteer.name),
        assignedCount: selectedVolunteers.length,
        status: "Assigned",
      });
      setToast({
        tone: "success",
        message: `${selectedVolunteers.length} volunteer${selectedVolunteers.length > 1 ? "s" : ""} assigned to ${selectedReport.title}.`,
      });
      setSelectedReport(null);
      setSelectedVolunteerIds([]);
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Volunteer assignment failed." });
    }
  };

  const escalateReport = async (report: Report) => {
    if (!report.id) return;
    try {
      const nextUrgency = getEscalatedUrgency(report.urgency);
      await updateDoc(doc(db, "reports", report.id), {
        urgency: nextUrgency,
        priorityScore: Math.min(100, getPriorityScore(report) + 15),
        status: "Escalated",
      });
      setToast({ tone: "success", message: `${report.title} escalated successfully.` });
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Escalation failed." });
    }
  };

  const markResolved = async (report: Report) => {
    if (!report.id) return;
    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: "Resolved",
      });
      setToast({ tone: "success", message: `${report.title} marked as resolved.` });
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Could not update report." });
    }
  };

  const broadcastAlert = async () => {
    try {
      await addDoc(collection(db, "broadcasts"), {
        message: broadcastMessage,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });
      setToast({ tone: "success", message: "Alert broadcast to volunteer hub." });
      setBroadcastOpen(false);
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Broadcast failed." });
    }
  };

  const exportReports = () => {
    const headers = [
      "Title",
      "Location",
      "Urgency",
      "Category",
      "Status",
      "Priority Score",
      "Assigned Volunteer",
      "Created At",
    ];
    const rows = reports.map((report) => [
      report.title,
      report.location,
      report.urgency,
      report.category,
      getReportStatus(report),
      String(getPriorityScore(report)),
      report.assignedVolunteerName ?? "",
      report.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relieflink-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast({ tone: "success", message: "Report export started as CSV." });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-8">
          <SectionHeading
            eyebrow="NGO Dashboard"
            title="Mission control for crisis coordination"
            description="Track urgent incidents, prioritize field response, and coordinate volunteer deployment from one premium command center."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={ClipboardList} label="Total Reports" value={reports.length} />
            <StatCard icon={Siren} label="Critical Reports" value={criticalCount} />
            <StatCard icon={AlertTriangle} label="Pending Cases" value={pendingCount} />
            <StatCard icon={ArrowUpRight} label="Resolved Cases" value={resolvedCount} />
            <StatCard icon={Users2} label="Volunteers Assigned Today" value={volunteersAssignedToday} />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Quick Actions</p>
          <div className="mt-5 grid gap-3">
            <Link href="/ngo/upload" className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/8">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">New Report</p>
                <ArrowUpRight className="size-4 text-cyan-200" />
              </div>
              <p className="mt-2 text-sm text-slate-300">Upload a fresh field report and trigger AI triage instantly.</p>
            </Link>
            <button
              type="button"
              onClick={() => setBroadcastOpen(true)}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">Broadcast Alert</p>
                <Megaphone className="size-4 text-cyan-200" />
              </div>
              <p className="mt-2 text-sm text-slate-300">Notify volunteer coordinators about top-priority incidents.</p>
            </button>
            <button
              type="button"
              onClick={exportReports}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">Export Reports</p>
                <Download className="size-4 text-cyan-200" />
              </div>
              <p className="mt-2 text-sm text-slate-300">Prepare summaries for judges, donors, or partner agencies.</p>
            </button>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              eyebrow="Live Incident Feed"
              title="Incoming reports prioritized by urgency"
              description="Every incident card shows AI triage details, staffing needs, and immediate response actions."
            />
          </div>

          <div className="mt-6 space-y-4">
            {sortedReports.slice(0, 8).map((report) => {
              const urgency = getUrgencyMeta(report.urgency);
              const category = getCategoryMeta(report.category);
              const status = getReportStatus(report);
              const statusMeta = getStatusMeta(status);
              const assignedNames = getAssignedVolunteerNames(report);

              return (
                <article
                  key={report.id}
                  className={`rounded-[28px] border border-white/10 bg-gradient-to-r ${statusMeta.glowClassName} p-5 ${
                    status === "Resolved" ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                        <StatusBadge label={urgency.label} className={urgency.badgeClassName} />
                        <StatusBadge label={statusMeta.label} className={statusMeta.badgeClassName} />
                        <span className={`text-sm ${category.colorClassName}`}>{category.label}</span>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{report.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Priority Score</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{getPriorityScore(report)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl bg-slate-950/25 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Location</p>
                      <p className="mt-2 flex items-center gap-2 text-slate-200">
                        <MapPin className="size-4 text-cyan-200" />
                        {report.location}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/25 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timestamp</p>
                      <p className="mt-2 text-slate-200">{formatDisplayTime(report.createdAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/25 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Volunteers Needed</p>
                      <p className="mt-2 text-slate-200">{getVolunteerEstimate(report.urgency)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/25 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <StatusBadge label={statusMeta.label} className={`mt-2 ${statusMeta.badgeClassName}`} />
                    </div>
                    <div className="rounded-2xl bg-slate-950/25 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Skills</p>
                      <p className="mt-2 text-slate-200">{(report.skillsNeeded ?? []).slice(0, 2).join(", ") || "General support"}</p>
                    </div>
                  </div>
                  {assignedNames.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">
                      <p className="font-medium">Assigned Volunteers:</p>
                      <div className="mt-2 space-y-1">
                        {assignedNames.map((name) => (
                          <p key={name}>{name}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(report);
                        setSelectedVolunteerIds(report.assignedVolunteerIds ?? (report.assignedVolunteerId ? [report.assignedVolunteerId] : []));
                      }}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Assign Volunteers
                    </button>
                    <button type="button" onClick={() => void escalateReport(report)} className="btn-secondary px-4 py-2 text-sm">
                      Escalate
                    </button>
                    <button type="button" onClick={() => void markResolved(report)} className="btn-secondary px-4 py-2 text-sm">
                      Mark Resolved
                    </button>
                    <button type="button" onClick={() => setDetailReport(report)} className="btn-secondary px-4 py-2 text-sm">
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
            {!reports.length ? (
              <EmptyState
                title="No incident reports yet"
                description="Upload your first field report to populate the command center and trigger AI triage."
              />
            ) : null}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeading
            eyebrow="Recent Response Activity"
            title="Operational timeline"
            description="Quick visibility into how the most recent incidents are progressing."
          />
          <div className="mt-6 space-y-4">
            {reports.slice(0, 6).map((report, index) => (
              <div key={report.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-3 w-3 rounded-full bg-cyan-300" />
                  {index < Math.min(reports.length, 6) - 1 ? <div className="mt-2 h-full w-px bg-white/10" /> : null}
                </div>
                <div className="pb-6">
                  <p className="text-sm font-medium text-white">{activity[index] ?? report.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{report.recommendedAction}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {formatRelativeTime(report.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {!reports.length ? (
              <p className="text-sm text-slate-300">Activity updates will appear once reports start flowing into the workspace.</p>
            ) : null}
          </div>
        </GlassCard>
      </section>

      {toast ? <ToastMessage tone={toast.tone} message={toast.message} /> : null}

      <Modal
        open={Boolean(selectedReport)}
        title="Assign volunteer"
        description="Select an available volunteer from Firestore and link them to this incident."
        onClose={() => {
          setSelectedReport(null);
          setSelectedVolunteerIds([]);
        }}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">{selectedReport?.title}</p>
            <p className="mt-2 text-sm text-slate-300">{selectedReport?.location}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">
              Volunteers needed: {selectedReport ? getVolunteerEstimate(selectedReport.urgency) : 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Select one or more volunteers. If only a few are available, assign all available responders.
            </p>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {availableVolunteers.map((volunteer) => (
              (() => {
                const volunteerId = volunteer.id;
                return (
                  <label
                    key={volunteerId ?? volunteer.uid}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(volunteerId && selectedVolunteerIds.includes(volunteerId))}
                      onChange={() => {
                        if (!volunteerId) return;
                        setSelectedVolunteerIds((current) =>
                          current.includes(volunteerId)
                            ? current.filter((id) => id !== volunteerId)
                            : [...current, volunteerId],
                        );
                      }}
                      className="mt-1 size-4 rounded border-white/20 bg-slate-950 text-cyan-300"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-white">{volunteer.name}</p>
                      <p className="mt-1 text-slate-300">{volunteer.location}</p>
                      <p className="mt-1 text-slate-400">{(volunteer.skills ?? []).join(", ") || "General"}</p>
                    </div>
                  </label>
                );
              })()
            ))}
          </div>
          <button type="button" onClick={() => void assignVolunteer()} className="btn-primary w-full px-5 py-3 text-sm">
            <CheckSquare className="size-4" />
            Confirm Assignment
          </button>
        </div>
      </Modal>

      <Modal
        open={broadcastOpen}
        title="Broadcast alert"
        description="Send a live in-app banner to the volunteer hub."
        onClose={() => setBroadcastOpen(false)}
      >
        <div className="space-y-4">
          <textarea
            value={broadcastMessage}
            onChange={(event) => setBroadcastMessage(event.target.value)}
            rows={4}
            className="premium-input min-h-32 resize-none"
          />
          <button type="button" onClick={() => void broadcastAlert()} className="btn-primary w-full px-5 py-3 text-sm">
            Send Broadcast
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailReport)}
        title="Incident details"
        description="Full report context for NGO coordination."
        onClose={() => setDetailReport(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-lg font-semibold text-white">{detailReport?.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{detailReport?.summary}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Location</p>
            <p className="mt-2 text-sm text-slate-200">{detailReport?.location}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timestamp</p>
            <p className="mt-2 text-sm text-slate-200">
              {detailReport ? formatDisplayTime(detailReport.createdAt) : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Skills Needed</p>
            <p className="mt-2 text-sm text-slate-200">{detailReport?.skillsNeeded?.join(", ") || "General support"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned Volunteers</p>
            <div className="mt-2 text-sm text-slate-200">
              {detailReport && getAssignedVolunteerNames(detailReport).length > 0
                ? getAssignedVolunteerNames(detailReport).map((name) => <p key={name}>{name}</p>)
                : "Unassigned"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
            <p className="mt-2 text-sm text-slate-200">{detailReport ? getReportStatus(detailReport) : ""}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
