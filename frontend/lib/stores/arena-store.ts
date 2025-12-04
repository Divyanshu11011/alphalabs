/**
 * Arena Store - Battle state, active sessions
 */

import { create } from "zustand";
import type { BattleState, LiveSession, BacktestConfig, ForwardTestConfig, PlaybackSpeed } from "@/types";
import { DUMMY_LIVE_SESSIONS } from "@/lib/dummy-data";

interface ArenaState {
  // Active sessions
  liveSessions: LiveSession[];
  
  // Current battle (backtest)
  battleState: BattleState | null;
  backtestConfig: BacktestConfig | null;
  
  // Forward test config
  forwardConfig: ForwardTestConfig | null;
  
  // Battle controls
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  
  // Actions
  setBacktestConfig: (config: BacktestConfig) => void;
  setForwardConfig: (config: ForwardTestConfig) => void;
  startBattle: (sessionId: string) => void;
  pauseBattle: () => void;
  resumeBattle: () => void;
  stopBattle: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  
  // Live sessions
  addLiveSession: (session: LiveSession) => void;
  removeLiveSession: (id: string) => void;
  updateLiveSession: (id: string, updates: Partial<LiveSession>) => void;
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  // Active sessions - using dummy data
  liveSessions: [],
  
  // Battle state
  battleState: null,
  backtestConfig: null,
  forwardConfig: null,
  
  // Controls
  isPlaying: false,
  playbackSpeed: "normal",
  
  // Config setters
  setBacktestConfig: (config) => set({ backtestConfig: config }),
  setForwardConfig: (config) => set({ forwardConfig: config }),
  
  // Battle controls
  startBattle: (sessionId) =>
    set({
      battleState: {
        sessionId,
        status: "running",
        currentCandle: 0,
        totalCandles: 720, // 30 days of 1h candles
        elapsedTime: 0,
        currentPnL: 0,
        currentEquity: get().backtestConfig?.capital || 10000,
        openPosition: null,
        trades: [],
        aiThoughts: [],
      },
      isPlaying: true,
    }),
  pauseBattle: () =>
    set((state) => ({
      isPlaying: false,
      battleState: state.battleState
        ? { ...state.battleState, status: "paused" }
        : null,
    })),
  resumeBattle: () =>
    set((state) => ({
      isPlaying: true,
      battleState: state.battleState
        ? { ...state.battleState, status: "running" }
        : null,
    })),
  stopBattle: () =>
    set((state) => ({
      isPlaying: false,
      battleState: state.battleState
        ? { ...state.battleState, status: "completed" }
        : null,
    })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  
  // Live sessions
  addLiveSession: (session) =>
    set((state) => ({ liveSessions: [...state.liveSessions, session] })),
  removeLiveSession: (id) =>
    set((state) => ({
      liveSessions: state.liveSessions.filter((s) => s.id !== id),
    })),
  updateLiveSession: (id, updates) =>
    set((state) => ({
      liveSessions: state.liveSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
}));

