"use client";

import { History, Edit, MoreVertical, Copy, FileDown, Trash2, Bot } from "lucide-react";
import { Crosshair, Eye } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  model: string;
  mode: "monk" | "omni";
  indicators: string[];
  testsRun: number;
  bestPnL: number | null;
  createdAt: Date;
}

interface AgentCardProps {
  agent: Agent;
  variant?: "grid" | "list";
}

export function AgentCard({ agent, variant = "grid" }: AgentCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/dashboard/agents/${agent.id}`);
  };

  const indicatorsPreview =
    agent.indicators.length > 3
      ? `${agent.indicators.slice(0, 3).join(", ")} +${agent.indicators.length - 3} more`
      : agent.indicators.join(", ");

  if (variant === "list") {
    return (
      <Card
        className="group cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-muted/30"
        onClick={handleCardClick}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
            <Bot className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{agent.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] gap-1",
                  agent.mode === "monk"
                    ? "border-[hsl(var(--accent-purple)/0.3)] text-[hsl(var(--accent-purple))]"
                    : "border-primary/30 text-primary"
                )}
              >
                {agent.mode === "monk" ? (
                  <><Crosshair size={12} weight="duotone" /> Monk</>
                ) : (
                  <><Eye size={12} weight="duotone" /> Omni</>
                )}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {agent.model} • {indicatorsPreview}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden text-right sm:block">
            <p className="font-mono text-sm">{agent.testsRun} tests</p>
            {agent.bestPnL !== null ? (
              <p
                className={cn(
                  "font-mono text-xs",
                  agent.bestPnL >= 0
                    ? "text-[hsl(var(--accent-profit))]"
                    : "text-[hsl(var(--accent-red))]"
                )}
              >
                Best: {agent.bestPnL >= 0 ? "+" : ""}
                {agent.bestPnL}%
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">--</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/dashboard/arena/backtest?agent=${agent.id}`)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/dashboard/agents/${agent.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AgentMoreMenu agentId={agent.id} agentName={agent.name} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer border-border/50 bg-card/50 transition-all hover:border-border/80 hover:bg-muted/30"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-mono text-base font-semibold">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.model}</p>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <AgentMoreMenu agentId={agent.id} agentName={agent.name} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Mode Section */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <Badge
            variant="outline"
            className={cn(
              "mb-2 gap-1.5",
              agent.mode === "monk"
                ? "border-[hsl(var(--accent-purple)/0.3)] bg-[hsl(var(--accent-purple)/0.1)] text-[hsl(var(--accent-purple))]"
                : "border-primary/30 bg-primary/10 text-primary"
            )}
          >
            {agent.mode === "monk" ? (
              <><Crosshair size={14} weight="duotone" /> Monk Mode</>
            ) : (
              <><Eye size={14} weight="duotone" /> Omni Mode</>
            )}
          </Badge>
          <p className="text-xs text-muted-foreground">{indicatorsPreview}</p>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tests: <span className="font-mono text-foreground">{agent.testsRun}</span>
          </span>
          <span className="text-muted-foreground">
            Best:{" "}
            {agent.bestPnL !== null ? (
              <span
                className={cn(
                  "font-mono",
                  agent.bestPnL >= 0
                    ? "text-[hsl(var(--accent-profit))]"
                    : "text-[hsl(var(--accent-red))]"
                )}
              >
                {agent.bestPnL >= 0 ? "+" : ""}
                {agent.bestPnL}%
              </span>
            ) : (
              <span className="font-mono text-foreground">--</span>
            )}
          </span>
        </div>
      </CardContent>

      <CardFooter
        className="gap-2 border-t border-border/50 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => router.push(`/dashboard/arena/backtest?agent=${agent.id}`)}
        >
          <History className="h-3 w-3" />
          Backtest
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => router.push(`/dashboard/agents/${agent.id}/edit`)}
        >
          <Edit className="h-3 w-3" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}

function AgentMoreMenu({ agentId, agentName }: { agentId: string; agentName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Agent
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileDown className="mr-2 h-4 w-4" />
          Export Config
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

