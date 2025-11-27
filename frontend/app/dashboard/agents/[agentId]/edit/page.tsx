import { AgentEditWizard } from "@/components/agents/creation/agent-edit-wizard";

interface EditAgentPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { agentId } = await params;
  
  return <AgentEditWizard agentId={agentId} />;
}

