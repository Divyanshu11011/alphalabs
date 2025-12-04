"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Key, Plus, Eye, EyeOff, RefreshCw, Edit, Trash2, ExternalLink, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AnimatedSelect,
  AnimatedSelectContent,
  AnimatedSelectItem,
  AnimatedSelectTrigger,
  AnimatedSelectValue,
} from "@/components/ui/animated-select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useApiKeys } from "@/hooks/use-api-keys";
import { toast } from "sonner";

type ApiKeyStatus = "valid" | "untested" | "invalid";

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  addedAt: Date;
  lastUsed: string | null;
  usedBy: string[];
  status: ApiKeyStatus;
  isDefault: boolean;
}

// Mock saved API keys
const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    provider: "OpenRouter",
    label: "Default",
    maskedKey: "sk-or-v1-G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��",
    addedAt: new Date("2025-11-15"),
    lastUsed: "2 hours ago",
    usedBy: ["+�-prime", "+�-2"],
    status: "valid",
    isDefault: true,
  },
  {
    id: "2",
    provider: "OpenRouter",
    label: "Secondary",
    maskedKey: "sk-or-v1-G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��",
    addedAt: new Date("2025-11-20"),
    lastUsed: null,
    usedBy: [],
    status: "untested",
    isDefault: false,
  },
];

export default function ApiKeysSettingsPage() {
  const { apiKeys, isLoading, error, createApiKey, validateApiKey, deleteApiKey } = useApiKeys();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKey, setNewKey] = useState({ provider: "openrouter", label: "", key: "", setDefault: false });
  const [showKey, setShowKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map API response to component format
  const keys = apiKeys.map((key) => ({
    id: key.id,
    provider: key.provider,
    label: key.label || "",
    maskedKey: key.key_prefix || "sk-or-v1-••••••••",
    addedAt: new Date(key.created_at),
    lastUsed: key.last_used_at ? new Date(key.last_used_at).toLocaleString() : null,
    usedBy: key.used_by || [],
    status: key.status,
    isDefault: key.is_default,
  }));

  const handleCreateKey = async () => {
    if (!newKey.key.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setIsSubmitting(true);
    try {
      await createApiKey({
        provider: newKey.provider,
        label: newKey.label || undefined,
        api_key: newKey.key,
        set_as_default: newKey.setDefault,
      });
      toast.success("API key added successfully");
      setShowAddDialog(false);
      setNewKey({ provider: "openrouter", label: "", key: "", setDefault: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateKey = async (id: string) => {
    try {
      await validateApiKey(id);
      toast.success("API key validated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to validate API key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }
    try {
      await deleteApiKey(id);
      toast.success("API key deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete API key");
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">API Key Security</CardTitle>
          <CardDescription>
            Your API keys are encrypted and stored securely. We never have access to
            your actual keys - only encrypted versions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Saved API Keys */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Saved API Keys</CardTitle>
            <CardDescription>Manage your stored API keys</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API Key</DialogTitle>
                <DialogDescription>
                  Add a new API key for your AI models
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <AnimatedSelect
                    value={newKey.provider}
                    onValueChange={(value) => setNewKey({ ...newKey, provider: value })}
                  >
                    <AnimatedSelectTrigger>
                      <AnimatedSelectValue />
                    </AnimatedSelectTrigger>
                    <AnimatedSelectContent>
                      <AnimatedSelectItem value="openrouter">OpenRouter</AnimatedSelectItem>
                      <AnimatedSelectItem value="anthropic" disabled>
                        Anthropic (Coming soon)
                      </AnimatedSelectItem>
                    </AnimatedSelectContent>
                  </AnimatedSelect>
                </div>
                <div className="space-y-2">
                  <Label>Label (Optional)</Label>
                  <Input
                    placeholder="e.g., Work Account"
                    value={newKey.label}
                    onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    A name to help you identify this key
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  />
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Get a key from OpenRouter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="setDefault"
                    checked={newKey.setDefault}
                    onCheckedChange={(checked) =>
                      setNewKey({ ...newKey, setDefault: checked as boolean })
                    }
                  />
                  <Label htmlFor="setDefault" className="text-sm">
                    Set as default key for new agents
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save API Key"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading API keys...</div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-destructive">{error}</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No API keys found. Add one to get started.</div>
          ) : (
            keys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="rounded-lg border border-border/50 bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{apiKey.provider}</span>
                    {apiKey.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                    {showKey === apiKey.id ? "sk-or-v1-actual-key-here" : apiKey.maskedKey}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added: {apiKey.addedAt.toLocaleDateString()} G�� Last used:{" "}
                    {apiKey.lastUsed || "Never"}
                  </p>
                  {apiKey.usedBy.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Used by: {apiKey.usedBy.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      apiKey.status === "valid" &&
                        "border-[hsl(var(--accent-green)/0.3)] text-[hsl(var(--accent-green))]",
                      apiKey.status === "invalid" &&
                        "border-[hsl(var(--accent-red)/0.3)] text-[hsl(var(--accent-red))]",
                      apiKey.status === "untested" &&
                        "border-[hsl(var(--accent-amber)/0.3)] text-[hsl(var(--accent-amber))]"
                    )}
                  >
                    {apiKey.status === "valid" && <Check className="mr-1 h-3 w-3" />}
                    {apiKey.status === "untested" && <AlertCircle className="mr-1 h-3 w-3" />}
                    {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                >
                  {showKey === apiKey.id ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showKey === apiKey.id ? "Hide" : "Reveal"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleValidateKey(apiKey.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.info("Edit functionality coming soon")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteKey(apiKey.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Supported Providers */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Supported Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">OpenRouter</span>
                <Badge variant="secondary" className="text-[hsl(var(--accent-green))]">
                  Active
                </Badge>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Direct API</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  Setup G��
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4 opacity-60">
              <div className="flex items-center justify-between">
                <span className="font-medium">Anthropic Direct</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

