"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { Badge } from "@/components/ui/Badge";

export default function MessagingPage() {
  const investorMode = usePathname().startsWith("/investor");
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Badge>
          <MessageCircle size={13} />
          Messaging
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{investorMode ? "Founder conversations" : "Interest-gated conversations"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          {investorMode
            ? "Send messages, feedback, and meeting details after marking a founder application Interested."
            : "Founders cannot freely message investors first. Threads unlock only after an investor or incubator marks an application Interested."}
        </p>
      </motion.div>
      <MessagingPanel />
    </div>
  );
}
