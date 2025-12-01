"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentCreationWizard } from "@/components/agents/creation/agent-creation-wizard";
import { useAgents, Agent } from "@/hooks/use-agents";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditAgentPage() {
  const params = useParams();
  const { getAgent } = useAgents();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setIsLoading(true);
        const data = await getAgent(agentId);
        setAgent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) {
      fetchAgent();
    }
  }, [agentId, getAgent]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
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

  return <AgentCreationWizard initialData={agent} isEditMode={true} />;
}
