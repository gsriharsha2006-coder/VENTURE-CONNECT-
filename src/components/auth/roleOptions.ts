import {
  Building2,
  Rocket
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/types";

export type PrimaryAccountType = "Founder" | "Organisation";

export type RoleOption = {
  role: PrimaryAccountType;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const roleOptions: RoleOption[] = [
  { role: "Founder", title: "Founder / Student", description: "Structure an idea, prepare applications, and track organisation interest.", icon: Rocket },
  { role: "Organisation", title: "Organisation", description: "Publish opportunities and review applications submitted to your organisation.", icon: Building2 }
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
