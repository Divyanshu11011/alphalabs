"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function CreateAgentCard() {
  return (
    <Link href="/dashboard/agents/new">
      <Card className="group flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-border/50 bg-muted/10 p-6 transition-all hover:border-primary hover:bg-muted/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border/50 transition-colors group-hover:border-primary">
          <Plus className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-mono text-base font-semibold text-foreground">
            Create New Agent
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Click to configure a new AI fighter
          </p>
        </div>
      </Card>
    </Link>
  );
}

