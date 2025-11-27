"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Eye } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { StepIdentityProps } from "@/types/agent";

const modes = [
  {
    id: "monk" as const,
    icon: Crosshair,
    name: "MONK MODE",
    subtitle: "The Blindfolded Quant",
    features: [
      "Pure technical analysis",
      "No news, no dates",
      "Max 1% risk per trade",
      "1 trade per 4 hours",
    ],
    description: "Prove your AI understands market structure.",
  },
  {
    id: "omni" as const,
    icon: Eye,
    name: "OMNI MODE",
    subtitle: "The God View",
    features: [
      "All technical indicators",
      "News & sentiment data",
      "Full market context",
      "Flexible trading rules",
    ],
    description: "Prove your AI can filter signal from noise.",
  },
];

export function StepIdentity({ formData, updateFormData }: StepIdentityProps) {
  return (
    <div className="space-y-6">
      {/* Agent Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Agent Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter agent name..."
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="input-glow font-mono"
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground">
          Give your agent a memorable name (e.g., &quot;Alpha-1&quot;, &quot;MomentumBot&quot;)
        </p>
      </div>

      {/* Arena Mode Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Select Arena Mode <span className="text-destructive">*</span>
        </Label>
        <div className="grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => updateFormData({ mode: mode.id })}
              className={cn(
                "relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all",
                formData.mode === mode.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border hover:bg-muted/30"
              )}
            >
              {/* Mode Header */}
              <div className="mb-3 flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  formData.mode === mode.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  <mode.icon size={24} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold">{mode.name}</h3>
                  <p className="text-xs text-muted-foreground">{mode.subtitle}</p>
                </div>
              </div>

              {/* Features */}
              <ul className="mb-4 space-y-1">
                {mode.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Description */}
              <p className="text-xs italic text-muted-foreground">
                {mode.description}
              </p>

              {/* Selection Indicator */}
              <div
                className={cn(
                  "mt-4 w-full rounded-md py-1.5 text-center text-xs font-medium transition-colors",
                  formData.mode === mode.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {formData.mode === mode.id ? "Selected" : "Select"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

