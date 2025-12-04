"use client";

import { useState } from "react";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepIdentity } from "./step-identity";
import { StepModelApi } from "./step-model-api";
import { StepDataBuffet } from "./step-data-buffet";
import { StepStrategyPrompt } from "./step-strategy-prompt";
import { useAgents } from "@/hooks/use-agents";
import { useApiKeys } from "@/hooks/use-api-keys";
import { toast } from "sonner";

const steps = [
  { id: 1, name: "Identity", description: "Name & Mode" },
  { id: 2, name: "Model & API", description: "AI Configuration" },
  { id: 3, name: "Data Buffet", description: "Select Indicators" },
  { id: 4, name: "Strategy", description: "Trading Prompt" },
];

export interface AgentFormData {
  // Step 1
  name: string;
  mode: "monk" | "omni" | null;
  // Step 2
  model: string;
  apiKey: string;
  saveApiKey: boolean;
  // Step 3
  indicators: string[];
  customIndicators: Array<{ name: string; formula: string }>;
  // Step 4
  strategyPrompt: string;
}

const initialFormData: AgentFormData = {
  name: "",
  mode: null,
  model: "",
  apiKey: "",
  saveApiKey: false,
  indicators: [],
  customIndicators: [],
  strategyPrompt: "",
};

export function AgentCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentFormData>(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const { createAgent } = useAgents();
  const { createApiKey } = useApiKeys();

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.length >= 2 && formData.mode !== null;
      case 2:
        return formData.model !== "" && formData.apiKey.length > 0;
      case 3:
        return formData.indicators.length > 0;
      case 4:
        return formData.strategyPrompt.length >= 50;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      let apiKeyId = formData.apiKey;

      // If it's a new API key (starts with "sk-"), we need to save it first
      // because the backend requires an api_key_id (UUID), not a raw key
      if (formData.apiKey.startsWith("sk-")) {
        try {
          const newKey = await createApiKey({
            provider: "openrouter",
            api_key: formData.apiKey,
            label: formData.saveApiKey 
              ? `${formData.name} - OpenRouter` 
              : `Temp - ${formData.name}`,
            set_as_default: formData.saveApiKey,
          });
          apiKeyId = newKey.id;
        } catch (error) {
          toast.error("Failed to save API key. Please try again.");
          setIsCreating(false);
          return;
        }
      }

      // Create the agent
      const agent = await createAgent({
        name: formData.name,
        mode: formData.mode!,
        model: formData.model,
        api_key_id: apiKeyId,
        indicators: formData.indicators,
        custom_indicators: formData.customIndicators.length > 0 ? formData.customIndicators : undefined,
        strategy_prompt: formData.strategyPrompt,
      });

      toast.success(`Agent "${formData.name}" created successfully!`);
      router.push(`/dashboard/agents/${agent.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create agent";
      toast.error(errorMessage);
      console.error("Error creating agent:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/agents"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <h1 className="font-mono text-2xl font-bold">Create New Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {currentStep} of 4: {steps[currentStep - 1].name}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    currentStep > step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs",
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 sm:w-20 lg:w-28",
                    currentStep > step.id
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8 rounded-lg border border-border/50 bg-card/30 p-6">
        {currentStep === 1 && (
          <StepIdentity formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepModelApi formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepDataBuffet formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepStrategyPrompt formData={formData} updateFormData={updateFormData} />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard/agents")}>
          Cancel
        </Button>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </motion.div>
          )}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isCreating}
              className={cn(
                currentStep === 4 &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : currentStep === 4 ? (
                "Create Agent ->"
              ) : (
                "Continue ->"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

