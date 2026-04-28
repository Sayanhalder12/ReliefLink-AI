"use client";

import { useMemo, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { BellRing, Check, MapPin, Phone, Users2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { AuthPanelNoSSR } from "@/components/auth-panel-no-ssr";
import type { VolunteerProfile } from "@/lib/types";
import { EmptyState, GlassCard, SectionHeading, StatusBadge, ToastMessage } from "@/components/premium-ui";
import {
  formatRelativeTime,
  getAssignedVolunteerNames,
  getMissionFitScore,
  getReportStatus,
  getUrgencyMeta,
  normalizeCity,
} from "@/lib/report-utils";
import { useBroadcastAlerts, useReports, useVolunteers } from "@/lib/live-data";

const skillOptions = [
  "medical",
  "logistics",
  "food distribution",
  "counseling",
  "rescue",
  "shelter",
  "assessment",
  "coordination",
];

export default function VolunteerPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState("Weekends");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [assignedMissionIds, setAssignedMissionIds] = useState<string[]>([]);
  const [showAllVolunteers, setShowAllVolunteers] = useState(false);
  const { reports } = useReports();
  const { volunteers } = useVolunteers();
  const alerts = useBroadcastAlerts(1);
  const currentVolunteer = useMemo(
    () =>
      [...volunteers]
        .filter((volunteer) => volunteer.uid === user?.uid)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0],
    [user?.uid, volunteers],
  );
  const currentVolunteerId = currentVolunteer?.id;
  const effectiveLocation = useMemo(() => location || currentVolunteer?.location || "", [currentVolunteer?.location, location]);
  const effectiveSkills = useMemo(() => (skills.length ? skills : currentVolunteer?.skills ?? []), [currentVolunteer?.skills, skills]);
  const effectiveAvailability = useMemo(
    () => availability || currentVolunteer?.availability || "Weekends",
    [availability, currentVolunteer?.availability],
  );
  const effectivePhone = useMemo(() => phone || currentVolunteer?.phone || "", [currentVolunteer?.phone, phone]);
  const effectiveName = useMemo(() => name || currentVolunteer?.name || "", [currentVolunteer?.name, name]);

  const matchedReports = useMemo(() => {
    const selectedSkills = effectiveSkills.map((skill) => skill.toLowerCase());
    const city = normalizeCity(effectiveLocation);
    return reports
      .filter((report) => !assignedMissionIds.includes(report.id ?? ""))
      .filter((report) => {
        const assignedIds = report.assignedVolunteerIds ?? (report.assignedVolunteerId ? [report.assignedVolunteerId] : []);
        return !currentVolunteerId || !assignedIds.includes(currentVolunteerId);
      })
      .filter((report) => getReportStatus(report) !== "Resolved")
      .filter((report) => (city ? normalizeCity(report.location) === city : true))
      .filter((report) =>
        effectiveSkills.length
          ? report.skillsNeeded?.some((needed) => selectedSkills.includes(needed.toLowerCase()))
          : true,
      )
      .sort(
        (a, b) =>
          getMissionFitScore(b, effectiveLocation, effectiveSkills) -
          getMissionFitScore(a, effectiveLocation, effectiveSkills),
      );
  }, [assignedMissionIds, currentVolunteerId, effectiveLocation, effectiveSkills, reports]);

  const assignedReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          assignedMissionIds.includes(report.id ?? "") ||
          (currentVolunteerId
            ? (report.assignedVolunteerIds ?? (report.assignedVolunteerId ? [report.assignedVolunteerId] : [])).includes(currentVolunteerId)
            : false),
      ),
    [assignedMissionIds, currentVolunteerId, reports],
  );
  const activeRoster = useMemo(
    () => volunteers.filter((volunteer) => (volunteer.status ?? "active") === "active"),
    [volunteers],
  );
  const visibleRoster = useMemo(
    () => (showAllVolunteers ? activeRoster : activeRoster.slice(0, 6)),
    [activeRoster, showAllVolunteers],
  );

  if (!user) return <AuthPanelNoSSR />;

  const saveProfile = async () => {
    try {
      await addDoc(collection(db, "volunteers"), {
        uid: user.uid,
        name,
        location,
        skills,
        availability,
        phone,
        status: "active",
        createdAt: new Date().toISOString(),
      } satisfies VolunteerProfile & { phone?: string });
      setMessage({ tone: "success", text: "Volunteer profile saved successfully." });
      setName("");
      setLocation("");
      setSkills([]);
      setAvailability("Weekends");
      setPhone("");
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save volunteer profile.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {alerts[0] ? (
        <ToastMessage tone="info" message={`Broadcast Alert: ${alerts[0].message}`} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <GlassCard className="p-6">
          <SectionHeading
            eyebrow="Volunteer Profile"
            title="Stay mission-ready"
            description="Keep your responder profile current so ReliefLink can route the most relevant missions to you."
          />
          <div className="mt-6 space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="premium-input" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="premium-input" />
            <div>
              <p className="mb-3 text-sm text-slate-300">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => {
                  const selected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setSkills((current) =>
                          selected ? current.filter((value) => value !== skill) : [...current, skill],
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        selected
                          ? "border border-cyan-400/30 bg-cyan-400/15 text-cyan-100"
                          : "border border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="premium-input">
              <option className="bg-slate-950">Weekdays</option>
              <option className="bg-slate-950">Weekends</option>
              <option className="bg-slate-950">Anytime</option>
            </select>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="premium-input" />
            <button onClick={saveProfile} className="btn-primary w-full px-5 py-3 text-sm">
              Save Profile
            </button>
            {message ? <ToastMessage tone={message.tone} message={message.text} /> : null}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeading
            eyebrow="Volunteer Identity"
            title="Active responder card"
            description="A quick at-a-glance summary of how your profile is presented to NGOs."
          />
          <div className="mt-6 rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-white">{effectiveName || "Volunteer Name"}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="size-4 text-cyan-200" />
                  {effectiveLocation || "Location not set"}
                </p>
              </div>
              <StatusBadge label="Active" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Skills</p>
                <p className="mt-2 text-sm text-slate-200">{effectiveSkills.join(", ") || "No skills selected yet"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Availability</p>
                <p className="mt-2 text-sm text-slate-200">{effectiveAvailability}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Contact</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <Phone className="size-4 text-cyan-200" />
                  {effectivePhone || "Phone not provided"}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeading
            eyebrow="Volunteer Roster"
            title="Live responder directory"
            description="All profiles saved to Firestore appear here for NGO visibility and assignment."
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <span className="flex items-center gap-2">
              <Users2 className="size-4 text-cyan-200" />
              Total volunteers: {activeRoster.length}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visibleRoster.map((volunteer) => (
            <div key={volunteer.id ?? `${volunteer.uid}-${volunteer.name}`} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{volunteer.name || "Volunteer"}</p>
                <StatusBadge label="Active" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100" />
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>City: {volunteer.location || "Not set"}</p>
                <p>Skills: {(volunteer.skills ?? []).join(", ") || "General support"}</p>
                <p>Availability: {volunteer.availability || "Not set"}</p>
              </div>
            </div>
          ))}
        </div>
        {activeRoster.length > 6 ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllVolunteers((value) => !value)}
              className="btn-secondary px-5 py-3 text-sm"
            >
              {showAllVolunteers ? "Show Less" : "View All Volunteers"}
            </button>
          </div>
        ) : null}
        {!activeRoster.length ? (
          <div className="mt-6">
            <EmptyState title="No volunteer profiles yet" description="Save the first volunteer profile to populate the live roster." />
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeading
          eyebrow="Matched Missions"
          title="Recommended missions based on urgency, skills, and location"
          description="Accept relevant missions and move them into your active assignment queue."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {matchedReports.slice(0, 8).map((report) => {
            const urgency = getUrgencyMeta(report.urgency);
            return (
              <article key={report.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                  <StatusBadge label={urgency.label} className={urgency.badgeClassName} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{report.location}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{report.recommendedAction}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>Task Needed: {(report.skillsNeeded ?? []).join(", ") || "General support"}</p>
                  <p>Time Posted: {formatRelativeTime(report.createdAt)}</p>
                  <p>Mission Fit: {getMissionFitScore(report, effectiveLocation, effectiveSkills)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignedMissionIds((current) => [...new Set([...current, report.id ?? ""])])}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Accept Mission
                  </button>
                  <button type="button" className="btn-secondary px-4 py-2 text-sm">
                    Decline
                  </button>
                  <button type="button" className="btn-secondary px-4 py-2 text-sm">
                    Contact NGO
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!matchedReports.length ? (
          <div className="mt-6">
            <EmptyState
              title="No matched missions yet"
              description="Update your location and skills to improve matching and surface nearby response opportunities."
            />
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeading
          eyebrow="Assigned Missions"
          title="Your active response queue"
          description="Accepted missions appear here so volunteers can focus on the next best action."
        />
        <div className="mt-6 space-y-4">
          {assignedReports.map((report) => (
            <div key={report.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div>
                <p className="font-medium text-white">{report.title}</p>
                <p className="mt-1 text-sm text-slate-300">{report.location}</p>
                <p className="mt-2 text-sm text-slate-400">{report.recommendedAction}</p>
                {getAssignedVolunteerNames(report).length > 0 ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-cyan-100">
                    <BellRing className="size-4 text-cyan-200" />
                    Assigned by NGO dashboard to {getAssignedVolunteerNames(report).join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge label="Assigned" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100" />
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Check className="size-4 text-emerald-200" />
                  In progress
                </span>
              </div>
            </div>
          ))}
          {!assignedReports.length ? (
            <p className="text-sm text-slate-300">Accepted missions will appear here once you choose a response assignment.</p>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
