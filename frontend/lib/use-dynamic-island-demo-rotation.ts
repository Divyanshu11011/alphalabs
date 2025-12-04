"use client"

import { useEffect, useRef } from "react"
import {
  useDynamicIslandStore,
  type LiveSessionData,
  type NarratorData,
} from "@/lib/stores/dynamic-island-store"

type RotationContext = "dashboard"
type RotationStep = {
  duration: number
  run: () => void
}

export interface PreparingConfig {
  type: "backtest" | "forward";
}

interface RotationData {
  stats?: {
    totalAgents: number;
    testsRun: number;
    bestAgentName?: string;
  };
  avgPnL?: number | null;
  winRate?: number | null;
  activity?: {
    agentName: string;
    description: string;
    pnl?: number | null;
    resultId?: string | null;
    trades?: number | null;
    winRate?: number | null;
  };
  liveSession?: LiveSessionData;
}

const buildDashboardSequence = (data?: RotationData): RotationStep[] => {
  const store = useDynamicIslandStore.getState()
  const stats = data?.stats
  const totalAgents = stats?.totalAgents ?? 0
  const testsRun = stats?.testsRun ?? 0
  const bestAgent = stats?.bestAgentName ?? "—"
  const avgPnL = data?.avgPnL ?? null
  const avgPnlDisplay =
    typeof avgPnL === "number" ? avgPnL.toFixed(1) : "0"
  const winRatePercent = data?.winRate ?? null

  const narratorData: NarratorData = {
    text: "Your LLM collective is compounding edge",
    type: "info",
    details: `Agents live: ${totalAgents} • Avg PnL: +${avgPnlDisplay}%`,
    metrics: [
      { label: "Win rate", value: `${winRatePercent ?? 0}%` },
      { label: "Tests run", value: `${testsRun}` },
      { label: "Best agent", value: bestAgent },
    ],
  }

  const liveSessionData: LiveSessionData | null = data?.liveSession ?? null

  const narratorAction = () => store.narrate(narratorData.text, narratorData.type, narratorData)
  const liveSessionAction = () => {
    if (liveSessionData) {
      store.showLiveSession(liveSessionData)
    } else {
      store.showIdle()
    }
  }
  const idleAction = () => store.showIdle()

  const activity = data?.activity
  const secondNarratorAction =
    activity &&
    (() => {
      const text = `Agent ${activity.agentName} wrapped ${activity.description.toLowerCase()}`
      
      // Build metrics array - show trades and winRate (PnL is shown separately in blocks)
      const metrics: { label: string; value: string }[] = []
      // Don't add PnL to metrics since we show it as a separate block
      if (activity.trades !== null && activity.trades !== undefined) {
        metrics.push({ label: "Trades", value: `${activity.trades}` })
      }
      if (activity.winRate !== null && activity.winRate !== undefined) {
        metrics.push({ label: "Win rate", value: `${activity.winRate}%` })
      }
      
      const narratorData: NarratorData = {
        text,
        type: activity.pnl && activity.pnl > 0 ? "result" : "info",
        pnl: activity.pnl,
        resultId: activity.resultId,
        metrics: metrics.length > 0 ? metrics : undefined,
      }
      
      return store.narrate(narratorData.text, narratorData.type, narratorData)
    })

  const sequence: RotationStep[] = [
    // Idle mode shows formula quotes in the UI
    { duration: 8000, run: idleAction },
    // User info / performance pulse via narrator view
    { duration: 9000, run: narratorAction },
  ]

  // Only add live session if we have real data
  if (liveSessionData) {
    sequence.push({ duration: 10000, run: liveSessionAction })
  }

  if (secondNarratorAction) {
    sequence.push({ duration: 7000, run: secondNarratorAction })
  }

  return sequence
}

const buildSequence = (context: RotationContext, data?: RotationData): RotationStep[] => {
  switch (context) {
    case "dashboard":
      return buildDashboardSequence(data)
    default:
      return []
  }
}

export const useDynamicIslandDemoRotation = (
  context: RotationContext | null,
  preparingConfig?: PreparingConfig,
  rotationData?: RotationData
) => {
  const timeoutRef = useRef<number | null>(null)
  const stepIndexRef = useRef(0)

  useEffect(() => {
    const store = useDynamicIslandStore.getState()

    // If preparing config is provided, show the preparing animation
    if (preparingConfig) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      store.showPreparing({ type: preparingConfig.type })
      return
    }

    // If no context, show idle (for battle screens where battle-screen.tsx controls)
    if (!context) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Don't call showIdle - let battle-screen.tsx take control
      return
    }

    // Otherwise run the rotation sequence (dashboard)
    const steps = buildSequence(context, rotationData)

    if (!steps.length) {
      return
    }

    const runStep = () => {
      const currentStep = steps[stepIndexRef.current % steps.length]
      currentStep.run()

      timeoutRef.current = window.setTimeout(() => {
        stepIndexRef.current = (stepIndexRef.current + 1) % steps.length
        runStep()
      }, currentStep.duration)
    }

    runStep()

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      stepIndexRef.current = 0
    }
  }, [context, preparingConfig?.type, rotationData])
}
