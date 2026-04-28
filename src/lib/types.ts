export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export type Report = {
  id?: string;
  title: string;
  location: string;
  contentType: string;
  summary: string;
  urgency: UrgencyLevel;
  category: string;
  recommendedAction: string;
  skillsNeeded: string[];
  createdBy: string;
  createdAt: string;
  status?: "Pending" | "Assigned" | "Resolved" | "Escalated";
  priorityScore?: number;
  volunteersNeeded?: number;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerIds?: string[];
  assignedVolunteerNames?: string[];
  assignedCount?: number;
};

export type VolunteerProfile = {
  id?: string;
  uid: string;
  name: string;
  location: string;
  skills: string[];
  availability: string;
  phone?: string;
  status?: "active" | "inactive";
  createdAt?: string;
};

export type BroadcastAlert = {
  id?: string;
  message: string;
  createdAt: string;
  createdBy: string;
};
