"use client";

import { LayoutGrid, List, Bot, Plus } from "lucide-react";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { AgentCard } from "./agent-card";
import { CreateAgentCard } from "./create-agent-card";
import { useAgentsStore } from "@/lib/stores";
import { useUIStore } from "@/lib/stores";
import { useState } from "react";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-full bg-muted/50 p-6">
        <Bot className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="font-mono text-xl font-semibold">No agents yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first AI agent to start testing trading strategies in The Arena
      </p>
      <Button asChild className="mt-6 gap-2">
        <Link href="/dashboard/agents/new">
          <Plus className="h-4 w-4" />
          Create Your First Agent
        </Link>
      </Button>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-full bg-muted/50 p-6">
        <Bot className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="font-mono text-xl font-semibold">No matching agents</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Try adjusting your search or filters
      </p>
      <Button variant="outline" className="mt-4" onClick={onClear}>
        Clear Filters
      </Button>
    </div>
  );
}

export function AgentsView() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const { agents, filteredAgents, filters, clearFilters } = useAgentsStore();
  
  const displayAgents = filteredAgents();
  const hasFilters = filters.search || filters.models.length > 0 || filters.modes.length > 0;

  if (agents.length === 0) {
    return <EmptyState />;
  }

  if (displayAgents.length === 0 && hasFilters) {
    return <NoResultsState onClear={clearFilters} />;
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && setView(value as "grid" | "list")}
          className="gap-1"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="data-[state=on]:bg-muted"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="data-[state=on]:bg-muted"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <span className="text-xs text-muted-foreground">
          Showing {displayAgents.length} of {agents.length} agent{agents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          <CreateAgentCard />
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-3">
          {displayAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
