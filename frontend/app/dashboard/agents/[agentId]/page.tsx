import { AgentDetailView } from "@/components/agents/detail/agent-detail-view";

interface AgentDetailPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params;
  
  return <AgentDetailView agentId={agentId} />;
}

