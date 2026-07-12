import { redirect } from "next/navigation";

export default function VcReadinessRedirect() {
  redirect("/dashboard/vc-readiness");
}
