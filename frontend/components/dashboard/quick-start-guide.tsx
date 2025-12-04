"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, Circle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDashboardDataContext } from "@/components/providers/dashboard-data-provider";
import { Skeleton } from "@/components/ui/skeleton";

type StepStatus = "complete" | "current" | "upcoming";
const QUICK_START_STORAGE_KEY = "alphalab-quick-start-dismissed";

export function QuickStartGuide() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { quickStartSteps, quickStartProgress, isLoading } = useDashboardDataContext();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(QUICK_START_STORAGE_KEY);
    if (stored === "true") {
      setIsDismissed(true);
    }
  }, []);

  const enhancedSteps = useMemo(() => {
    if (!quickStartSteps.length) {
      return [];
    }
    const firstIncompleteIndex = quickStartSteps.findIndex((step) => !step.isComplete);
    return quickStartSteps.map((step, index) => {
      let status: StepStatus = "upcoming";
      if (step.isComplete) {
        status = "complete";
      } else if (firstIncompleteIndex === -1 || index === firstIncompleteIndex) {
        status = "current";
      }
      return { ...step, status };
    });
  }, [quickStartSteps]);

  if (isDismissed) {
    return null;
  }

  if (isLoading && !enhancedSteps.length) {
    return (
      <Card className="border-border/40 bg-card/40">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!enhancedSteps.length) {
    return null;
  }

  const completedSteps = enhancedSteps.filter((step) => step.status === "complete").length;
  const progress = quickStartProgress || (completedSteps / enhancedSteps.length) * 100;
  const isComplete = completedSteps === enhancedSteps.length;

  if (isDismissed || isComplete) {
    return null;
  }

  const currentStep =
    enhancedSteps.find((step) => step.status === "current") ?? enhancedSteps[0];

  return (
    <Card className="border-[hsl(var(--brand-flame)/0.3)] bg-gradient-to-br from-[hsl(var(--brand-flame)/0.05)] to-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-mono text-lg font-semibold">Quick Start Guide</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsDismissed(true);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(QUICK_START_STORAGE_KEY, "true");
            }
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono text-foreground">
              {completedSteps}/{enhancedSteps.length} complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-6 space-y-4">
          {enhancedSteps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {index < enhancedSteps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[11px] top-8 h-[calc(100%+8px)] w-0.5",
                    step.status === "complete"
                      ? "bg-[hsl(var(--brand-flame))]"
                      : "bg-border"
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                  step.status === "complete" &&
                    "border-[hsl(var(--brand-flame))] bg-[hsl(var(--brand-flame))]",
                  step.status === "current" &&
                    "border-primary bg-transparent",
                  step.status === "upcoming" && "border-border bg-transparent"
                )}
              >
                {step.status === "complete" ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <Circle
                    className={cn(
                      "h-2 w-2",
                      step.status === "current"
                        ? "fill-primary text-primary"
                        : "fill-muted-foreground text-muted-foreground"
                    )}
                  />
                )}
              </div>

              <div className="flex-1 pb-4">
                <h4
                  className={cn(
                    "text-sm font-medium",
                    step.status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button asChild className="w-full gap-2">
          <Link href={currentStep.href}>
            {currentStep.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

