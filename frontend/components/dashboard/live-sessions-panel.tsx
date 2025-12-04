"use client";

import { Radio, ArrowRight, Pause, Play, Trash2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShiftCard } from "@/components/ui/shift-card";
import { cn } from "@/lib/utils";
import { useForwardSessions } from "@/hooks/use-forward-sessions";
import { useBacktestSessions } from "@/hooks/use-backtest-sessions";
import { useArenaApi } from "@/hooks/use-arena-api";
import { useToast } from "@/hooks/use-toast";

interface HappeningSession {
  id: string;
  agentName: string;
  asset: string;
  pnl: number;
  tradesCount: number;
  winRate: number;
  duration: string;
  status: string;
  type: "backtest" | "forward";
}

const MAX_VISIBLE_SESSIONS = 3; // Show 3 sessions before scrolling

function LiveSessionCard({ session, isLoading = false }: { session: HappeningSession; isLoading?: boolean }) {
  const isProfitable = session.pnl >= 0;
  const accentColor = isProfitable ? "accent-profit" : "accent-red";
  const isRunning = session.status === "running";
  
  const topContent = (
    <div className={cn(
      "flex items-center justify-between rounded-t px-2 py-1.5",
      isProfitable 
        ? "bg-[hsl(var(--accent-profit)/0.15)]" 
        : "bg-[hsl(var(--accent-red)/0.15)]"
    )}>
      <div className="flex items-center gap-1.5">
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          isRunning ? "bg-[hsl(var(--accent-green))] animate-pulse" : "bg-[hsl(var(--accent-amber))]"
        )} />
        <span className="font-mono text-xs font-bold text-foreground">
          {session.agentName}
        </span>
        <Badge className={cn(
          "text-[8px] h-4 px-1",
          session.type === "forward" 
            ? "bg-[hsl(var(--accent-green))] text-black" 
            : "bg-[hsl(var(--accent-blue))] text-white"
        )}>
          {session.type === "forward" ? "FWD" : "BT"}
        </Badge>
      </div>
      {isLoading ? (
        <div className="h-4 w-12 animate-pulse rounded bg-muted/50" />
      ) : (
        <span className={cn(
          "font-mono text-sm font-bold",
          isProfitable ? "text-[hsl(var(--accent-profit))]" : "text-[hsl(var(--accent-red))]"
        )}>
          {isProfitable ? "+" : ""}{session.pnl.toFixed(2)}%
        </span>
      )}
    </div>
  );

  const middleContent = (
    <div className="px-2 py-1 text-center">
      <p className="font-mono text-[10px] text-muted-foreground">Asset</p>
      <p className="font-mono text-xs font-medium">
        {session.asset.toUpperCase().replace("-", "/")}
      </p>
    </div>
  );

  const bottomContent = (
    <div className={cn(
      "px-2 pb-2 pt-1 space-y-1.5 border-t",
      isProfitable 
        ? "bg-[hsl(var(--accent-profit)/0.05)] border-[hsl(var(--accent-profit)/0.2)]" 
        : "bg-[hsl(var(--accent-red)/0.05)] border-[hsl(var(--accent-red)/0.2)]"
    )}>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded border border-border/50 bg-muted/20 p-1.5">
          <p className="text-[9px] text-muted-foreground">Trades</p>
          {isLoading ? (
            <div className="h-3 w-6 animate-pulse rounded bg-muted/50 mt-0.5" />
          ) : (
            <p className="font-mono text-[10px] font-medium">{session.tradesCount}</p>
          )}
        </div>
        <div className="rounded border border-border/50 bg-muted/20 p-1.5">
          <p className="text-[9px] text-muted-foreground">Win Rate</p>
          {isLoading ? (
            <div className="h-3 w-8 animate-pulse rounded bg-muted/50 mt-0.5" />
          ) : (
            <p className="font-mono text-[10px] font-medium">{session.winRate.toFixed(0)}%</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between rounded p-1.5 px-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-[9px] text-muted-foreground">Duration</p>
        </div>
        {isLoading ? (
          <div className="h-3 w-12 animate-pulse rounded bg-muted/50" />
        ) : (
          <p className="font-mono text-[10px] font-medium">{session.duration}</p>
        )}
      </div>
      <Button asChild size="sm" className="w-full h-7 text-[10px] gap-1">
        <Link href={`/dashboard/arena/${session.type}/${session.id}`}>
          View Session
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );

  return (
    <ShiftCard
      className={cn(
        "border",
        isProfitable 
          ? "border-[hsl(var(--accent-profit)/0.3)]" 
          : "border-[hsl(var(--accent-red)/0.3)]"
      )}
      topContent={topContent}
      middleContent={middleContent}
      bottomContent={bottomContent}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-4">
        <div className="rounded-full bg-muted/50 p-4">
          <Radio className="h-8 w-8 text-muted-foreground" />
        </div>
        {/* Pulse animation rings */}
        <div className="absolute inset-0 animate-ping rounded-full bg-muted/20" />
      </div>
      <h3 className="font-mono text-base font-medium">No active sessions</h3>
      <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
        Start a Backtest or Forward Test to see live trading
      </p>
      <div className="mt-4 flex gap-2">
        <Button asChild className="gap-1" size="sm" variant="outline">
          <Link href="/dashboard/arena/backtest">
            Backtest
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button asChild className="gap-1" size="sm">
          <Link href="/dashboard/arena/forward">
            Forward Test
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function LiveSessionsPanel() {
  // Fetch both forward and backtest active sessions
  const { sessions: forwardSessions, isLoading: forwardLoading, error: forwardError, refetch: refetchForward } = useForwardSessions(15000);
  const { sessions: backtestSessions, isLoading: backtestLoading, error: backtestError, refetch: refetchBacktest } = useBacktestSessions(15000);
  
  const isLoading = forwardLoading || backtestLoading;
  const error = forwardError || backtestError;
  const refetch = async () => {
    await Promise.all([refetchForward(), refetchBacktest()]);
  };

  // Track previous sessions to maintain them during loading
  const previousSessionsRef = useRef<HappeningSession[]>([]);
  const isInitialLoadRef = useRef(true);

  // Combine and map sessions to the component format
  // Filter out stale sessions and deduplicate by ID:
  // - Only show running or paused (not initializing)
  // - Filter out sessions with 0 trades that have been running for more than 1 hour (likely stale)
  // - Filter out sessions with invalid agent names (empty or weird values)
  // - Deduplicate by session ID to prevent showing the same session multiple times
  const seenSessionIds = new Set<string>();
  const allSessions = [
    ...forwardSessions.map(s => ({ ...s, type: "forward" as const })),
    ...backtestSessions.map(s => ({ ...s, type: "backtest" as const }))
  ];
  
  const liveSessions = allSessions
    .filter((s) => {
      // Deduplicate by ID - if we've seen this ID before, skip it
      if (seenSessionIds.has(s.id)) {
        return false;
      }
      seenSessionIds.add(s.id);
      
      // Only running or paused
      if (s.status !== "running" && s.status !== "paused") {
        return false;
      }
      
      // Filter out invalid agent names
      if (!s.agentName || s.agentName.trim().length === 0 || s.agentName.length < 2) {
        return false;
      }
      
      // Parse duration to check if stale
      // Duration format is like "4h 53m" or "4s" or "3h 39m"
      const durationStr = s.durationDisplay.toLowerCase();
      const hoursMatch = durationStr.match(/(\d+)h/);
      const minutesMatch = durationStr.match(/(\d+)m/);
      const secondsMatch = durationStr.match(/(\d+)s/);
      
      let totalMinutes = 0;
      if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
      if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
      if (secondsMatch && !hoursMatch && !minutesMatch) {
        // Only seconds, likely just started - keep it
        return true;
      }
      
      // If session has been running for more than 1 hour with 0 trades, it's likely stale
      if (s.tradesCount === 0 && totalMinutes > 60) {
        return false;
      }
      
      return true;
    })
    .map((session) => ({
      id: session.id,
      agentName: session.agentName,
      asset: session.asset,
      pnl: session.currentPnlPct,
      tradesCount: session.tradesCount,
      winRate: session.winRate,
      duration: session.durationDisplay,
      status: session.status,
      type: session.type,
    }))
    // Sort by most recent activity (sessions with trades first, then by duration)
    .sort((a, b) => {
      if (a.tradesCount > 0 && b.tradesCount === 0) return -1;
      if (a.tradesCount === 0 && b.tradesCount > 0) return 1;
      return 0;
    });

  // Update previous sessions whenever we have sessions (to maintain them during loading)
  useEffect(() => {
    if (liveSessions.length > 0) {
      previousSessionsRef.current = liveSessions;
      isInitialLoadRef.current = false;
    } else if (!isLoading) {
      // Only clear previous sessions if we're not loading and have no sessions
      // This prevents clearing during brief loading states
      previousSessionsRef.current = [];
    }
  }, [liveSessions, isLoading]);

  // Determine which sessions to display
  // During loading, show previous sessions with skeleton states
  // If no previous sessions exist, show loading message only on initial load
  const displaySessions = isLoading && previousSessionsRef.current.length > 0
    ? previousSessionsRef.current
    : liveSessions;

  const isInitialLoad = isInitialLoadRef.current && isLoading;
  const showLoadingMessage = isInitialLoad && displaySessions.length === 0;

  const { cleanupActiveSessions } = useArenaApi();
  const { toast } = useToast();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      // Cleanup both forward and backtest sessions
      const result = await cleanupActiveSessions(); // No type = cleanup both
      toast({
        title: "Cleanup completed",
        description: `Deleted ${result.deleted_sessions} session(s) and stopped ${result.stopped_in_memory} in-memory session(s).`,
      });
      // Refresh the sessions list
      await refetch();
    } catch (error) {
      toast({
        title: "Cleanup failed",
        description: error instanceof Error ? error.message : "Failed to cleanup sessions",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-lg font-semibold">Live Sessions</CardTitle>
          {displaySessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                  disabled={isCleaningUp}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Cleanup
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clean up all active sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all active backtest and forward test sessions from the database and stop any running in-memory sessions.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isCleaningUp ? "Cleaning up..." : "Clean up"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showLoadingMessage ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">Failed to load active sessions</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1.5">
            {/* Show first MAX_VISIBLE_SESSIONS without scroll */}
            {displaySessions.slice(0, MAX_VISIBLE_SESSIONS).map((session) => (
              <LiveSessionCard 
                key={session.id} 
                session={session} 
                isLoading={isLoading && previousSessionsRef.current.some(ps => ps.id === session.id)}
              />
            ))}
            {/* Scrollable area for remaining sessions */}
            {displaySessions.length > MAX_VISIBLE_SESSIONS && (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1.5 pr-2">
                  {displaySessions.slice(MAX_VISIBLE_SESSIONS).map((session) => (
                    <LiveSessionCard 
                      key={session.id} 
                      session={session} 
                      isLoading={isLoading && previousSessionsRef.current.some(ps => ps.id === session.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

