"use client";

import { Bot, FlaskConical, TrendingUp, Target, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardDataContext } from "@/components/providers/dashboard-data-provider";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  valueClassName?: string;
}

function StatCard({ title, value, subtitle, trend, icon: Icon, valueClassName }: StatCardProps) {
  return (
    <Card className="card-hover border-border/50 bg-card/50">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn("font-mono text-2xl font-bold md:text-3xl", valueClassName)}>
              {value}
            </div>
            <p className="text-xs text-muted-foreground md:text-sm">{title}</p>
          </div>
          <div className="text-right">
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.direction === "up" && "text-[hsl(var(--accent-green))]",
                  trend.direction === "down" && "text-[hsl(var(--accent-red))]",
                  trend.direction === "neutral" && "text-muted-foreground"
                )}
              >
                {trend.direction === "up" && <ArrowUp className="h-3 w-3" />}
                {trend.direction === "down" && <ArrowDown className="h-3 w-3" />}
                {trend.value}
              </div>
            )}
            {subtitle && !trend && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const StatSkeletonRow = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map((key) => (
      <Card key={key} className="border-border/50 bg-card/30">
        <CardContent className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const formatPercent = (value?: number, digits = 1) => {
  if (value === undefined || value === null) return "—";
  const formatted = value.toFixed(digits);
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatted}%`;
};

export function StatsCardRow() {
  const { stats } = useDashboardDataContext();

  if (!stats) {
    return <StatSkeletonRow />;
  }

  const winRateChange = stats.trends.winRateChange ?? 0;
  const winRateDirection =
    winRateChange > 0 ? "up" : winRateChange < 0 ? "down" : "neutral";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Agents"
        value={stats.totalAgents}
        icon={Bot}
        trend={{
          value: `${stats.trends.agentsThisWeek >= 0 ? "↑" : ""}${stats.trends.agentsThisWeek} this week`,
          direction: stats.trends.agentsThisWeek >= 0 ? "up" : "neutral",
        }}
      />
      <StatCard
        title="Tests Run"
        value={stats.testsRun}
        icon={FlaskConical}
        trend={{
          value: `${stats.trends.testsToday >= 0 ? "↑" : ""}${stats.trends.testsToday} today`,
          direction: stats.trends.testsToday >= 0 ? "up" : "neutral",
        }}
      />
      <StatCard
        title="Best PnL"
        value={formatPercent(stats.bestPnL, 1)}
        icon={TrendingUp}
        valueClassName="text-[hsl(var(--accent-green))]"
        subtitle={stats.bestAgent ? `Agent: ${stats.bestAgent.name}` : undefined}
      />
      <StatCard
        title="Avg Win Rate"
        value={formatPercent(stats.avgWinRate, 1)}
        icon={Target}
        trend={{
          value: `${winRateChange > 0 ? "↑" : winRateChange < 0 ? "↓" : "↔"}${Math.abs(winRateChange).toFixed(1)}% vs last period`,
          direction: winRateDirection,
        }}
      />
    </div>
  );
}

