import { ArrowUp, Bookmark, MessageCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { FeedPost } from "@/lib/types";

export function FeedCard({ post }: { post: FeedPost }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate">{post.type}</Badge>
            <span className="text-xs font-medium text-slate-500">{post.postedAt}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{post.body}</p>
        </div>
        <div className="hidden rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center sm:block">
          <Sparkles size={16} className="mx-auto text-primary" />
          <p className="mt-1 text-sm font-semibold text-blue-900">{post.score}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
            {post.author
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">{post.author}</p>
            <p className="text-xs text-slate-500">
              {post.company ?? post.role} {post.university ? `/ ${post.university}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={16} />
            {post.upvotes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={16} />
            {post.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark size={16} />
            Save
          </span>
        </div>
      </div>
    </Card>
  );
}
