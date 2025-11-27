// Dashboard Types

export interface DashboardStats {
  totalAgents: number;
  testsRun: number;
  bestPnL: number;
  avgWinRate: number;
  trends: {
    agentsThisWeek: number;
    testsToday: number;
    winRateChange: number;
  };
  bestAgent: string;
}

export interface ActivityItem {
  id: string;
  type: "test_completed" | "test_failed" | "agent_created" | "agent_updated";
  agentName: string;
  description: string;
  timestamp: Date;
  pnl?: number;
  resultId?: string;
}

export interface QuickStartStep {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  href: string;
  ctaText: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Modal Props
export interface QuickTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

