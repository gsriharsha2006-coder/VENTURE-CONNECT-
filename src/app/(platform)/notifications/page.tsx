"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { notifications } from "@/lib/data";
import type { PlatformNotification } from "@/lib/types";

export default function NotificationsPage() {
  const items: PlatformNotification[] = notifications;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Badge>Notifications</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Workflow notifications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Application updates, investor interest, meeting requests, report alerts, opportunity posts, and provider verification events.
        </p>
      </motion.div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
