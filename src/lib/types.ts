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
};

export type VolunteerProfile = {
  uid: string;
  name: string;
  location: string;
  skills: string[];
  availability: string;
};
