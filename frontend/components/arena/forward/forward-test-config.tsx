"use client";

import { useState } from "react";
import { Play, Bot, DollarSign, Shield, Bell, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
];

// Mock active sessions
const mockActiveSessions: Array<{
  id: string;
  agentName: string;
  asset: string;
  duration: string;
  pnl: number;
}> = [];

export function ForwardTestConfig() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAgent = searchParams.get("agent");
  
  // Get agents from store
  const { agents } = useAgentsStore();
  const { setForwardConfig } = useArenaStore();

  const [config, setConfig] = useState({
    agentId: preselectedAgent || "",
    asset: "btc-usdt",
    timeframe: "1h",
    capital: "10000",
    safetyMode: true,
    emailNotifications: false,
    autoStopOnLoss: false,
  });

  const selectedAgent = agents.find((a) => a.id === config.agentId);
  // Check if agent has at least one profitable backtest
  const profitableTests = selectedAgent?.stats.profitableTests ?? 0;
  const canForwardTest = selectedAgent && profitableTests > 0;

  const handleStartTest = () => {
    // Save config to store before navigating
    setForwardConfig({
      agentId: config.agentId,
      asset: config.asset,
      timeframe: config.timeframe as "15m" | "1h" | "4h",
      capital: parseInt(config.capital),
      safetyMode: config.safetyMode,
      emailNotifications: config.emailNotifications,
      autoStopOnLoss: config.autoStopOnLoss,
    });
    
    const sessionId = Math.random().toString(36).substring(7);
    router.push(`/dashboard/arena/forward/${sessionId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--accent-green)/0.2)]">
            <Play className="h-5 w-5 text-[hsl(var(--accent-green))]" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold">Forward Test Arena</h1>
            <p className="text-sm text-muted-foreground">
              Paper trade with live market data - no real money at risk
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {/* Requirements Check */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Requirements Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[hsl(var(--accent-green))]" />
                <span className="text-sm">Agent selected with valid API key</span>
              </div>
              <div className="flex items-center gap-3">
                {profitableTests > 0 ? (
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--accent-green))]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[hsl(var(--accent-red))]" />
                )}
                <span className="text-sm">At least one profitable backtest</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[hsl(var(--accent-green))]" />
                <span className="text-sm">Account in good standing</span>
              </div>

              <div className="mt-4 rounded-lg border border-[hsl(var(--accent-amber)/0.3)] bg-[hsl(var(--accent-amber)/0.1)] p-3">
                <p className="text-xs text-[hsl(var(--accent-amber))]">
                  ⚠ Forward testing uses live data and runs continuously until stopped
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agent Selection */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Select Agent</CardTitle>
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
                  {agents.map((agent) => {
                    const agentProfitableTests = agent.stats.profitableTests ?? 0;
                    return (
                      <SelectItem
                        key={agent.id}
                        value={agent.id}
                        disabled={agentProfitableTests === 0}
                      >
                        <div className="flex items-center gap-3">
                          <Bot className="h-4 w-4" />
                          <span className="font-mono">{agent.name}</span>
                          {agentProfitableTests > 0 ? (
                            <Badge variant="secondary" className="text-xs text-[hsl(var(--accent-green))]">
                              ✓ {agentProfitableTests} profitable
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-[hsl(var(--accent-red))]">
                              ✗ No profitable tests
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only agents with at least one profitable backtest can forward test
              </p>
            </CardContent>
          </Card>

          {/* Test Settings */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Test Settings</CardTitle>
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
                          {asset.icon} {asset.name}
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
                <Label>Starting Capital (Paper)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    value={config.capital}
                    onChange={(e) => setConfig({ ...config, capital: e.target.value })}
                    className="pl-9 font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paper money - for simulation only
                </p>
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
                    Enable Safety Mode
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={config.emailNotifications}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, emailNotifications: checked as boolean })
                    }
                  />
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Email notifications for trades
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autostop"
                    checked={config.autoStopOnLoss}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, autoStopOnLoss: checked as boolean })
                    }
                  />
                  <Label htmlFor="autostop" className="text-sm">
                    Auto-stop after losing 10% of capital
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Active Sessions */}
          {mockActiveSessions.length > 0 && (
            <Card className="border-[hsl(var(--accent-green)/0.3)] bg-[hsl(var(--accent-green)/0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You have {mockActiveSessions.length} active session(s)
                </p>
                {/* Session cards would go here */}
              </CardContent>
            </Card>
          )}

          {/* Start Button */}
          <Card className="border-border/50 bg-card/30">
            <CardContent className="pt-6">
              <div className="rounded-lg border border-[hsl(var(--accent-amber)/0.3)] bg-[hsl(var(--accent-amber)/0.1)] p-3 mb-4">
                <p className="text-xs text-[hsl(var(--accent-amber))]">
                  ⚠ This will run continuously on our servers until you stop it. You can
                  close this page and come back anytime.
                </p>
              </div>

              <Button
                className="w-full gap-2 bg-[hsl(var(--accent-green))] text-black hover:bg-[hsl(var(--accent-green))]/90"
                disabled={!canForwardTest}
                onClick={handleStartTest}
              >
                <Play className="h-4 w-4" />
                Start Forward Test
              </Button>

              {!canForwardTest && selectedAgent && (
                <p className="mt-3 text-center text-xs text-[hsl(var(--accent-red))]">
                  This agent needs at least one profitable backtest first
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

