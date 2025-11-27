"use client";

import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuickTestModal } from "@/components/modals/quick-test-modal";

// Random motivational quotes for the subtitle
const motivationalQuotes = [
  "Ready to train some fighters?",
  "The market awaits your AI.",
  "Time to prove your strategy.",
  "Let's build something legendary.",
  "Your next alpha is waiting.",
];

export function DashboardHeader() {
  const { user } = useUser();
  const [showQuickTest, setShowQuickTest] = useState(false);
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.firstName || "Trader";
  
  // Get a random quote (in real app, could be deterministic per session)
  const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Greeting */}
      <div className="space-y-1">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {quote}
        </p>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowQuickTest(true)}
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Test</span>
        </Button>
        <Button asChild size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/agents/new">
            <Plus className="h-4 w-4" />
            <span>New Agent</span>
          </Link>
        </Button>
      </div>

      {/* Quick Test Modal */}
      <QuickTestModal open={showQuickTest} onOpenChange={setShowQuickTest} />
    </div>
  );
}

