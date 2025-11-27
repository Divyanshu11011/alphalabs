// Settings Types

export type Theme = "dark" | "light" | "system";
export type AccentColor = "cyan" | "purple" | "green" | "amber";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
}

export interface AppearanceSettings {
  theme: Theme;
  accentColor: AccentColor;
  sidebarCollapsed: boolean;
}

export interface NotificationSettings {
  email: {
    testCompleted: boolean;
    tradeExecuted: boolean;
    dailySummary: boolean;
    stopLossHit: boolean;
    marketing: boolean;
  };
  inApp: {
    showToasts: boolean;
    soundEffects: boolean;
    desktopNotifications: boolean;
  };
}

export interface TradingPreferences {
  defaultAsset: string;
  defaultTimeframe: string;
  defaultCapital: number;
  defaultSpeed: string;
  safetyModeDefault: boolean;
  allowLeverageDefault: boolean;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxLeverage: number;
  maxLossPerTrade: number;
  maxDailyLoss: number;
  maxTotalDrawdown: number;
}

export type ApiKeyStatus = "valid" | "invalid" | "untested";

export interface ApiKey {
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

export interface ExportOptions {
  agentConfigs: boolean;
  testResults: boolean;
  tradeHistory: boolean;
  reasoningTraces: boolean;
  accountSettings: boolean;
}

