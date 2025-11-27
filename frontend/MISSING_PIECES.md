# AlphaLab UI - Missing Pieces & Implementation Gaps

This document tracks all identified gaps and missing functionality in the current UI implementation.

**Last Updated:** November 27, 2025

---

## ✅ Completed Features

### Charts & Data Visualization
- [x] **Chart library integrated** - TradingView's Lightweight Charts (lightweight, ~40KB)
- [x] **CandlestickChart component** - Full OHLC candlestick chart with volume
- [x] **EquityCurveChart component** - Area chart with drawdown overlay
- [x] **MiniSparkline component** - Compact sparkline for cards

### Pages/Routes Created
- [x] `/dashboard/arena/backtest/[sessionId]` - Battle screen with live chart, AI thoughts, controls
- [x] `/dashboard/arena/forward/[sessionId]` - Live session view with position card
- [x] `/dashboard/results/[resultId]` - Full result detail with tabs (equity, trades, reasoning, analysis)

### Theme System
- [x] `next-themes` integrated with ThemeProvider
- [x] Light & Dark mode CSS variables defined
- [x] Theme persistence via localStorage
- [x] Settings page controls theme switching with toast feedback

### State Management
- [x] Zustand stores created (ui-store, agents-store, arena-store, results-store)
- [x] Filters and search now functional in agents list
- [x] Filters and pagination functional in results list

### Architecture
- [x] Types separated into `types/` directory
- [x] Dummy data centralized in `lib/dummy-data.ts`
- [x] Notification bell added to sidebar with popover

---

## 🟡 Remaining Gaps

## 🟡 Remaining Functional Gaps

### 4. Sidebar Polish
- [ ] Collapse toggle button visibility could be improved
- [x] ~~Keyboard shortcut for toggling sidebar (Cmd/Ctrl + B)~~ ✅ IMPLEMENTED in `app/dashboard/layout.tsx`
- [ ] Mobile sidebar behavior needs testing

### 5. Dashboard Components
Some dashboard components still have internal mock data (low priority since they would fetch from API):
- `StatsCardRow` - Uses internal mock stats
- `RecentActivity` - Uses internal mock activity
- `LiveSessionsPanel` - Uses internal mock sessions
- `QuickStartGuide` - Uses internal mock steps

### 6. Missing Pages
- [x] ~~`/dashboard/agents/[agentId]/edit`~~ ✅ IMPLEMENTED: `agent-edit-wizard.tsx` - Reuses step components with purple theme

---

## 🟢 UI Polish Needed

### 7. Loading States
- [x] ~~Skeleton loaders~~ ✅ IMPLEMENTED: `components/ui/skeletons.tsx`
  - `AgentCardSkeleton`, `AgentListSkeleton`, `AgentDetailSkeleton`
  - `ResultCardSkeleton`, `ResultListSkeleton`, `ResultDetailSkeleton`
  - `DashboardStatsSkeleton`, `ActivitySkeleton`
  - `ChartSkeleton`, `TableSkeleton`
  - `PageLoadingSkeleton`
- [ ] Suspense boundaries for route loading

### 8. Error States
- [x] ~~Error boundary components~~ ✅ IMPLEMENTED: `components/ui/error-states.tsx`
  - `ErrorBoundary` - Class component wrapper
  - `ErrorDisplay` - Configurable error card
  - `NetworkError`, `ServerError`, `NotFoundError` - Specific error types
  - `EmptyState` - For empty data
  - `InlineError` - For inline error messages
  - `AsyncState` - Helper for loading/error/data states

### 9. Toast Notifications
- [x] Sonner configured in root layout
- [x] Theme changes show toasts
- [x] ~~Agent CRUD operations~~ ✅ Delete/duplicate now show toasts in `agent-detail-view.tsx`
- [ ] Test start/completion toasts

### 10. Chart Styling (Dark Mode)
- [x] **Chart axis colors** - ✅ FIXED: Now uses theme-aware colors computed at runtime
  - `components/charts/candlestick-chart.tsx` - Added `getChartColors()` helper that returns actual hex colors based on `isDark` state from `useTheme()`
  - Grid lines, text, borders, crosshair all now use theme-appropriate colors
  - Chart re-renders on theme change via `isDark` dependency
- [ ] `components/ui/chart.tsx` (Recharts wrapper) - Still needs similar treatment if used

### 11. Button State Conflicts
- [x] **Start/Stop buttons showing simultaneously** - ✅ FIXED: Now conditionally rendered
  - `components/arena/backtest/battle-screen.tsx`:
    - Stop button only shows after test has started (`currentCandle > 0`)
    - Play/Pause hides when complete (`progress >= 100`)
    - Shows "View Results" button when complete
  - `components/arena/forward/live-session-view.tsx`:
    - Stop button styling changes based on pause state (more prominent when paused)
    - Button text changes: "Stop" → "End Session" when paused

### 12. Overflow Handling for Labels/Indicators
- [x] **Horizontal scroll for overflowing indicators** - ✅ FIXED: Added scrollable containers
  - `components/agents/detail/agent-detail-view.tsx` - Now uses `overflow-x-auto` with `shrink-0` badges
  - `components/agents/creation/step-data-buffet.tsx` - Shows ALL selected indicators (removed 6-item limit), scrollable
  - `components/carousel/indicator-chips.tsx` - Scrollable on mobile, wraps on desktop
  - `components/agents/creation/step-strategy-prompt.tsx` - Prompt templates now horizontally scrollable with fade indicators
  - `components/agents/creation/step-model-api.tsx` - Model selector dropdown fixed with proper width constraints
  - Added `.scrollbar-thin` utility class to `globals.css` for subtle scrollbars
- [ ] `components/agents/agent-card.tsx` - Still truncates (intentional for card preview)

