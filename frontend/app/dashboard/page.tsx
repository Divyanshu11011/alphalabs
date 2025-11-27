import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCardRow } from "@/components/dashboard/stats-card-row";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { LiveSessionsPanel } from "@/components/dashboard/live-sessions-panel";
import { QuickStartGuide } from "@/components/dashboard/quick-start-guide";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardHeader />

      {/* Stats Cards Row */}
      <StatsCardRow />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Live Sessions Panel */}
        <LiveSessionsPanel />
      </div>

      {/* Quick Start Guide (for new users) */}
      <QuickStartGuide />
    </div>
  );
}

