"use client";

import { useState } from "react";
import { History, Zap, Bot, Calendar, Clock, DollarSign, Shield, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAgentsStore, useArenaStore } from "@/lib/stores";

const assets = [
  { id: "btc-usdt", name: "BTC/USDT", icon: "₿" },
  { id: "eth-usdt", name: "ETH/USDT", icon: "Ξ" },
  { id: "sol-usdt", name: "SOL/USDT", icon: "◎" },
];

const timeframes = [
  { id: "15m", name: "15 Minutes" },
  { id: "1h", name: "1 Hour" },
  { id: "4h", name: "4 Hours" },
  { id: "1d", name: "1 Day" },
];

const datePresets = [
  { id: "7d", name: "Last 7 days" },
  { id: "30d", name: "Last 30 days" },
  { id: "90d", name: "Last 90 days" },
  { id: "bull", name: "Bull Run" },
  { id: "crash", name: "Crash" },
];

const speedOptions = [
  { id: "slow", name: "Slow (1s/candle)", ms: 1000 },
  { id: "normal", name: "Normal (500ms/candle)", ms: 500 },
  { id: "fast", name: "Fast (200ms/candle)", ms: 200 },
  { id: "instant", name: "Instant", ms: 0 },
];

export function BacktestConfig() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAgent = searchParams.get("agent");
  
  // Get agents from store
  const { agents } = useAgentsStore();
  const { setBacktestConfig } = useArenaStore();

  const [config, setConfig] = useState({
    agentId: preselectedAgent || "",
    asset: "btc-usdt",
    timeframe: "1h",
    datePreset: "30d",
    startDate: "",
    endDate: "",
    capital: "10000",
    speed: "normal",
    safetyMode: true,
    allowLeverage: false,
  });

  const selectedAgent = agents.find((a) => a.id === config.agentId);
  const estimatedCandles = config.datePreset === "30d" ? 720 : config.datePreset === "7d" ? 168 : 2160;
  const estimatedTime = Math.ceil((estimatedCandles * (speedOptions.find(s => s.id === config.speed)?.ms || 500)) / 60000);

  const handleStartBattle = () => {
    // Save config to store before navigating
    setBacktestConfig({
      agentId: config.agentId,
      asset: config.asset,
      timeframe: config.timeframe as "15m" | "1h" | "4h" | "1d",
      datePreset: config.datePreset,
      startDate: config.startDate || undefined,
      endDate: config.endDate || undefined,
      capital: parseInt(config.capital),
      speed: config.speed as "slow" | "normal" | "fast" | "instant",
      safetyMode: config.safetyMode,
      allowLeverage: config.allowLeverage,
    });
    
    const sessionId = Math.random().toString(36).substring(7);
    router.push(`/dashboard/arena/backtest/${sessionId}`);
  };

  const canStart = config.agentId && config.asset && config.capital;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold">Backtest Arena</h1>
            <p className="text-sm text-muted-foreground">
              Test your AI agent against historical market data
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Step 1: Select Agent */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  1
                </span>
                Select Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={config.agentId}
                onValueChange={(value) => setConfig({ ...config, agentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-3">
                        <Bot className="h-4 w-4" />
                        <span className="font-mono">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {agent.model} • {agent.mode}
                        </span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {agent.stats.totalTests} tests
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAgent && (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-medium">
                      {selectedAgent.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        selectedAgent.mode === "monk"
                          ? "border-[hsl(var(--accent-purple)/0.3)] text-[hsl(var(--accent-purple))]"
                          : "border-primary/30 text-primary"
                      )}
                    >
                      {selectedAgent.mode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedAgent.model} • {selectedAgent.stats.totalTests} previous tests
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Arena Settings */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  2
                </span>
                Arena Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select
                    value={config.asset}
                    onValueChange={(value) => setConfig({ ...config, asset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          <span>
                            {asset.icon} {asset.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select
                    value={config.timeframe}
                    onValueChange={(value) => setConfig({ ...config, timeframe: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframes.map((tf) => (
                        <SelectItem key={tf.id} value={tf.id}>
                          {tf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={config.datePreset === preset.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ ...config, datePreset: preset.id })}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ~{estimatedCandles} candles • {config.timeframe} timeframe
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Simulation Settings */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  3
                </span>
                Simulation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Starting Capital</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      value={config.capital}
                      onChange={(e) => setConfig({ ...config, capital: e.target.value })}
                      className="pl-9 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Playback Speed</Label>
                  <Select
                    value={config.speed}
                    onValueChange={(value) => setConfig({ ...config, speed: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {speedOptions.map((speed) => (
                        <SelectItem key={speed.id} value={speed.id}>
                          {speed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="safety"
                    checked={config.safetyMode}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, safetyMode: checked as boolean })
                    }
                  />
                  <Label htmlFor="safety" className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Enable Safety Mode (Auto stop-loss at -2% per trade)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="leverage"
                    checked={config.allowLeverage}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, allowLeverage: checked as boolean })
                    }
                  />
                  <Label htmlFor="leverage" className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Allow Leverage (Up to 5x - Degen Mode)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-4 border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Battle Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent</span>
                  <span className="font-mono">{selectedAgent?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset</span>
                  <span className="font-mono">
                    {assets.find((a) => a.id === config.asset)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-mono">
                    {datePresets.find((d) => d.id === config.datePreset)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital</span>
                  <span className="font-mono">${parseInt(config.capital).toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Estimated time:</span>
                  <span className="font-mono font-medium">~{estimatedTime} min</span>
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!canStart}
                onClick={handleStartBattle}
              >
                <Zap className="h-4 w-4" />
                Start Battle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

