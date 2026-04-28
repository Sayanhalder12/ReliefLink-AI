import type { Report, UrgencyLevel } from "@/lib/types";

export const urgencyOrder: Record<UrgencyLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const urgencyMeta: Record<
  UrgencyLevel,
  {
    label: string;
    badgeClassName: string;
    glowClassName: string;
    volunteerEstimate: number;
  }
> = {
  critical: {
    label: "Critical",
    badgeClassName: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    glowClassName: "from-rose-500/20 to-red-500/10",
    volunteerEstimate: 6,
  },
  high: {
    label: "High",
    badgeClassName: "border-amber-400/40 bg-amber-500/15 text-amber-100",
    glowClassName: "from-amber-500/20 to-yellow-500/10",
    volunteerEstimate: 4,
  },
  medium: {
    label: "Medium",
    badgeClassName: "border-blue-400/40 bg-blue-500/15 text-blue-100",
    glowClassName: "from-blue-500/20 to-cyan-500/10",
    volunteerEstimate: 2,
  },
  low: {
    label: "Low",
    badgeClassName: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    glowClassName: "from-emerald-500/20 to-lime-500/10",
    volunteerEstimate: 1,
  },
};

export const categoryMeta: Record<
  string,
  {
    label: string;
    colorClassName: string;
  }
> = {
  health: { label: "Health", colorClassName: "text-rose-200" },
  shelter: { label: "Shelter", colorClassName: "text-violet-200" },
  food: { label: "Food", colorClassName: "text-amber-200" },
  water: { label: "Water", colorClassName: "text-cyan-200" },
  rescue: { label: "Rescue", colorClassName: "text-red-200" },
  safety: { label: "Safety", colorClassName: "text-orange-200" },
  logistics: { label: "Logistics", colorClassName: "text-blue-200" },
  other: { label: "Other", colorClassName: "text-slate-200" },
};

export function getUrgencyMeta(urgency: UrgencyLevel) {
  return urgencyMeta[urgency] ?? urgencyMeta.low;
}

export function getCategoryMeta(category: string) {
  return categoryMeta[category] ?? categoryMeta.other;
}

export function getVolunteerEstimate(urgency: UrgencyLevel) {
  return getUrgencyMeta(urgency).volunteerEstimate;
}

export function formatRelativeTime(input: string) {
  const time = new Date(input).getTime();
  if (Number.isNaN(time)) return "Unknown time";

  const diffMs = Date.now() - time;
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDisplayTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getReportStatus(report: Report) {
  if ("status" in report && typeof report.status === "string") {
    return report.status;
  }
  return report.urgency === "low" ? "Resolved" : "Pending";
}

export function getPriorityScore(report: Report) {
  if ("priorityScore" in report && typeof report.priorityScore === "number") {
    return report.priorityScore;
  }
  return urgencyOrder[report.urgency] * 20 + Math.min((report.skillsNeeded?.length ?? 0) * 5, 20);
}

export function getStatusMeta(status: string) {
  if (status === "Resolved") {
    return {
      label: "Resolved",
      badgeClassName: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
      glowClassName: "from-emerald-500/20 to-lime-500/10",
    };
  }

  if (status === "Escalated") {
    return {
      label: "Escalated",
      badgeClassName: "border-violet-400/40 bg-violet-500/15 text-violet-100",
      glowClassName: "from-violet-500/20 to-orange-500/10",
    };
  }

  if (status === "Assigned") {
    return {
      label: "In Progress",
      badgeClassName: "border-amber-400/40 bg-amber-500/15 text-amber-100",
      glowClassName: "from-amber-500/20 to-yellow-500/10",
    };
  }

  return {
    label: "Open",
    badgeClassName: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    glowClassName: "from-rose-500/20 to-red-500/10",
  };
}

export function getEscalatedUrgency(urgency: UrgencyLevel): UrgencyLevel {
  if (urgency === "low") return "medium";
  if (urgency === "medium") return "high";
  return "critical";
}

export function normalizeCity(input: string) {
  return input.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function getMissionFitScore(report: Report, volunteerLocation: string, volunteerSkills: string[]) {
  let score = urgencyOrder[report.urgency] * 25;

  if (volunteerLocation && report.location.toLowerCase().includes(volunteerLocation.toLowerCase())) {
    score += 25;
  }

  const normalizedSkills = volunteerSkills.map((skill) => skill.toLowerCase());
  const matches =
    report.skillsNeeded?.filter((skill) => normalizedSkills.includes(skill.toLowerCase())).length ?? 0;

  score += matches * 15;

  return score;
}

export function getAssignedVolunteerNames(report: Report) {
  if (Array.isArray(report.assignedVolunteerNames) && report.assignedVolunteerNames.length > 0) {
    return report.assignedVolunteerNames;
  }

  if (report.assignedVolunteerName) {
    return [report.assignedVolunteerName];
  }

  return [];
}

export function getIncidentSortRank(report: Report) {
  const status = getReportStatus(report);

  if (status === "Resolved") return 4;
  if (status === "Assigned") return 2;
  if (status === "Escalated") return 3;
  if (report.urgency === "critical") return 0;
  return 1;
}
