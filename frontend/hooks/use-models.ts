import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@/lib/api";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: string;
  contextWindow: string;
  best_for: string;
  capabilities: string[];
  is_multimodal?: boolean;
}

const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1",
    provider: "deepseek",
    description: "Reasoning-optimized model with strong math and logic skills.",
    speed: "fast",
    context_window: "64K tokens",
    best_for: "Logical reasoning, math-heavy strategies",
    capabilities: ["text", "reasoning"],
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Balanced model for nuanced analysis and creative ideation.",
    speed: "medium",
    context_window: "200K tokens",
    best_for: "Nuanced analysis, complex reasoning",
    capabilities: ["text", "analysis"],
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Large-context model with strong multi-modal support.",
    speed: "fast",
    context_window: "1M tokens",
    best_for: "Large context, multi-modal analysis",
    capabilities: ["text", "vision", "analysis"],
    is_multimodal: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "General-purpose model with balanced speed and quality.",
    speed: "medium",
    context_window: "128K tokens",
    best_for: "General purpose, balanced performance",
    capabilities: ["text", "analysis", "vision"],
    is_multimodal: true,
  },
];

export function useModels() {
  const { get } = useApiClient();
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
  const response = await get<Array<Omit<ModelInfo, "contextWindow"> & { context_window: string }>>("/api/models");
  if (Array.isArray(response) && response.length > 0) {
    setModels(
      response.map((model) => ({
        ...model,
        contextWindow: model.context_window,
      }))
    );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  return {
    models,
    isLoading,
    error,
    refetch: fetchModels,
  };
}

