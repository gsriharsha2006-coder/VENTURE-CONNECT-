"use client";

import { useState } from "react";
import { FileText, MessageSquare, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { validationBookings } from "@/lib/data/validations";

export default function ValidatorMessagesPage() {
  const [selectedId, setSelectedId] = useState(validationBookings[0].id);
  const selected = validationBookings.find((booking) => booking.id === selectedId) ?? validationBookings[0];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <MessageSquare size={13} />
          Validation Messages
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Messages tied to booked validations only.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          This inbox is for assigned validator-founder bookings. It does not create investor conversations or public chat.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader eyebrow="Threads" title="Booked validations" />
          <div className="space-y-3">
            {validationBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => setSelectedId(booking.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${selectedId === booking.id ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}
              >
                <p className="text-sm font-semibold text-slate-950">{booking.workspace.startupName}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.founderName} / {booking.status}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow={selected.serviceType} title={selected.workspace.startupName} />
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="max-w-[86%] rounded-xl bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
              System: Validation booking created. Attachments and meeting links are visible only to booking participants.
            </div>
            <div className="ml-auto max-w-[86%] rounded-xl bg-primary p-3 text-sm leading-6 text-white shadow-panel">
              Validator: I will focus on the areas requested and reference the selected document version.
            </div>
            <div className="max-w-[86%] rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
              <FileText size={15} className="mr-1 inline" />
              Report-delivery notification will appear here when submitted.
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" aria-label="Attach file" className="rounded-xl border border-slate-200 p-2.5 text-slate-500">
              <Paperclip size={18} />
            </button>
            <input className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="Reply in validation context..." />
            <Button>Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
