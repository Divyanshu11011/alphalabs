"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
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
import { Progress } from "@/components/ui/progress";

export default function PreferencesSettingsPage() {
  const { settings, isLoading, isSaving, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({
    defaultAsset: "btc-usdt",
    defaultTimeframe: "1h",
    defaultCapital: "10000",
    defaultSpeed: "normal",
    safetyModeDefault: true,
    allowLeverageDefault: false,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        defaultAsset: settings.default_asset || "btc-usdt",
        defaultTimeframe: settings.default_timeframe || "1h",
        defaultCapital: settings.default_capital?.toString() || "10000",
        defaultSpeed: settings.default_playback_speed || "normal",
        safetyModeDefault: settings.safety_mode_default,
        allowLeverageDefault: settings.allow_leverage_default,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      default_asset: localSettings.defaultAsset,
      default_timeframe: localSettings.defaultTimeframe,
      default_capital: parseFloat(localSettings.defaultCapital),
      default_playback_speed: localSettings.defaultSpeed,
      safety_mode_default: localSettings.safetyModeDefault,
      allow_leverage_default: localSettings.allowLeverageDefault,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center text-sm text-muted-foreground">Loading preferences...</div>
          <Progress value={undefined} className="w-full" />
        </div>
      </div>
    );
  }

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
                value={localSettings.defaultAsset}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, defaultAsset: value })
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
                value={localSettings.defaultTimeframe}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, defaultTimeframe: value })
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
              value={localSettings.defaultCapital}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, defaultCapital: e.target.value })
              }
              className="max-w-xs font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Playback Speed (Backtest)</Label>
            <Select
              value={localSettings.defaultSpeed}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, defaultSpeed: value })
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
              checked={localSettings.safetyModeDefault}
              onCheckedChange={(checked) =>
                setLocalSettings({
                  ...localSettings,
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
              checked={localSettings.allowLeverageDefault}
              onCheckedChange={(checked) =>
                setLocalSettings({
                  ...localSettings,
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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

