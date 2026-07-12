import { CalendarPlus, Clock3, Crown, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const mentorSlots = [
  {
    mentor: "Priya Menon",
    title: "Ex-Stripe GTM, SaaS mentor",
    time: "Tue, 5:30 PM",
    status: "2 seats left"
  },
  {
    mentor: "Karan Malhotra",
    title: "Unicorn product operator",
    time: "Thu, 7:00 PM",
    status: "Waitlist"
  },
  {
    mentor: "Leah Thomas",
    title: "Seed-stage VC partner",
    time: "Sat, 11:00 AM",
    status: "Premium only"
  }
];

export function MentorshipPanel() {
  return (
    <Card>
      <CardHeader
        eyebrow="Unicorn mentorship"
        title="Premium mentor access"
        action={<Badge tone="amber">Premium</Badge>}
      />
      <div className="space-y-3">
        {mentorSlots.map((slot) => (
          <div key={slot.mentor} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="rounded-lg bg-white p-2 text-primary shadow-sm">
                  <UsersRound size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{slot.mentor}</p>
                  <p className="text-xs text-slate-500">{slot.title}</p>
                </div>
              </div>
              <Badge tone={slot.status === "Waitlist" ? "slate" : "blue"}>{slot.status}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} className="text-primary" />
                {slot.time}
              </span>
              <Button size="sm" variant={slot.status === "Waitlist" ? "secondary" : "primary"}>
                {slot.status === "Waitlist" ? (
                  <Crown size={15} />
                ) : (
                  <CalendarPlus size={15} />
                )}
                {slot.status === "Waitlist" ? "Join waitlist" : "Book"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