### 12b. Props-Based Architecture
- [x] Component interfaces moved to `types/` files:
  - `StepModelApiProps`, `StepIdentityProps`, `StepDataBuffetProps`, `StepStrategyPromptProps` → `types/agent.ts`
  - `AgentDetailViewProps` → `types/agent.ts`
  - `QuickTestModalProps` → `types/dashboard.ts`

---

## 🔵 Features Not Yet Implemented

### 13. Modals & Dialogs
- [x] ~~**Quick Test modal**~~ ✅ IMPLEMENTED: `components/modals/quick-test-modal.tsx` - Select agent & test type
- [x] ~~Delete agent confirmation dialog~~ ✅ IMPLEMENTED: AlertDialog in `agent-detail-view.tsx`
- [x] Stop forward test confirmation dialog (implemented)

### 14. Advanced Features (Future)
- [ ] Command palette (Cmd/Ctrl + K)
- [ ] Global keyboard shortcuts
- [x] ~~Certificate PDF generation~~ ✅ IMPLEMENTED: `components/results/certificate-preview.tsx`
  - Browser preview with beautiful certificate design
  - Download as PDF using html2canvas + jsPDF
  - QR code placeholder for verification
- [x] ~~Share result to social~~ ✅ IMPLEMENTED: `components/results/share-result.tsx`
  - Twitter, LinkedIn, Telegram, WhatsApp sharing
  - Copy link functionality
  - Native share API support
  - Dropdown and dialog variants
- [x] ~~Compare two results~~ ✅ IMPLEMENTED: `/dashboard/results/compare`
  - Side-by-side metric comparison
  - Win/loss scoring for each metric
  - Visual highlighting of better values

---

## 📋 Implementation Priority

### Phase 1 - Core Functionality
1. Add chart library and create chart components
2. Create backtest battle screen with charts
3. Create forward test live view
4. Create result detail page
5. Make filters and sorting functional

### Phase 2 - Polish & UX
1. Implement working theme switching
2. Add loading states/skeletons
3. Setup toast notifications
4. Refactor to props-first approach
5. Add notification indicator to sidebar
6. ~~Fix chart axis/grid colors for dark mode~~ ✅
7. ~~Fix start/stop button state conflicts~~ ✅
8. ~~Add horizontal scroll for overflowing indicator tags~~ ✅

### Phase 3 - Advanced Features
1. Certificate generation
2. Command palette
3. Keyboard shortcuts
4. Share functionality

---

## 🛠️ Technical Debt

### Dependencies to Add
```bash
# Charts
bun add recharts
# OR
bun add lightweight-charts

# Theme
bun add next-themes

# PDF Generation (for certificates)
bun add @react-pdf/renderer
# OR
bun add html2canvas jspdf
```

### State Management
Consider adding global state for:
- User preferences (theme, sidebar state)
- Active sessions
- Notification count
- Filter/sort state persistence

---

## Files to Create

```
frontend/
├── app/dashboard/
│   ├── arena/
│   │   ├── backtest/[sessionId]/page.tsx    # Battle screen
│   │   └── forward/[sessionId]/page.tsx     # Live session view
│   ├── results/[resultId]/page.tsx          # Result detail
│   └── agents/[agentId]/edit/page.tsx       # Edit agent
├── components/
│   ├── charts/
│   │   ├── candlestick-chart.tsx
│   │   ├── equity-curve-chart.tsx
│   │   └── mini-chart.tsx
│   ├── arena/
│   │   ├── backtest/
│   │   │   ├── battle-screen.tsx
│   │   │   ├── ai-thoughts-panel.tsx
│   │   │   └── battle-controls.tsx
│   │   └── forward/
│   │       ├── live-session-view.tsx
│   │       ├── position-card.tsx
│   │       └── trade-history.tsx
│   ├── results/
│   │   ├── result-detail.tsx
│   │   ├── trade-list-table.tsx
│   │   ├── reasoning-trace.tsx
│   │   └── certificate-preview.tsx
│   ├── ui/
│   │   └── skeleton-variants.tsx
│   └── providers/
│       └── theme-provider.tsx
└── lib/
    └── stores/                              # If using Zustand
        ├── user-store.ts
        └── arena-store.ts
```

---

## 🏗️ Architecture Guidelines

### Dummy Data File
Create a centralized dummy data file at `lib/dummy-data.ts` with all mock data for frontend testing:
- All agents, results, sessions mock data in one place
- Export typed constants that match prop interfaces
- Easy to swap with real API calls later

### Zustand for UI State
Use Zustand stores for lightweight, fast UI state:
```
lib/stores/
├── ui-store.ts          # Theme, sidebar state, modals
├── agents-store.ts      # Agents list, filters, selected agent
├── arena-store.ts       # Active sessions, battle state
└── results-store.ts     # Results filters, selected result
```

Keep stores minimal - only UI state, not data caching.

### Type Interfaces - Separate Files
All type interfaces in dedicated files:
```
types/
├── agent.ts             # Agent, AgentFormData, AgentMode
├── arena.ts             # BacktestConfig, ForwardConfig, BattleState
├── result.ts            # TestResult, TradeEntry, Certificate
├── chart.ts             # CandleData, EquityPoint, ChartConfig
├── settings.ts          # UserPreferences, ApiKey, NotificationSettings
└── index.ts             # Re-export all types
```

### Performance Guidelines
- Use `React.memo()` for expensive list items
- Lazy load heavy components (charts, modals)
- Use `dynamic()` imports for route-level code splitting
- Keep bundle size minimal - avoid heavy libraries
- Prefer CSS animations over JS animations

---

*Last updated: November 27, 2025* (Major update: Edit page, Skeletons, Error states, Certificate PDF, Compare results, Social share)

