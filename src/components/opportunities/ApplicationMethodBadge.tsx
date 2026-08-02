import { ClipboardList, ExternalLink, FileText, Info, Split } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { APPLICATION_METHOD_LABELS } from "@/lib/opportunities/application-methods";
import type { ApplicationMethod } from "@/lib/types";

const icons = {
  internal_registration: ClipboardList,
  external_registration: ExternalLink,
  idea_workspace_application: FileText,
  hybrid_application: Split,
  information_only: Info
};

export function ApplicationMethodBadge({ method }: { method: ApplicationMethod }) {
  const Icon = icons[method];
  return (
    <Badge tone={method === "external_registration" ? "blue" : method === "idea_workspace_application" ? "green" : "slate"}>
      <Icon size={13} />
      {APPLICATION_METHOD_LABELS[method]}
    </Badge>
  );
}
