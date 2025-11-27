# AlphaLab UI/UX Specification
## Part 2: Sidebar & Navigation

---

## 📍 SIDEBAR COMPONENT OVERVIEW

```
┌────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (Expanded State - 240px width)                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ◇ ALPHALAB                                            [«]   │  │
│  │  The Arena for AI Traders                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ─────────────────── MAIN ───────────────────                      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [🏠]  Dashboard                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [🤖]  My Agents                                         [3] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ─────────────────── ARENA ───────────────────                     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [⏪]  Backtest                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [▶️]  Forward Test                                    [LIVE] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ─────────────────── RECORDS ───────────────────                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [📊]  Results & Certs                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ─────────────────────────────────────────────                     │
│                                                                    │
│                         (spacer - flex grow)                       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [⚙️]  Settings                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ┌────┐                                                      │  │
│  │  │ AV │  alex.verma@gmail.com                          [▾]   │  │
│  │  └────┘  Pro Plan                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔽 COLLAPSED STATE (64px width)

```
┌──────────┐
│          │
│    ◇     │  ← Logo only (icon)
│          │
├──────────┤
│          │
│   [🏠]   │  ← Icon only, tooltip on hover
│          │
├──────────┤
│          │
│   [🤖]   │  ← Badge shows as dot overlay
│    •3    │
│          │
├──────────┤
│          │
│   [⏪]   │
│          │
├──────────┤
│          │
│   [▶️]   │
│    •     │  ← Green dot if live session active
│          │
├──────────┤
│          │
│   [📊]   │
│          │
├──────────┤
│          │
│  (flex)  │
│          │
├──────────┤
│          │
│   [⚙️]   │
│          │
├──────────┤
│          │
│  ┌────┐  │
│  │ AV │  │  ← Avatar only, click opens dropdown
│  └────┘  │
│          │
└──────────┘
```

---

## 🧱 COMPONENT BREAKDOWN

### 1. SIDEBAR HEADER

```
Component: SidebarHeader
├── Logo
│   ├── Icon: Custom diamond/gem icon (◇)
│   ├── Text: "ALPHALAB" (JetBrains Mono, 16px, bold)
│   └── Tagline: "The Arena for AI Traders" (10px, text-muted)
│
├── Collapse Button
│   ├── Icon: ChevronLeft (expanded) / ChevronRight (collapsed)
│   ├── Position: Absolute right
│   └── Action: Toggle sidebar width
│
└── State
    ├── Expanded: Show full logo + tagline + button
    └── Collapsed: Show icon only, button appears on hover
```

**shadcn Components:**
- `SidebarHeader`
- `Button` (variant: ghost, size: icon)
- `Tooltip` (for collapsed state)

---

### 2. NAVIGATION GROUPS

```
Component: SidebarNavGroup
├── Label
│   ├── Text: Group name (e.g., "MAIN", "ARENA", "RECORDS")
│   ├── Style: 10px, uppercase, text-muted, letter-spacing: 0.1em
│   └── Collapsed: Hidden
│
└── Items: SidebarNavItem[]
```

---

### 3. NAVIGATION ITEM

```
Component: SidebarNavItem
├── Icon
│   ├── Size: 18px
│   ├── Active: accent-cyan
│   └── Inactive: text-secondary
│
├── Label
│   ├── Style: 14px, Inter
│   └── Collapsed: Hidden (tooltip instead)
│
├── Badge (Optional)
│   ├── Type: Count badge OR Status badge
│   ├── Count: Number in small rounded rect
│   ├── Status: "LIVE" in accent-green, "NEW" in accent-amber
│   └── Collapsed: Shows as colored dot overlay on icon
│
├── States
│   ├── Default: bg-transparent
│   ├── Hover: bg-elevated
│   ├── Active: bg-elevated + left-border accent-cyan (2px)
│   └── Disabled: opacity-50, cursor-not-allowed
│
└── Actions
    └── onClick: Navigate to route
