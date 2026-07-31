import {
  Building2,
  Rocket,
  ShieldCheck
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
  { role: "Founder", title: "Founder", description: "Structure an idea, prepare documents, and track applications.", icon: Rocket },
  { role: "Validator", title: "Validator", description: "Review assigned founder documents after identity approval.", icon: ShieldCheck },
  { role: "Incubator", title: "Institution", description: "Publish programmes or review applications for an organisation.", icon: Building2 }
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
