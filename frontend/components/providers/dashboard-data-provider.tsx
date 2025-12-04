"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ActivityItem, DashboardStats, QuickStartStep } from "@/types";

interface DashboardDataContextValue {
  stats: DashboardStats | null;
  averageProfit: number | null;
  activity: ActivityItem[];
  quickStartSteps: QuickStartStep[];
  quickStartProgress: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const data = useDashboardData();

  return (
    <DashboardDataContext.Provider value={data}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardDataContext(): DashboardDataContextValue {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error("useDashboardDataContext must be used within DashboardDataProvider");
  }
  return context;
}

