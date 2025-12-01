"use client";

import { useState } from "react";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepIdentity } from "./step-identity";
import { StepModelApi } from "./step-model-api";
import { StepDataBuffet } from "./step-data-buffet";
import { StepStrategyPrompt } from "./step-strategy-prompt";
import { useAgents, Agent } from "@/hooks/use-agents";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useToast } from "@/hooks/use-toast";

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

export interface AgentCreationWizardProps {
  initialData?: Agent;
  isEditMode?: boolean;
}

export function AgentCreationWizard({ initialData, isEditMode = false }: AgentCreationWizardProps) {
  const router = useRouter();
  const { createAgent, updateAgent } = useAgents();
  const { createApiKey } = useApiKeys();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data from initialData if in edit mode
  const [formData, setFormData] = useState<AgentFormData>(() => {
    if (isEditMode && initialData) {
      return {
        name: initialData.name,
        mode: initialData.mode,
        model: initialData.model,
        apiKey: initialData.api_key_id || "", // Use ID if available
        saveApiKey: false, // Not relevant for edit
        indicators: initialData.indicators,
        customIndicators: initialData.custom_indicators || [],
        strategyPrompt: initialData.strategy_prompt,
      };
    }
    return initialFormData;
  });

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.length >= 2 &&
          formData.mode !== null &&
          !validationErrors.name
        );
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
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let apiKeyId = formData.apiKey;

      // 1. Handle API Key (only if it's a new raw key)
      if (formData.apiKey.startsWith("sk-")) {
        const newKey = await createApiKey({
          provider: "openrouter",
          api_key: formData.apiKey,
          label: `${formData.name} Key`,
          set_as_default: false,
        });
        apiKeyId = newKey.id;
      }

      // 2. Create or Update Agent
      if (isEditMode && initialData) {
        await updateAgent(initialData.id, {
          name: formData.name,
          mode: formData.mode!,
          model: formData.model,
          api_key_id: apiKeyId,
          indicators: formData.indicators,
          custom_indicators: formData.customIndicators,
          strategy_prompt: formData.strategyPrompt,
        });
        toast({
          title: "Agent updated",
          description: `${formData.name} configuration saved.`,
        });
      } else {
        await createAgent({
          name: formData.name,
          mode: formData.mode!,
          model: formData.model,
          api_key_id: apiKeyId,
          indicators: formData.indicators,
          custom_indicators: formData.customIndicators,
          strategy_prompt: formData.strategyPrompt,
        });
        toast({
          title: "Agent created",
          description: `${formData.name} is ready for the Arena.`,
        });
      }

      router.push(isEditMode ? `/dashboard/agents/${initialData?.id}` : "/dashboard/agents");
    } catch (err) {
      console.error("Failed to save agent:", err);
      toast({
        title: `Failed to ${isEditMode ? "update" : "create"} agent`,
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={isEditMode && initialData ? `/dashboard/agents/${initialData.id}` : "/dashboard/agents"}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {isEditMode ? "Back to Agent" : "Back to Agents"}
        </Link>
        <h1 className="font-mono text-2xl font-bold">
          {isEditMode ? `Edit ${initialData?.name}` : "Create New Agent"}
        </h1>
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
          <StepIdentity
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />
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
        <Button
          variant="ghost"
          onClick={() => router.push(isEditMode && initialData ? `/dashboard/agents/${initialData.id}` : "/dashboard/agents")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={cn(
              currentStep === 4 &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === 4 ? (isEditMode ? "Save Changes" : "Create Agent") : "Continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

