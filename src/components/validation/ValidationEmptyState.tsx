import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/FeedbackState";

export function ValidationEmptyState({
  title,
  description,
  action,
  onAction
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={ClipboardCheck}
      action={action && onAction ? (
        <Button onClick={onAction}>
          {action}
        </Button>
      ) : undefined}
    />
  );
}
