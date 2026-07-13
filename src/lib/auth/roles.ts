import type { UserRole } from "@/lib/types";

export type DatabaseRole =
  | "founder"
  | "investor"
  | "incubator"
  | "hackathon_organizer"
  | "event_organizer"
  | "service_provider"
  | "admin";

const roleMap: Record<UserRole, DatabaseRole> = {
  Founder: "founder",
  Investor: "investor",
  Incubator: "incubator",
  "Hackathon Organizer": "hackathon_organizer",
  "Event Organizer": "event_organizer",
  "Service Provider": "service_provider",
  Admin: "admin"
};

const userRoleMap: Record<DatabaseRole, UserRole> = {
  founder: "Founder",
  investor: "Investor",
  incubator: "Incubator",
  hackathon_organizer: "Hackathon Organizer",
  event_organizer: "Event Organizer",
  service_provider: "Service Provider",
  admin: "Admin"
};

export function toDatabaseRole(role: UserRole | string): DatabaseRole {
  if (role in roleMap) return roleMap[role as UserRole];
  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, "_") as DatabaseRole;
  return normalized in userRoleMap ? normalized : "founder";
}

export function toUserRole(role: string | null | undefined): UserRole {
  return userRoleMap[toDatabaseRole(role ?? "founder")];
}

export function dashboardForRole(role: UserRole | DatabaseRole | string) {
  const databaseRole = toDatabaseRole(role);
  if (["investor", "incubator", "hackathon_organizer", "event_organizer"].includes(databaseRole)) {
    return "/investor/discover";
  }
  if (databaseRole === "service_provider") return "/provider/dashboard";
  if (databaseRole === "admin") return "/admin";
  return "/dashboard";
}
