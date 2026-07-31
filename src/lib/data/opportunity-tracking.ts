"use client";

import { getBrowserSupabase, getCurrentUserId } from "@/lib/data/shared";
import { isDemoDataEnabled } from "@/lib/demo-data";
import type {
  ExternalRegistration,
  ExternalRegistrationStatus,
  OpportunityAnalyticsEventType
} from "@/lib/types";

const ANALYTICS_KEY = "venture-connect-opportunity-events";
const REGISTRATIONS_KEY = "venture-connect-external-registrations";
const DEMO_USER_ID = "demo-founder";

type AnalyticsRecord = {
  id: string;
  opportunity_id: string;
  user_id: string;
  event_type: OpportunityAnalyticsEventType;
  occurred_at: string;
  referral_source?: string;
};

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") as T ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

async function currentUserId() {
  const userId = await getCurrentUserId("track opportunity activity");
  if (userId) return userId;
  if (isDemoDataEnabled()) return DEMO_USER_ID;
  throw new Error("Opportunity tracking is unavailable because account services are not configured.");
}

export async function recordOpportunityEvent(input: {
  opportunityId: string;
  eventType: OpportunityAnalyticsEventType;
  referralSource?: string;
}) {
  const userId = await currentUserId();
  const record: AnalyticsRecord = {
    id: `opportunity-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    opportunity_id: input.opportunityId,
    user_id: userId,
    event_type: input.eventType,
    occurred_at: new Date().toISOString(),
    referral_source: input.referralSource
  };

  if (userId === DEMO_USER_ID) {
    const local = readStored<AnalyticsRecord[]>(ANALYTICS_KEY, []);
    writeStored(ANALYTICS_KEY, [record, ...local].slice(0, 250));
    return record;
  }

  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Opportunity tracking is unavailable.");
  const { error } = await supabase.from("opportunity_analytics").insert({
    opportunity_id: input.opportunityId,
    user_id: userId,
    event_type: input.eventType,
    referral_source: input.referralSource ?? null
  });
  if (error) throw error;
  return record;
}

export function getExternalRegistrations(fallback: ExternalRegistration[] = []) {
  if (!isDemoDataEnabled()) return fallback;
  const stored = readStored<ExternalRegistration[]>(REGISTRATIONS_KEY, []);
  if (!stored.length) return fallback;
  const merged = new Map(fallback.map((item) => [item.opportunity_id, item]));
  stored.forEach((item) => merged.set(item.opportunity_id, item));
  return Array.from(merged.values());
}

export async function updateExternalRegistration(input: {
  opportunityId: string;
  opportunityTitle: string;
  organizerName: string;
  status: ExternalRegistrationStatus;
  externalApplicationId?: string;
  teamName?: string;
  submissionDate?: string;
  notes?: string;
  confirmationFileName?: string;
}) {
  const userId = await currentUserId();
  const current = getExternalRegistrations();
  const existing = current.find((item) => item.opportunity_id === input.opportunityId);
  const registration: ExternalRegistration = {
    id: existing?.id ?? `external-registration-${Date.now()}`,
    founder_id: userId,
    opportunity_id: input.opportunityId,
    opportunity_title: input.opportunityTitle,
    organizer_name: input.organizerName,
    status: input.status,
    tracked_by_user: true,
    external_application_id: input.externalApplicationId,
    team_name: input.teamName,
    submission_date: input.submissionDate,
    notes: input.notes,
    confirmation_file_name: input.confirmationFileName,
    organizer_verified: false,
    updated_at: new Date().toISOString()
  };
  if (userId === DEMO_USER_ID) {
    const next = [registration, ...current.filter((item) => item.opportunity_id !== input.opportunityId)];
    writeStored(REGISTRATIONS_KEY, next);
  } else {
    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("External registration tracking is unavailable.");
    const { error } = await supabase.from("external_registrations").upsert({
      founder_id: userId,
      opportunity_id: input.opportunityId,
      status: input.status,
      external_application_id: input.externalApplicationId ?? null,
      team_name: input.teamName ?? null,
      submission_date: input.submissionDate || null,
      notes: input.notes ?? null,
      organizer_verified: false,
      updated_at: registration.updated_at
    }, { onConflict: "founder_id,opportunity_id" });
    if (error) throw error;
  }

  await recordOpportunityEvent({
    opportunityId: input.opportunityId,
    eventType: input.status === "Applied Externally" ? "marked_as_applied" : "external_application_status_updated"
  });
  return registration;
}
