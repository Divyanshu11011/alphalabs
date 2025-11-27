"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores";
import { toast } from "sonner";
import type { AccentColor } from "@/types";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const accentColors: { id: AccentColor; name: string; class: string }[] = [
    { id: "cyan", name: "Cyan", class: "bg-[hsl(190,100%,50%)]" },
    { id: "purple", name: "Purple", class: "bg-[hsl(258,90%,66%)]" },
    { id: "green", name: "Green", class: "bg-[hsl(142,76%,36%)]" },
    { id: "amber", name: "Amber", class: "bg-[hsl(38,92%,50%)]" },
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleAccentChange = (color: AccentColor) => {
    setAccentColor(color);
    toast.success(`Accent color changed to ${color}`);
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Theme</CardTitle>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 h-16 w-full rounded bg-zinc-900 border border-zinc-700" />
                <span className="text-sm font-medium">Dark</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 h-16 w-full rounded bg-zinc-100 border border-zinc-300" />
                <span className="text-sm font-medium">Light</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 flex h-16 w-full overflow-hidden rounded border border-zinc-500">
                  <div className="w-1/2 bg-zinc-900" />
                  <div className="w-1/2 bg-zinc-100" />
                </div>
                <span className="text-sm font-medium">System</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Accent Color</CardTitle>
          <CardDescription>Choose your primary accent color</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => handleAccentChange(color.id)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                  accentColor === color.id
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                )}
              >
                <div className={cn("h-8 w-8 rounded-full", color.class)} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Accent color changes will apply globally across the app.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Sidebar</CardTitle>
          <CardDescription>Configure sidebar behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={sidebarCollapsed ? "collapsed" : "expanded"}
            onValueChange={(value) => {
              setSidebarCollapsed(value === "collapsed");
              toast.success(`Sidebar set to ${value} by default`);
            }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expanded" id="expanded" />
              <Label htmlFor="expanded">Expanded by default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="collapsed" id="collapsed" />
              <Label htmlFor="collapsed">Collapsed by default</Label>
            </div>
          </RadioGroup>

          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">
              Keyboard shortcut: <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Ctrl + B</kbd> to toggle sidebar
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => toast.success("Preferences saved!")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
