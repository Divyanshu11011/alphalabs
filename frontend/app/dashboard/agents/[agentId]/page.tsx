"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Edit,
  Play,
  MoreVertical,
  Trash,
  Copy,
  Activity,
  TrendingUp,
  Target,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgents, Agent, AgentStats } from "@/hooks/use-agents";
import { useToast } from "@/hooks/use-toast";
import { DeleteAgentDialog } from "@/components/agents/delete-agent-dialog";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAgent, getAgentStats, duplicateAgent, deleteAgent } = useAgents();
  const { toast } = useToast();

  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [agentData, statsData] = await Promise.all([
          getAgent(agentId),
          getAgentStats(agentId).catch(() => null) // Stats might fail if no tests run, or just return empty
        ]);
        setAgent(agentData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) {
      fetchData();
    }
  }, [agentId, getAgent, getAgentStats]);

  const handleDuplicate = async () => {
    if (!agent) return;
    try {
      setIsDuplicating(true);
      const newAgent = await duplicateAgent(agent.id, `${agent.name} (Copy)`);
      toast({
        title: "Agent duplicated",
        description: `${newAgent.name} has been created.`,
      });
      router.push(`/dashboard/agents/${newAgent.id}`);
    } catch (error) {
      toast({
        title: "Failed to duplicate",
        description: "Could not create a copy of this agent.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async (archive: boolean) => {
    if (!agent) return;
    try {
      await deleteAgent(agent.id, archive);
      toast({
        title: archive ? "Agent archived" : "Agent deleted",
        description: `${agent.name} has been removed.`,
      });
      router.push("/dashboard/agents");
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Could not remove this agent.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Agent not found</h2>
        <p className="text-muted-foreground">{error || "The requested agent could not be loaded."}</p>
        <Button asChild>
          <Link href="/dashboard/agents">Back to Agents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/agents"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant={agent.mode === "monk" ? "secondary" : "default"}>
              {agent.mode.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-7">
            Created on {new Date(agent.created_at).toLocaleDateString()} • {agent.model}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-7 sm:ml-0">
          <Button asChild variant="outline">
            <Link href={`/dashboard/agents/${agent.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Config
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/arena/backtest?agent=${agent.id}`}>
              <Play className="mr-2 h-4 w-4" />
              Test in Arena
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tests_run || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime backtests run
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best PnL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.best_pnl || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats?.best_pnl ? `${stats.best_pnl}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest return achieved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_win_rate ? `${stats.avg_win_rate}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all tests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profitable Tests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_profitable_tests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tests with positive PnL
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Config */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Strategy Configuration</CardTitle>
            <CardDescription>The core instructions and parameters for this agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">Strategy Prompt</h3>
              <div className="rounded-md bg-muted p-4 font-mono text-sm whitespace-pre-wrap">
                {agent.strategy_prompt}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Indicators</h3>
              <div className="flex flex-wrap gap-2">
                {agent.indicators.map((indicator) => (
                  <Badge key={indicator} variant="outline" className="font-mono">
                    {indicator}
                  </Badge>
                ))}
                {agent.custom_indicators?.map((indicator) => (
                  <Badge key={indicator.name} variant="outline" className="font-mono border-primary/50">
                    {indicator.name} (Custom)
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Model</span>
                <p className="font-medium">{agent.model}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">API Key</span>
                <p className="font-mono text-sm">{agent.api_key_masked}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Mode</span>
                <p className="font-medium capitalize">{agent.mode}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteAgentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        agentName={agent.name}
      />
    </div>
  );
}
