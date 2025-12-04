// Dashboard Types

export interface TrendStats {
  agentsThisWeek: number;
  testsToday: number;
  winRateChange?: number;
}

export interface DashboardStats {
  totalAgents: number;
  testsRun: number;
  bestPnL?: number;
  avgWinRate?: number;
  trends: TrendStats;
  bestAgent?: {
    id: string;
    name: string;
  };
}

export interface ActivityItem {
  id: string;
  type: "test_completed" | "test_failed" | "agent_created" | "agent_updated" | string;
  agentName: string;
  description: string;
  timestamp: Date;
  pnl?: number;
  resultId?: string;
  actionUrl?: string;
}

export interface QuickStartStep {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  href: string;
  ctaText: string;
}

export interface NotificationItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  category: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
  sessionId?: string;
  resultId?: string;
}

// Modal Props
export interface QuickTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

