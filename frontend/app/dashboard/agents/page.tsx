import { AgentsPageHeader } from "@/components/agents/agents-page-header";
import { AgentsView } from "@/components/agents/agents-view";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AgentsPageHeader />
      
      {/* Agents Grid/List View */}
      <AgentsView />
    </div>
  );
}

