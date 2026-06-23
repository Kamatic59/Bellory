import { Client, Lead } from "@/lib/types";

export const clients: Client[] = [
  { id: "davis", name: "Davis Garage Doors", industry: "Garage Door Repair", status: "Live", plan: "Premium", mrr: 799, phone: "Live", calendar: "Connected", ai: "Live", health: 96, lastLead: "2m ago", initials: "DG", accent: "#C7F76F" },
  { id: "wasatch", name: "Wasatch Door Co.", industry: "Garage Door Repair", status: "Setup", plan: "Pro", mrr: 499, phone: "Live", calendar: "Approval", ai: "Testing", health: 84, lastLead: "18m ago", initials: "WD", accent: "#F6C66A" },
  { id: "peak", name: "Peak Plumbing", industry: "Plumbing", status: "Pilot", plan: "Pro", mrr: 499, phone: "Live", calendar: "Connected", ai: "Live", health: 91, lastLead: "7m ago", initials: "PP", accent: "#D98B3E" },
  { id: "canyon", name: "Canyon HVAC", industry: "HVAC", status: "Needs Attention", plan: "Premium", mrr: 799, phone: "Live", calendar: "Issue", ai: "Live", health: 68, lastLead: "12m ago", initials: "CH", accent: "#E05F45" },
  { id: "summit", name: "Summit Electric", industry: "Electrical", status: "Live", plan: "Starter", mrr: 299, phone: "Live", calendar: "Connected", ai: "Live", health: 93, lastLead: "1h ago", initials: "SE", accent: "#BFA777" },
  { id: "clearflow", name: "ClearFlow Plumbing", industry: "Plumbing", status: "Paused", plan: "Pro", mrr: 499, phone: "Setup", calendar: "Connected", ai: "Paused", health: 76, lastLead: "Yesterday", initials: "CP", accent: "#8FAE5F" },
];

export const leads: Lead[] = [
  { id: "sarah", name: "Sarah Thompson", phone: "(801) 555-0138", business: "Davis Garage Doors", issue: "Broken spring", urgency: "High", location: "Bountiful, UT", status: "Needs Owner", value: "$680", age: "2m", summary: "Caller said the car is trapped inside. Receptionist captured door position, safety risk, city, and requested owner approval for the soonest slot." },
  { id: "mike", name: "Mike Rivera", phone: "(801) 555-0194", business: "Peak Plumbing", issue: "Active water leak", urgency: "High", location: "Salt Lake City, UT", status: "Qualifying", value: "$1,200", age: "7m", summary: "Voice receptionist gathered leak location, shutoff status, property type, and emergency contact details." },
  { id: "jen", name: "Jen Lee", phone: "(385) 555-0102", business: "Canyon HVAC", issue: "AC not cooling", urgency: "Medium", location: "Sandy, UT", status: "New", value: "$420", age: "12m", summary: "Caller reported warm air and indoor temperature. Receptionist checked service area and prepared diagnostic appointment options." },
  { id: "brandon", name: "Brandon P.", phone: "(801) 555-0173", business: "Wasatch Door Co.", issue: "Price shopper", urgency: "Low", location: "Draper, UT", status: "Qualifying", value: "$300", age: "24m", summary: "Caller asked for opener replacement pricing. Receptionist used the pricing guardrail and asked qualifying questions before quoting a range." },
  { id: "lisa", name: "Lisa Morgan", phone: "(435) 555-0166", business: "Summit Electric", issue: "Outlet sparking", urgency: "High", location: "Park City, UT", status: "Booked", value: "$850", age: "38m", summary: "Receptionist told caller to avoid the outlet, notified the owner, and booked a 3:30 PM appointment." },
];
