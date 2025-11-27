"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function PreferencesSettingsPage() {
  const [preferences, setPreferences] = useState({
    defaultAsset: "btc-usdt",
    defaultTimeframe: "1h",
    defaultCapital: "10000",
    defaultSpeed: "normal",
    safetyModeDefault: true,
    allowLeverageDefault: false,
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Default Settings</CardTitle>
          <CardDescription>
            These settings will be used as defaults when creating new tests.
            You can override them in individual test configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Asset</Label>
              <Select
                value={preferences.defaultAsset}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, defaultAsset: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="btc-usdt">BTC/USDT</SelectItem>
                  <SelectItem value="eth-usdt">ETH/USDT</SelectItem>
                  <SelectItem value="sol-usdt">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Timeframe</Label>
              <Select
                value={preferences.defaultTimeframe}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, defaultTimeframe: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Starting Capital</Label>
            <Input
              type="number"
              value={preferences.defaultCapital}
              onChange={(e) =>
                setPreferences({ ...preferences, defaultCapital: e.target.value })
              }
              className="max-w-xs font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Playback Speed (Backtest)</Label>
            <Select
              value={preferences.defaultSpeed}
              onValueChange={(value) =>
                setPreferences({ ...preferences, defaultSpeed: value })
              }
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow (1s/candle)</SelectItem>
                <SelectItem value="normal">Normal (500ms/candle)</SelectItem>
                <SelectItem value="fast">Fast (200ms/candle)</SelectItem>
                <SelectItem value="instant">Instant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Safety Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="safetyMode"
              checked={preferences.safetyModeDefault}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  safetyModeDefault: checked as boolean,
                })
              }
            />
            <div>
              <Label htmlFor="safetyMode" className="text-sm font-medium">
                Enable Safety Mode by default
              </Label>
              <p className="text-xs text-muted-foreground">
                Auto stop-loss at -2% per trade
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="leverage"
              checked={preferences.allowLeverageDefault}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  allowLeverageDefault: checked as boolean,
                })
              }
            />
            <div>
              <Label htmlFor="leverage" className="text-sm font-medium">
                Allow Leverage by default
              </Label>
              <p className="text-xs text-muted-foreground">Up to 5x leverage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

