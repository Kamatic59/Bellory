export type ClientStatus = "Live" | "Setup" | "Pilot" | "Paused" | "Needs Attention";
export type LeadStatus = "New" | "Qualifying" | "Needs Owner" | "Booked" | "Lost" | "Spam";
export type Urgency = "High" | "Medium" | "Low";

export interface Client {
  id: string;
  name: string;
  industry: string;
  status: ClientStatus;
  plan: "Starter" | "Pro" | "Premium";
  mrr: number;
  phone: "Live" | "Setup" | "Issue";
  calendar: "Connected" | "Approval" | "Issue";
  ai: "Live" | "Paused" | "Testing";
  health: number;
  lastLead: string;
  initials: string;
  accent: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  business: string;
  issue: string;
  urgency: Urgency;
  location: string;
  status: LeadStatus;
  value: string;
  age: string;
  summary: string;
}
