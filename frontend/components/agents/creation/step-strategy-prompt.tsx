"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TrendUp, TrendDown, ChartLineUp, Target } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StepStrategyPromptProps } from "@/types/agent";

const promptTemplates = [
  {
    id: "momentum",
    name: "Momentum Following",
    icon: TrendUp,
    prompt: `My trading philosophy:

1. Only enter LONG positions when RSI is below 30 (oversold) AND MACD histogram is turning positive (momentum shift).

2. Only enter SHORT positions when RSI is above 70 (overbought) AND price is below EMA_50 (bearish trend).

3. Always set stop loss at 1.5x ATR below entry for LONG, above entry for SHORT.

4. Take profit at 2x the stop loss distance (2:1 R:R).

5. If uncertain, HOLD. Capital preservation is priority.`,
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    icon: TrendDown,
    prompt: `My trading philosophy:

1. Enter LONG when price touches lower Bollinger Band AND RSI < 30.

2. Enter SHORT when price touches upper Bollinger Band AND RSI > 70.

3. Exit positions when price returns to the middle band (20-period SMA).

4. Maximum position hold time: 24 hours.

5. Risk 1% per trade with stop loss at 2x ATR.`,
  },
  {
    id: "trend-following",
    name: "Trend Following",
    icon: ChartLineUp,
    prompt: `My trading philosophy:

1. Only LONG when price is above EMA_20, EMA_50, and EMA_200 (all aligned bullish).

2. Only SHORT when price is below EMA_20, EMA_50, and EMA_200 (all aligned bearish).

3. Confirm trend with ADX > 25 before entry.

4. Trail stop loss at 2x ATR from highest point reached.

5. Never trade against the trend - patience is key.`,
  },
  {
    id: "breakout",
    name: "Breakout",
    icon: Target,
    prompt: `My trading philosophy:

1. Enter LONG on breakout above 20-period Donchian Channel high with volume confirmation (above average).

2. Enter SHORT on breakout below 20-period Donchian Channel low with volume confirmation.

3. Stop loss at the opposite channel boundary.

4. Let winners run - only exit on reverse signal or trailing stop (3x ATR).

5. Avoid trading during low volatility (ATR < 50% of average).`,
  },
];

export function StepStrategyPrompt({
  formData,
  updateFormData,
}: StepStrategyPromptProps) {
  const [showSystemContext, setShowSystemContext] = useState(false);

  const getSystemContext = () => {
    const mode = formData.mode === "monk" ? "MONK MODE" : "OMNI MODE";
    const indicators = formData.indicators.join(", ").toUpperCase() || "None selected";
    const riskLimit = formData.mode === "monk" ? "Max 1% per trade" : "Flexible";
    const frequency = formData.mode === "monk" ? "Max 1 trade per 4 hours" : "Unlimited";

    return `You are a trading AI operating in ${mode}.
Available data: ${indicators}, OHLCV
Risk limit: ${riskLimit}
Frequency: ${frequency}

You must respond with a JSON order object:
{ "action": "LONG|SHORT|HOLD", "leverage": 1-5, "stopLoss": number, "takeProfit": number, "reasoning": string }`;
  };

  const applyTemplate = (template: (typeof promptTemplates)[0]) => {
    // If there's existing content, confirm before replacing
    if (formData.strategyPrompt && formData.strategyPrompt.length > 10) {
      if (!confirm("Replace current strategy with this template?")) {
        return;
      }
    }
    updateFormData({ strategyPrompt: template.prompt });
  };

  const characterCount = formData.strategyPrompt.length;
  const maxCharacters = 4000;

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Define your agent&apos;s trading strategy in plain English. The AI will
        receive this prompt along with market data at each decision point.
      </p>

      {/* System Context Preview */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              SYSTEM CONTEXT (Auto-generated, read-only)
            </Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSystemContext(!showSystemContext)}
            >
              {showSystemContext ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          </div>
          {showSystemContext && (
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {getSystemContext()}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Strategy Prompt Textarea */}
      <div className="space-y-2">
        <Label htmlFor="strategy" className="text-sm font-medium">
          Your Strategy Prompt <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id="strategy"
            placeholder="Describe your trading strategy..."
            value={formData.strategyPrompt}
            onChange={(e) => updateFormData({ strategyPrompt: e.target.value })}
            className="min-h-[280px] resize-none font-mono text-sm input-glow"
            maxLength={maxCharacters}
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {characterCount}/{maxCharacters}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Write clear rules. The AI will interpret these instructions literally.
        </p>
        {characterCount < 50 && characterCount > 0 && (
          <p className="text-xs text-[hsl(var(--accent-amber))]">
            Minimum 50 characters required ({50 - characterCount} more)
          </p>
        )}
      </div>

      {/* Prompt Templates - Horizontally Scrollable */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">PROMPT TEMPLATES</Label>
        <div className="relative -mx-1">
          {/* Fade indicators for scroll */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex gap-3 overflow-x-auto px-1 pb-3 scrollbar-thin">
            {promptTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="shrink-0 rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
                  <template.icon size={18} weight="duotone" className="text-primary" />
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a template to start with a proven strategy framework
        </p>
      </div>
    </div>
  );
}

