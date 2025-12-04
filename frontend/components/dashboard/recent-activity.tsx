"use client";

import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboardDataContext } from "@/components/providers/dashboard-data-provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem as DashboardActivityItem } from "@/types";

const formatRelativeTime = (date: Date) => {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
};

function ActivityItemCard({ activity }: { activity: DashboardActivityItem }) {
  const getStatusColor = () => {
    switch (activity.type) {
      case "test_completed":
        return activity.pnl && activity.pnl > 0
          ? "bg-[hsl(var(--accent-green))]"
          : "bg-[hsl(var(--accent-red))]";
      case "test_failed":
        return "bg-[hsl(var(--accent-red))]";
      case "agent_created":
        return "bg-[hsl(var(--accent-amber))]";
      default:
        return "bg-muted";
    }
  };

  const getActionLabel = () => {
    switch (activity.type) {
      case "test_completed":
        return "Backtest Complete";
      case "test_failed":
        return "Backtest Update";
      case "agent_created":
        return "Agent Created";
      default:
        return "Activity";
    }
  };

  const linkHref =
    activity.actionUrl ||
    (activity.resultId
      ? `/dashboard/results/${activity.resultId}`
      : "#");

  const linkLabel = activity.type === "agent_created" ? "Edit" : "View";

  return (
    <div className="group rounded-lg border border-border/50 bg-card/30 p-3 sm:p-4 transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
          <div className={cn("h-2 w-2 shrink-0 rounded-full", getStatusColor())} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-sm font-medium">{activity.agentName}</span>
              <span className="text-sm text-muted-foreground">{getActionLabel()}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{formatRelativeTime(activity.timestamp)}</span>
              <span className="hidden xs:inline">•</span>
              <span className="w-full xs:w-auto">{activity.description}</span>
            </div>
          </div>
          {activity.pnl !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs shrink-0",
                activity.pnl > 0
                  ? "border-[hsl(var(--accent-green)/0.3)] bg-[hsl(var(--accent-green)/0.1)] text-[hsl(var(--accent-green))]"
                  : "border-[hsl(var(--accent-red)/0.3)] bg-[hsl(var(--accent-red)/0.1)] text-[hsl(var(--accent-red))]"
              )}
            >
              {activity.pnl > 0 ? "+" : ""}
              {activity.pnl.toFixed(1)}%
            </Badge>
          )}
        </div>
        <Link
          href={linkHref}
          className="ml-5 flex items-center gap-1 text-xs text-muted-foreground transition-opacity hover:text-foreground sm:ml-0 sm:opacity-0 group-hover:opacity-100"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted/50 p-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-mono text-lg font-medium">No activity yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create an agent and run your first test
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link href="/dashboard/agents/new">Create Agent</Link>
      </Button>
    </div>
  );
}

export function RecentActivity() {
  const { activity, isLoading } = useDashboardDataContext();

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-mono text-lg font-semibold">Recent Activity</CardTitle>
        <Link
          href="/dashboard/results"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !activity.length ? (
          <div className="space-y-3">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <EmptyState />
        ) : (
          activity.map((item) => <ActivityItemCard key={item.id} activity={item} />)
        )}
      </CardContent>
    </Card>
  );
}

