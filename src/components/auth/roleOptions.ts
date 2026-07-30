import {
  Banknote,
  Building2,
  CalendarRange,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/types";

export type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const roleOptions: RoleOption[] = [
  { role: "Founder", title: "Founder", description: "Build documents, validate ideas, and apply to opportunities.", icon: Rocket },
  { role: "Investor", title: "Investor", description: "Review structured startup applications and signal interest.", icon: Banknote },
  { role: "Incubator", title: "Incubator", description: "Publish programs and evaluate founder applications.", icon: GraduationCap },
  { role: "Validator", title: "Validator", description: "Review Idea Workspace documents after verification.", icon: ShieldCheck },
  { role: "Hackathon Organizer", title: "Hackathon organizer", description: "Publish hackathons and manage external registrations.", icon: CalendarRange },
  { role: "Event Organizer", title: "Event organizer", description: "Run startup events, grants, and competitions.", icon: Building2 },
  { role: "Service Provider", title: "Service provider", description: "Offer approved professional services to founders.", icon: Wrench }
];

export function companyLabel(role: UserRole) {
  if (role === "Founder") return "Startup name (optional)";
  if (role === "Investor") return "Fund or firm name (optional)";
  if (role === "Incubator") return "Incubator or institution";
  if (role === "Hackathon Organizer" || role === "Event Organizer") return "Organization";
  if (role === "Service Provider") return "Firm or company";
  if (role === "Validator") return "Institution or company";
  return "Organization";
}
