# Original User Request

## 2026-08-17T16:38:11Z

Build a high-performance Faith & Fitness Walking and Step Tracker community section on BodiedbyEsh.com for the Coastal Community Church walking group (#3266). The section is accessible via dedicated group link with seamless access to Bodied by Esh member features, incorporating Supabase Row Level Security (RLS) for individual privacy alongside shared group stats, scripture devotionals, and faith milestone tracking.

Working directory: c:/projects/BodiedbyEsh
Integrity mode: development

## Requirements

### R1. Dedicated Group Portal & Seamless Onboarding
Create an accessible entry route (e.g., `/coastal` or `/coastal-walk`) tailored for Coastal Community Church Group #3266 members. Provide a streamlined entry flow where members can participate directly with email/magic-link or passwordless/authenticated session, accessing Bodied by Esh member capabilities while automatically associating with the Coastal group.

### R2. Step, Distance, and Activity Tracker with Full RLS
Implement daily and historical step logging, mileage calculation, active walking time, and streak counter. Enforce strict Supabase Row Level Security (RLS) policies ensuring users have write/read control over their private metrics while exposing aggregate public metrics for community progress.

### R3. Scripture Devotionals & Faith Milestone Engine
Integrate a dynamic devotional and scripture reflection engine ("Walking by Faith") featuring curated daily Bible verses, reflection prompts, and milestone unlocks (e.g. 5k, 10k, 50k, 100k collective steps) that harmonize physical conditioning with spiritual renewal.

### R4. Community Goal & Group Progress Feed
A shared group progress dashboard showcasing the collective step total toward communal faith milestones (e.g. collective mileage journey), group leaderboard/activity highlights, and encouragement notes from fellow members.

### R5. Brand Synergy & Design Standards
Unify Coastal Community Church's uplifting, communal voice with Bodied by Esh's signature premium dark-mode aesthetic. Strictly use Lucide SVG icons (no AI emojis), responsive layouts for mobile, tablet, desktop, and foldable screens with safe-area insets.

## Acceptance Criteria

### Security & Data Isolation
- [ ] Supabase database schema and RLS policies allow authenticated group members to manage their own step records while preventing unauthorized edits to other members' records.
- [ ] Aggregate group queries (total steps, group milestones) execute securely without exposing sensitive personal info.

### Interactive Features & UI
- [ ] Users can log daily steps, view daily/weekly summaries, and monitor personal streaks.
- [ ] Group progress bar accurately aggregates member contributions toward collective community faith goals.
- [ ] Daily scripture card displays relevant Bible verses and reflection prompts.
- [ ] UI is fully responsive with safe-area styling and uses exclusively Lucide SVG icons with zero emojis.

### Verification & Build Stability
- [ ] All new routes, components, and APIs compile with zero TypeScript or lint errors via `npm run build`.
