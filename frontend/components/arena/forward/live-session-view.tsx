"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Play,
  Pause,
  Square,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Activity,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import {
  generateDummyCandles,
  DUMMY_TRADES,
  DUMMY_AGENTS,
} from "@/lib/dummy-data";
import { useAgentsStore, useArenaStore } from "@/lib/stores";
import type { CandleData, Trade, Position } from "@/types";

interface LiveSessionViewProps {
  sessionId: string;
}

export function LiveSessionView({ sessionId }: LiveSessionViewProps) {
  // Get config and agents from stores
  const { forwardConfig } = useArenaStore();
  const { agents } = useAgentsStore();
  
  // Find the selected agent
  const agent = useMemo(() => {
    if (forwardConfig?.agentId) {
      return agents.find(a => a.id === forwardConfig.agentId) || DUMMY_AGENTS[0];
    }
    return DUMMY_AGENTS[0];
  }, [forwardConfig?.agentId, agents]);
  
  // Get config values with fallbacks
  const initialCapital = forwardConfig?.capital ?? 10000;
  const asset = forwardConfig?.asset ?? "btc-usdt";
  const timeframe = forwardConfig?.timeframe ?? "1h";
  
  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [trades, setTrades] = useState<Trade[]>(DUMMY_TRADES.slice(0, 2));
  const [position, setPosition] = useState<Position | null>({
    type: "long",
    entryPrice: 43250,
    size: 0.5,
    leverage: 1,
    stopLoss: 42500,
    takeProfit: 44500,
    unrealizedPnL: 325,
    openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });
  const [equity, setEquity] = useState(initialCapital + 325);
  const [pnl, setPnl] = useState(3.25);
  const [nextDecision, setNextDecision] = useState(42);
  const [runningTime, setRunningTime] = useState("4h 23m");

  // Initialize candles
  useEffect(() => {
    setCandles(generateDummyCandles(100));
  }, []);

  // Simulate countdown
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setNextDecision((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Simulate live updates
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Add new candle
      setCandles((prev) => {
        const lastCandle = prev[prev.length - 1];
        const newCandle: CandleData = {
          time: lastCandle.time + 60 * 60 * 1000,
          open: lastCandle.close,
          high: lastCandle.close * (1 + Math.random() * 0.01),
          low: lastCandle.close * (1 - Math.random() * 0.01),
          close: lastCandle.close * (1 + (Math.random() - 0.5) * 0.02),
          volume: Math.random() * 1000,
        };
        return [...prev.slice(-99), newCandle];
      });

      // Update PnL
      setPnl((prev) => {
        const change = (Math.random() - 0.5) * 0.5;
        return Number((prev + change).toFixed(2));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleStop = () => {
    // Would stop session and redirect to results
    window.location.href = `/dashboard/results/forward-${sessionId}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/arena/forward"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold">Live Session</h1>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  isConnected
                    ? "border-[hsl(var(--accent-green)/0.3)] text-[hsl(var(--accent-green))]"
                    : "border-[hsl(var(--accent-red)/0.3)] text-[hsl(var(--accent-red))]"
                )}
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" /> LIVE
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" /> DISCONNECTED
                  </>
                )}
              </Badge>
              {isPaused && (
                <Badge variant="secondary">PAUSED</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.name} • BTC/USDT • Running for {runningTime}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Pause/Resume - for temporarily pausing data updates */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              "gap-2",
              isPaused && "border-[hsl(var(--accent-amber)/0.5)] text-[hsl(var(--accent-amber))]"
            )}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            )}
          </Button>

          {/* Stop Session - only show when paused for safety, or always with clear separation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant={isPaused ? "destructive" : "outline"} 
                size="sm" 
                className={cn(
                  "gap-2",
                  !isPaused && "border-destructive/50 text-destructive hover:bg-destructive/10"
                )}
              >
                <Square className="h-4 w-4" /> {isPaused ? "End Session" : "Stop"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stop Forward Test?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will stop the live trading session and close any open positions.
                  Your results will be saved and a certificate can be generated if profitable.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStop} className="bg-destructive">
                  Stop Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        {/* Chart + Stats */}
        <div className="space-y-4">
          {/* Live Chart */}
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-4">
              <CandlestickChart data={candles} height={350} showVolume />
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="font-mono text-lg font-bold">
                    ${equity.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  {pnl >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-green))]" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[hsl(var(--accent-red))]" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PnL</p>
                  <p
                    className={cn(
                      "font-mono text-lg font-bold",
                      pnl >= 0
                        ? "text-[hsl(var(--accent-green))]"
                        : "text-[hsl(var(--accent-red))]"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {pnl}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trades</p>
                  <p className="font-mono text-lg font-bold">{trades.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Decision</p>
                  <p className="font-mono text-lg font-bold">{nextDecision}m</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Current Position */}
          {position && (
            <Card
              className={cn(
                "border-2",
                position.type === "long"
                  ? "border-[hsl(var(--accent-green)/0.3)] bg-[hsl(var(--accent-green)/0.05)]"
                  : "border-[hsl(var(--accent-red)/0.3)] bg-[hsl(var(--accent-red)/0.05)]"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Open Position</span>
                  <Badge
                    className={cn(
                      position.type === "long"
                        ? "bg-[hsl(var(--accent-green))] text-black"
                        : "bg-[hsl(var(--accent-red))] text-white"
                    )}
                  >
                    {position.type.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-mono font-medium">
                      ${position.entryPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-mono font-medium">{position.size} BTC</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop Loss</p>
                    <p className="font-mono font-medium text-[hsl(var(--accent-red))]">
                      ${position.stopLoss.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Take Profit</p>
                    <p className="font-mono font-medium text-[hsl(var(--accent-green))]">
                      ${position.takeProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-card/50 p-3">
                  <p className="text-xs text-muted-foreground">Unrealized PnL</p>
                  <p
                    className={cn(
                      "font-mono text-xl font-bold",
                      position.unrealizedPnL >= 0
                        ? "text-[hsl(var(--accent-green))]"
                        : "text-[hsl(var(--accent-red))]"
                    )}
                  >
                    {position.unrealizedPnL >= 0 ? "+" : ""}$
                    {position.unrealizedPnL.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!position && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No Open Position</p>
                <p className="text-xs text-muted-foreground">
                  AI is waiting for entry signal
                </p>
              </CardContent>
            </Card>
          )}

          {/* Trade History */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {trades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <p className="text-sm">No trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trades.map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                trade.type === "long"
                                  ? "border-[hsl(var(--accent-green)/0.3)] text-[hsl(var(--accent-green))]"
                                  : "border-[hsl(var(--accent-red)/0.3)] text-[hsl(var(--accent-red))]"
                              )}
                            >
                              {trade.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ${trade.entryPrice.toLocaleString()} → $
                              {trade.exitPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "font-mono text-sm font-medium",
                            trade.pnl >= 0
                              ? "text-[hsl(var(--accent-green))]"
                              : "text-[hsl(var(--accent-red))]"
                          )}
                        >
                          {trade.pnl >= 0 ? "+" : ""}
                          {trade.pnlPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

