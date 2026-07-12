import { redirect } from "next/navigation";

export default function LegacyReadinessRedirect() {
  redirect("/vc-readiness");
}
