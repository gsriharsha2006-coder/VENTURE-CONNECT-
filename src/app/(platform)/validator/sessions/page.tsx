"use client";

import { CalendarDays, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { validationBookings } from "@/lib/data/validations";

export default function ValidatorSessionsPage() {
  const sessions = validationBookings.filter((booking) => booking.scheduledFor);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <CalendarDays size={13} />
          Sessions
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Upcoming live validation sessions.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Video meetings are attached to validation bookings only. Investor messaging and validator messaging stay separate.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <Badge>{session.serviceType}</Badge>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{session.workspace.startupName}</h2>
                <p className="mt-2 text-sm text-slate-600">{session.scheduledFor} / {session.meetingLanguage}</p>
                <p className="mt-2 text-sm text-slate-500">Founder: {session.founderName}</p>
              </div>
              <Button variant="secondary">
                <Video size={16} />
                Join meeting
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
