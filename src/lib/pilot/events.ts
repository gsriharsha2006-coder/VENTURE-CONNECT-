export const PILOT_EVENT_NAMES = [
  "founder_registered", "idea_created", "idea_section_completed", "idea_completed", "readiness_report_generated",
  "incubation_application_started", "quality_check_failed", "quality_check_passed", "application_corrected",
  "incubation_application_submitted", "incubation_application_reviewed", "incubation_application_interested",
  "conversation_created", "hackathon_viewed", "hackathon_application_started", "hackathon_application_submitted",
  "external_hackathon_marked_applied"
] as const;
export type PilotEventName = (typeof PILOT_EVENT_NAMES)[number];
export async function recordPilotEvent(eventName: PilotEventName, metadata: Record<string, unknown> = {}) {
  try {
    await fetch("/api/pilot/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName, metadata }), keepalive: true });
  } catch {
    // Product workflows must not fail when optional pilot analytics are unavailable.
  }
}
