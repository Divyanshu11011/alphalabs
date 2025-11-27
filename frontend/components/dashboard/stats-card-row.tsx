"use client";

import { Bot, FlaskConical, TrendingUp, Target, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon: React.ElementType;
  valueClassName?: string;
}

function StatCard({ title, value, subtitle, trend, icon: Icon, valueClassName }: StatCardProps) {
  return (
    <Card className="card-hover border-border/50 bg-card/50">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {/* Icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {/* Value */}
            <div className={cn("font-mono text-2xl font-bold md:text-3xl", valueClassName)}>
              {value}
            </div>
            
            {/* Title */}
            <p className="text-xs text-muted-foreground md:text-sm">{title}</p>
          </div>

          {/* Trend or Subtitle */}
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

export function StatsCardRow() {
  // In a real app, this would come from API/state
  const stats = {
    totalAgents: 3,
    testsRun: 27,
    bestPnL: 47.2,
    avgWinRate: 62,
    trends: {
      agentsThisWeek: 1,
      testsToday: 5,
      winRateChange: 3,
    },
    bestAgent: "α-1",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Agents"
        value={stats.totalAgents}
        icon={Bot}
        trend={{
          value: `↑${stats.trends.agentsThisWeek} this week`,
          direction: "up",
        }}
      />
      <StatCard
        title="Tests Run"
        value={stats.testsRun}
        icon={FlaskConical}
        trend={{
          value: `↑${stats.trends.testsToday} today`,
          direction: "up",
        }}
      />
      <StatCard
        title="Best PnL"
        value={`+${stats.bestPnL}%`}
        icon={TrendingUp}
        valueClassName="text-[hsl(var(--accent-green))]"
        subtitle={`Agent: ${stats.bestAgent}`}
      />
      <StatCard
        title="Avg Win Rate"
        value={`${stats.avgWinRate}%`}
        icon={Target}
        trend={{
          value: `↑${stats.trends.winRateChange}% vs last month`,
          direction: "up",
        }}
      />
    </div>
  );
}

