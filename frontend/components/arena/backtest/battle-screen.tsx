"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  FastForward,
  SkipForward,
  Square,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { Robot } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import {
  generateDummyCandles,
  DUMMY_AI_THOUGHTS,
  DUMMY_TRADES,
  DUMMY_AGENTS,
} from "@/lib/dummy-data";
import { useAgentsStore, useArenaStore } from "@/lib/stores";
import type { CandleData, AIThought, Trade, PlaybackSpeed } from "@/types";

interface BattleScreenProps {
  sessionId: string;
}

export function BattleScreen({ sessionId }: BattleScreenProps) {
  const router = useRouter();
  
  // Get config and agents from stores
  const { backtestConfig } = useArenaStore();
  const { agents } = useAgentsStore();
  
  // Find the selected agent
  const agent = useMemo(() => {
    if (backtestConfig?.agentId) {
      return agents.find(a => a.id === backtestConfig.agentId) || DUMMY_AGENTS[0];
    }
    return DUMMY_AGENTS[0];
  }, [backtestConfig?.agentId, agents]);
  
  // Get config values with fallbacks
  const initialCapital = backtestConfig?.capital ?? 10000;
  const asset = backtestConfig?.asset ?? "btc-usdt";
  const timeframe = backtestConfig?.timeframe ?? "1h";
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(backtestConfig?.speed ?? "normal");
  const [currentCandle, setCurrentCandle] = useState(0);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [visibleCandles, setVisibleCandles] = useState<CandleData[]>([]);
  const [thoughts, setThoughts] = useState<AIThought[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equity, setEquity] = useState(initialCapital);
  const [pnl, setPnl] = useState(0);

  const totalCandles = 200;

  // Initialize candles
  useEffect(() => {
    const generated = generateDummyCandles(totalCandles);
    setCandles(generated);
    setVisibleCandles(generated.slice(0, 1));
  }, []);

  // Playback logic
  useEffect(() => {
    if (!isPlaying || currentCandle >= totalCandles - 1) return;

    const speedMs = {
      slow: 1000,
      normal: 500,
      fast: 200,
      instant: 0,
    }[speed];

    if (speed === "instant") {
      // Show all candles immediately
      setVisibleCandles(candles);
      setCurrentCandle(totalCandles - 1);
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentCandle((prev) => {
        const next = prev + 1;
        if (next >= totalCandles - 1) {
          setIsPlaying(false);
        }
        return next;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, totalCandles, candles]);

  // Update visible candles
  useEffect(() => {
    setVisibleCandles(candles.slice(0, currentCandle + 1));

    // Simulate PnL changes
    const basePnl = Math.sin(currentCandle / 20) * 15 + (currentCandle / totalCandles) * 20;
    setPnl(Number(basePnl.toFixed(2)));
    setEquity(10000 * (1 + basePnl / 100));

    // Add AI thoughts at certain intervals
    if (currentCandle > 0 && currentCandle % 30 === 0) {
      const thought = DUMMY_AI_THOUGHTS[Math.floor(Math.random() * DUMMY_AI_THOUGHTS.length)];
      setThoughts((prev) => [{ ...thought, id: `thought-${currentCandle}`, candle: currentCandle }, ...prev].slice(0, 20));
    }

    // Add trades at certain intervals
    if (currentCandle > 0 && currentCandle % 50 === 0) {
      const trade = DUMMY_TRADES[Math.floor(Math.random() * DUMMY_TRADES.length)];
      setTrades((prev) => [{ ...trade, id: `trade-${currentCandle}` }, ...prev].slice(0, 10));
    }
  }, [currentCandle, candles, totalCandles]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    // Navigate to results
    router.push(`/dashboard/results/demo-${sessionId}`);
  }, [router, sessionId]);

  const progress = (currentCandle / (totalCandles - 1)) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/arena/backtest"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold">Backtest Battle</h1>
              <Badge
                variant="outline"
                className={cn(
                  isPlaying
                    ? "border-[hsl(var(--accent-profit)/0.3)] text-[hsl(var(--accent-profit))] animate-pulse"
                    : "border-border"
                )}
              >
                {isPlaying ? "RUNNING" : currentCandle === 0 ? "READY" : "PAUSED"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.name} • BTC/USDT • 1H
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card/50 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpeed("slow")}
              className={cn("h-7 px-2", speed === "slow" && "bg-muted")}
            >
              1x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpeed("normal")}
              className={cn("h-7 px-2", speed === "normal" && "bg-muted")}
            >
              2x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpeed("fast")}
              className={cn("h-7 px-2", speed === "fast" && "bg-muted")}
            >
              5x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpeed("instant")}
              className={cn("h-7 px-2", speed === "instant" && "bg-muted")}
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Play/Pause button - always visible except when complete */}
          {progress < 100 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> {currentCandle === 0 ? "Start" : "Resume"}
                </>
              )}
            </Button>
          )}

          {/* Stop button - only show when test has started (not at candle 0) */}
          {currentCandle > 0 && progress < 100 && (
            <Button variant="destructive" size="sm" onClick={handleStop} className="gap-2">
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}

          {/* View Results button - show when complete */}
          {progress >= 100 && (
            <Button 
              size="sm" 
              onClick={handleStop} 
              className="gap-2 bg-[hsl(var(--accent-profit))] text-black hover:bg-[hsl(var(--accent-profit))]/90"
            >
              View Results
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Candle {currentCandle + 1} / {totalCandles}</span>
          <span>{progress.toFixed(0)}% complete</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        {/* Chart Panel */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-4">
              <CandlestickChart
                data={visibleCandles}
                height={400}
                showVolume
              />
            </CardContent>
          </Card>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="font-mono text-lg font-bold">
                    ${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  {pnl >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-profit))]" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[hsl(var(--accent-red))]" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PnL</p>
                  <p
                    className={cn(
                      "font-mono text-lg font-bold",
                      pnl >= 0 ? "text-[hsl(var(--accent-profit))]" : "text-[hsl(var(--accent-red))]"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}{pnl}%
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
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="font-mono text-lg font-bold">
                    {trades.length > 0
                      ? Math.round((trades.filter((t) => t.pnl > 0).length / trades.length) * 100)
                      : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Thoughts Panel */}
        <Card className="border-border/50 bg-card/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Robot size={18} weight="duotone" className="text-[hsl(var(--accent-purple))]" />
              AI Thoughts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] px-4 pb-4">
              {thoughts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Robot size={32} weight="duotone" className="mb-2" />
                  <p className="text-sm">AI is analyzing...</p>
                  <p className="text-xs">Thoughts will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {thoughts.map((thought) => (
                    <div
                      key={thought.id}
                      className={cn(
                        "rounded-lg border p-3 text-sm",
                        thought.type === "decision"
                          ? "border-primary/30 bg-primary/5"
                          : thought.type === "execution"
                          ? "border-[hsl(var(--accent-profit)/0.3)] bg-[hsl(var(--accent-profit)/0.05)]"
                          : "border-border/50 bg-muted/20"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            thought.type === "decision" && "border-primary/30 text-primary",
                            thought.type === "execution" && "border-[hsl(var(--accent-profit)/0.3)] text-[hsl(var(--accent-profit))]"
                          )}
                        >
                          {thought.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Candle #{thought.candle}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{thought.content}</p>
                      {thought.action && (
                        <Badge
                          className={cn(
                            "mt-2",
                            thought.action === "long" && "bg-[hsl(var(--accent-profit))] text-black",
                            thought.action === "short" && "bg-[hsl(var(--accent-red))] text-white",
                            thought.action === "hold" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {thought.action.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

