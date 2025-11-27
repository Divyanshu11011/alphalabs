"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Palette, Bell, Key, Sliders, AlertTriangle, Download, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  {
    title: "General",
    items: [
      { name: "Profile", href: "/dashboard/settings/profile", icon: User },
      { name: "Appearance", href: "/dashboard/settings/appearance", icon: Palette },
      { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Trading",
    items: [
      { name: "API Keys", href: "/dashboard/settings/api-keys", icon: Key },
      { name: "Preferences", href: "/dashboard/settings/preferences", icon: Sliders },
      { name: "Risk Limits", href: "/dashboard/settings/risk-limits", icon: AlertTriangle },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Data Export", href: "/dashboard/settings/data-export", icon: Download },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Settings Navigation */}
        <nav className="space-y-6">
          {settingsNav.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

