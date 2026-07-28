"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifications } from "@/lib/data";
import type { PlatformNotification } from "@/lib/types";

export default function NotificationsPage() {
  const items: PlatformNotification[] = notifications;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Workflow notifications"
        description="Application updates, investor interest, meeting requests, reports, opportunities, and verification events."
      />

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="rounded-lg bg-blue-50 p-2 text-primary">
                    <Bell size={18} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{item.type}</Badge>
                      {!item.read && <Badge tone="amber">New</Badge>}
                    </div>
                    <p className="mt-2 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm">
                  <CheckCircle2 size={14} />
                  Mark read
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