```

**shadcn Components:**
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `Badge`
- `Tooltip`

---

### 4. USER FOOTER

```
Component: SidebarUserFooter
├── Avatar
│   ├── Component: shadcn Avatar
│   ├── Size: 36px
│   ├── Fallback: Initials (bg-accent-purple)
│   └── Source: Clerk user image
│
├── User Info (Expanded only)
│   ├── Email: 13px, text-primary, truncate
│   └── Plan: 11px, text-muted
│
├── Dropdown Trigger
│   ├── Icon: ChevronDown
│   └── Collapsed: Entire avatar is trigger
│
└── Dropdown Menu
    ├── Header: User email (non-clickable)
    ├── Items:
    │   ├── [👤] Profile
    │   ├── [💳] Billing
    │   ├── [🔑] API Keys → /settings/api-keys
    │   ├── ─────────────
    │   └── [🚪] Sign Out
    └── Component: shadcn DropdownMenu
```

**shadcn Components:**
- `Avatar` + `AvatarImage` + `AvatarFallback`
- `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent`
- `DropdownMenuItem` + `DropdownMenuSeparator`

---

## 🎯 NAVIGATION ITEM SPECIFICATIONS

| Route | Icon | Label | Badge | Notes |
|-------|------|-------|-------|-------|
| `/dashboard` | `LayoutDashboard` | Dashboard | - | Default landing after login |
| `/agents` | `Bot` | My Agents | `{count}` | Count of user's agents |
| `/arena/backtest` | `History` | Backtest | - | Historical simulation |
| `/arena/forward` | `Play` | Forward Test | `LIVE` | Green badge if active session |
| `/results` | `BarChart3` | Results & Certs | - | Test history |
| `/settings` | `Settings` | Settings | - | Pushed to bottom |

---

## 📱 MOBILE BEHAVIOR

```
┌─────────────────────────────────────────────────────────────────┐
│  MOBILE NAVIGATION                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOP BAR (Fixed, 56px height)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [☰]    ◇ ALPHALAB                              [🔔] [AV] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SHEET (Opens from left on hamburger click)                     │
│  ┌─────────────────────────┐                                    │
│  │                         │                                    │
│  │  Same content as        │                                    │
│  │  expanded sidebar       │                                    │
│  │                         │                                    │
│  │  + Close button [✕]     │                                    │
│  │    at top right         │                                    │
│  │                         │                                    │
│  │  + Clicking item        │                                    │
│  │    auto-closes sheet    │                                    │
│  │                         │                                    │
│  └─────────────────────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**shadcn Components:**
- `Sheet` + `SheetTrigger` + `SheetContent`
- `Button` (variant: ghost) for hamburger

---

## 🔔 NOTIFICATION INDICATOR (Future Feature)

```
Component: NotificationBell (Mobile top bar / Desktop sidebar)
├── Icon: Bell
├── Badge: Red dot if unread notifications exist
├── Dropdown/Sheet: List of notifications
│   ├── Test completed
│   ├── Certificate ready
│   └── Forward test triggered trade
└── State: Stored in notificationStore
```

---

## 🎨 SIDEBAR STYLING TOKENS

```css
/* Sidebar Container */
--sidebar-width-expanded: 240px;
--sidebar-width-collapsed: 64px;
--sidebar-bg: var(--bg-primary);
--sidebar-border: var(--border);

/* Nav Items */
--nav-item-height: 40px;
--nav-item-radius: 6px;
--nav-item-padding: 12px;
--nav-active-border-width: 2px;
--nav-active-border-color: var(--accent-cyan);

/* Transitions */
--sidebar-transition: width 200ms ease;
--nav-item-transition: background 150ms ease, color 150ms ease;
```

---

## 🔗 COMPONENT FILE STRUCTURE

```
/components/sidebar/
├── sidebar.tsx                 # Main sidebar container
├── sidebar-header.tsx          # Logo + collapse button
├── sidebar-nav.tsx             # Navigation wrapper
├── sidebar-nav-group.tsx       # Group with label
├── sidebar-nav-item.tsx        # Individual nav item
├── sidebar-user-footer.tsx     # User avatar + dropdown
└── mobile-nav.tsx              # Mobile sheet navigation
```

---

## ⚡ INTERACTIONS & ANIMATIONS

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Sidebar collapse/expand | Width transition | 200ms ease |
| Nav item hover | Background fade in | 150ms |
| Nav item active | Left border slide in | 150ms |
| Dropdown open | Fade + slide down | 150ms |
| Mobile sheet open | Slide from left | 250ms |
| Badge appear | Scale pop | 200ms spring |

---

**← Back to Part 1: App Structure | Continue to Part 3: Dashboard Home →**

