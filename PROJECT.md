# Project: Coastal Community Church (#3266) Faith & Fitness Walking & Step Tracker

## Architecture
- **Framework**: Next.js 16.2.9 App Router (`src/app/`) with React 19.2.4
- **Database & Auth**: Supabase PostgreSQL with `@supabase/ssr` 0.12.0 and `@supabase/supabase-js` 2.108.2
- **Data Isolation**: Strict Row Level Security (RLS) on all user data (`auth.uid() = user_id`) and SECURITY DEFINER RPCs for privacy-preserving community aggregations
- **Styling**: Tailwind CSS v4 design tokens (`--t-surface`, `--t-card`, `--t-accent: #D4B87E`, `--t-violet: #C58B8B`, `.glass-panel`, `.page-container`)
- **Iconography**: Exclusively `lucide-react` SVG icons. Strictly 100% zero AI/unicode emojis across all copy, code, and UI.
- **Responsiveness**: Multi-device support (mobile, tablet, desktop, foldable) with safe-area insets (`.safe-top`, `.safe-bottom`, `.safe-x`).

## Feature Inventory
| # | Feature ID | Name | Description | Milestone | Source |
|---|------------|------|-------------|-----------|--------|
| 1 | F01 | Dedicated Route `/coastal` | Accessible dedicated portal for Coastal Community Church (#3266) | M3 | ORIGINAL_REQUEST §R1 |
| 2 | F02 | Route Alias `/coastal-walk` | Seamless alias/redirect to `/coastal` | M3 | ORIGINAL_REQUEST §R1 |
| 3 | F03 | Seamless Onboarding Modal | Magic link, email/password, guest preview with group auto-association | M3 | ORIGINAL_REQUEST §R1 |
| 4 | F04 | Group #3266 Auto-Association | Automatic membership linking to Coastal group (#3266) upon sign-in | M3 | ORIGINAL_REQUEST §R1 |
| 5 | F05 | Guest Preview Mode | Read-only access to group progress, devotionals, and feed without auth | M3 | ORIGINAL_REQUEST §R1 |
| 6 | F06 | Daily Step Logging | Fast input with presets (+1k, +2.5k, +5k, +10k) and custom step count | M4 | ORIGINAL_REQUEST §R2 |
| 7 | F07 | Mileage Calculation | Real-time dynamic distance calculation (steps / 2000 = miles) | M4 | ORIGINAL_REQUEST §R2 |
| 8 | F08 | Active Walking Time Engine | Estimation & logging of active minutes (steps / 100 = minutes) | M4 | ORIGINAL_REQUEST §R2 |
| 9 | F09 | Daily & Historical Log History | Expandable history view with date filtering and day summaries | M4 | ORIGINAL_REQUEST §R2 |
| 10 | F10 | Walking Streak Counter | Gap-and-island consecutive active day tracking with streak freezes | M4 | ORIGINAL_REQUEST §R2 |
| 11 | F11 | Supabase Step Logs RLS | Strict `auth.uid() = user_id` row-level isolation on step logs | M1 | ORIGINAL_REQUEST §R2 |
| 12 | F12 | 14-Day "Walking by Faith" Curriculum | Curated scripture verses, physical/spiritual themes, action challenges | M5 | ORIGINAL_REQUEST §R3 |
| 13 | F13 | Daily Devotional Rotation Engine | Deterministic daily rotation with manual day navigation & date picker | M5 | ORIGINAL_REQUEST §R3 |
| 14 | F14 | Interactive Reflection Journal | Secure private reflection notes per devotional with autosave | M5 | ORIGINAL_REQUEST §R3 |
| 15 | F15 | Individual Faith Milestone Badges | 11 personal milestone achievements (First Step, 5k, 10k, Streaks, Marathons) | M5 | ORIGINAL_REQUEST §R3 |
| 16 | F16 | Milestone Unlock Notifications | Dynamic toast and modal notifications upon hitting milestones | M5 | ORIGINAL_REQUEST §R3 |
| 17 | F17 | Communal Faith Journey Engine | 6 collective church journeys (50k Jericho, 100k Galilee, 250k Sinai, 500k Emmaus, 1M Roman Road, 2.5M Promised Land) | M6 | ORIGINAL_REQUEST §R4 |
| 18 | F18 | Real-Time Group Progress Bar | Live aggregation of collective group steps and distance towards current target | M6 | ORIGINAL_REQUEST §R4 |
| 19 | F19 | Community Leaderboard | Weekly & all-time walker rankings with optional anonymous display mode | M6 | ORIGINAL_REQUEST §R4 |
| 20 | F20 | Encouragement & Prayer Wall | Message feed for posting inspirational notes, prayers, and walking shouts | M6 | ORIGINAL_REQUEST §R4 |
| 21 | F21 | SVG Encouragement Reactions | Uplifting reactions (Praying, Fire/Energy, Heart, Crown) using Lucide SVGs | M6 | ORIGINAL_REQUEST §R4 |
| 22 | F22 | Supabase Database Schema | Complete PostgreSQL DDL for groups, members, logs, devotionals, milestones, feed | M1 | ORIGINAL_REQUEST §R2, R4 |
| 23 | F23 | Secure Aggregate RPC Functions | `get_group_stats`, `get_group_leaderboard`, `get_user_streak` SECURITY DEFINER functions | M1 | ORIGINAL_REQUEST §R2 |
| 24 | F24 | Coastal Backend API Routes | `/api/coastal/steps`, `/api/coastal/community`, `/api/coastal/devotionals`, `/api/coastal/join` | M2 | ORIGINAL_REQUEST §R1-R4 |
| 25 | F25 | Supabase Client & Server Service Layer | Reusable TypeScript data access functions in `src/lib/coastal/` | M2 | ORIGINAL_REQUEST §R1-R4 |
| 26 | F26 | Obsidian Gold & Coastal Dark Theme | Harmonized dark UI styling with gold accents and glassmorphic cards | M7 | ORIGINAL_REQUEST §R5 |
| 27 | F27 | Safe-Area Responsive Mobile Layout | Seamless viewports across iPhone safe insets, Android, foldables, and desktop | M7 | ORIGINAL_REQUEST §R5 |
| 28 | F28 | Zero-Emoji Lucide SVG Compliance | 100% Lucide React SVG iconography; zero AI or unicode emojis in code/copy | M7 | ORIGINAL_REQUEST §R5 |
| 29 | F29 | Global Header & Navigation Integration | Link to Coastal Community Church walking group in main navigation & footer | M7 | ORIGINAL_REQUEST §R1, R5 |
| 30 | F30 | 4-Tier Test Suite & Test Runner | Automated test harness executing Tier 1 (Coverage), Tier 2 (Boundaries), Tier 3 (Interactions), Tier 4 (Workloads) | M8 | ORIGINAL_REQUEST Acceptance |
| 31 | F31 | Production Build Stability | `npm run build` compilation with 0 TypeScript/lint errors | M8 | ORIGINAL_REQUEST Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema, Migration & Types | SQL DDL, RLS policies, RPCs, seed data, TypeScript definitions | none | DONE |
| M2 | Backend API & Service Layer | Data access helpers, API routes (`/api/coastal/*`), auth helpers | M1 | DONE |
| M3 | Onboarding & Entry Flow | `/coastal`, `/coastal-walk`, `CoastalHero`, `CoastalAuthModal`, group join | M2 | DONE |
| M4 | Step, Distance & Streak Tracker | `StepTracker`, daily log form, history table, streak calculation | M2 | DONE |
| M5 | Scripture Devotionals & Faith Milestones | `ScriptureCard`, reflection journal, 14-day devotionals, badges | M2 | DONE |
| M6 | Community Goal, Feed & Leaderboard | `GroupProgress`, `Leaderboard`, `EncouragementFeed`, SVG reactions | M2 | DONE |
| M7 | UI Integration, Header/Nav & Zero-Emoji Audit | Full layout integration, navigation links, safe-area audit, Lucide SVG enforcement | M3, M4, M5, M6 | DONE |
| M8 | Comprehensive Verification & E2E Testing | Execute 4-Tier test suite, adversarial testing, forensic integrity audit, `npm run build` | M7 | DONE |

## Code Layout
- `scratch/coastal_3266_setup.sql`: Complete PostgreSQL schema, RLS policies, RPCs, triggers, seed data
- `src/types/coastal.ts`: Shared TypeScript interfaces for Coastal walking group, logs, devotionals, milestones, feed
- `src/lib/coastal/`:
  - `db.ts`: Data access functions (steps, streak, devotionals, milestones, community)
  - `devotionals-data.ts`: Curated 14-day "Walking by Faith" scripture and devotional repository
  - `milestones-data.ts`: Milestone definitions (individual + communal)
- `src/app/api/coastal/`:
  - `steps/route.ts`: GET/POST/DELETE step logs
  - `community/route.ts`: GET group stats, leaderboard, encouragements; POST encouragement
  - `devotionals/route.ts`: GET daily devotional; POST reflection
  - `join/route.ts`: POST join group #3266
- `src/app/coastal/`:
  - `page.tsx`: Main Coastal Community Church (#3266) portal page
- `src/app/coastal-walk/`:
  - `page.tsx`: Route alias/redirect to `/coastal`
- `src/components/coastal/`:
  - `CoastalHero.tsx`: Group #3266 header, badge, join CTA, quick stats summary
  - `StepTracker.tsx`: Interactive step logger, quick presets, mileage/minutes calculator, streak badge, history
  - `ScriptureCard.tsx`: Daily "Walking by Faith" devotional, scripture display, reflection prompt & journal
  - `GroupProgress.tsx`: Collective church step journey bar, active walkers count, current faith milestone
  - `Leaderboard.tsx`: Top walkers leaderboard with anonymous mode toggle
  - `EncouragementFeed.tsx`: Community prayer & encouragement wall with Lucide SVG reactions
  - `CoastalAuthModal.tsx`: Seamless magic-link / password sign-in & group #3266 auto-association
  - `MilestoneModal.tsx`: Celebration popup when faith milestones are unlocked
- `src/components/Header.tsx` & `src/components/Footer.tsx`: Navigation links to Coastal walking group
- `tests/e2e/coastal.spec.ts` or `tests/coastal/`: 4-Tier comprehensive test suite

## Interface Contracts
### `src/types/coastal.ts`
```typescript
export interface WalkingGroup {
  id: string;
  slug: string;
  name: string;
  group_number: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  is_anonymous: boolean;
  role: 'member' | 'leader' | 'admin';
  joined_at: string;
}

export interface StepLog {
  id: string;
  user_id: string;
  group_id: string;
  log_date: string; // YYYY-MM-DD
  steps: number;
  distance_miles: number;
  active_minutes: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaithDevotional {
  id: string;
  day_number: number;
  title: string;
  scripture_ref: string;
  scripture_text: string;
  theme: string;
  reflection_prompt: string;
  prayer_focus: string;
  walking_action: string;
}

export interface DevotionalReflection {
  id: string;
  user_id: string;
  devotional_id: string;
  reflection_text: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMilestone {
  id: string;
  group_id: string;
  title: string;
  target_steps: number;
  target_miles: number;
  description: string;
  scripture_theme: string;
  is_reached: boolean;
  unlocked_at?: string | null;
}

export interface CommunityEncouragement {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  message: string;
  reactions: Record<string, number>; // { prayer: 5, heart: 3, fire: 7, crown: 2 }
  created_at: string;
}

export interface GroupStats {
  group_id: string;
  total_steps: number;
  total_miles: number;
  active_members_count: number;
  current_milestone: GroupMilestone | null;
  next_milestone: GroupMilestone | null;
  progress_percentage: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  is_anonymous: boolean;
  total_steps: number;
  total_miles: number;
  streak_days: number;
  rank: number;
}
```
