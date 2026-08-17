# E2E Test Infra: Coastal Community Church (#3266) Faith & Fitness Walking Portal

## Test Philosophy
- Opaque-box, requirement-driven testing covering all 31 features (F01–F31).
- 4-Tier Test Matrix: Category-Partition (Tier 1), Boundary Value Analysis (Tier 2), Cross-Feature Interactions (Tier 3), Real-World Workload Scenarios (Tier 4).
- Verification mechanisms validate UI components, data structures, calculators, RLS security contracts, and Next.js build compilation.

## Feature Inventory Coverage
| # | Feature ID | Name | Tier 1 (>=5) | Tier 2 (>=5) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|------------|------|:------------:|:------------:|:-----------------:|:-----------------:|
| 1 | F01 | Dedicated Route `/coastal` | 5 | 5 | ✓ | ✓ |
| 2 | F02 | Route Alias `/coastal-walk` | 5 | 5 | ✓ | ✓ |
| 3 | F03 | Seamless Onboarding Modal | 5 | 5 | ✓ | ✓ |
| 4 | F04 | Group #3266 Auto-Association | 5 | 5 | ✓ | ✓ |
| 5 | F05 | Guest Preview Mode | 5 | 5 | ✓ | ✓ |
| 6 | F06 | Daily Step Logging | 5 | 5 | ✓ | ✓ |
| 7 | F07 | Mileage Calculation | 5 | 5 | ✓ | ✓ |
| 8 | F08 | Active Walking Time Engine | 5 | 5 | ✓ | ✓ |
| 9 | F09 | Daily & Historical Log History | 5 | 5 | ✓ | ✓ |
| 10 | F10 | Walking Streak Counter | 5 | 5 | ✓ | ✓ |
| 11 | F11 | Supabase Step Logs RLS | 5 | 5 | ✓ | ✓ |
| 12 | F12 | 14-Day "Walking by Faith" Curriculum | 5 | 5 | ✓ | ✓ |
| 13 | F13 | Daily Devotional Rotation Engine | 5 | 5 | ✓ | ✓ |
| 14 | F14 | Interactive Reflection Journal | 5 | 5 | ✓ | ✓ |
| 15 | F15 | Individual Faith Milestone Badges | 5 | 5 | ✓ | ✓ |
| 16 | F16 | Milestone Unlock Notifications | 5 | 5 | ✓ | ✓ |
| 17 | F17 | Communal Faith Journey Engine | 5 | 5 | ✓ | ✓ |
| 18 | F18 | Real-Time Group Progress Bar | 5 | 5 | ✓ | ✓ |
| 19 | F19 | Community Leaderboard | 5 | 5 | ✓ | ✓ |
| 20 | F20 | Encouragement & Prayer Wall | 5 | 5 | ✓ | ✓ |
| 21 | F21 | SVG Encouragement Reactions | 5 | 5 | ✓ | ✓ |
| 22 | F22 | Supabase Database Schema | 5 | 5 | ✓ | ✓ |
| 23 | F23 | Secure Aggregate RPC Functions | 5 | 5 | ✓ | ✓ |
| 24 | F24 | Coastal Backend API Routes | 5 | 5 | ✓ | ✓ |
| 25 | F25 | Supabase Client/Server Service Layer | 5 | 5 | ✓ | ✓ |
| 26 | F26 | Obsidian Gold & Coastal Dark Theme | 5 | 5 | ✓ | ✓ |
| 27 | F27 | Safe-Area Responsive Mobile Layout | 5 | 5 | ✓ | ✓ |
| 28 | F28 | Zero-Emoji Lucide SVG Compliance | 5 | 5 | ✓ | ✓ |
| 29 | F29 | Global Header & Navigation Integration | 5 | 5 | ✓ | ✓ |
| 30 | F30 | 4-Tier Test Suite & Test Runner | 5 | 5 | ✓ | ✓ |
| 31 | F31 | Production Build Stability | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner Location**: `scripts/run-coastal-tests.mjs` (or `node tests/coastal/run-all-tests.mjs`)
- **Invocation**: `node scripts/run-coastal-tests.mjs`
- **Output Format**: Structured TAP/JSON and console output with zero failure tolerance.
- **Pass/Fail Semantics**: Process exits with code 0 on all tests passing, non-zero on any failure.

## 4 Tiers Description
- **Tier 1: Feature Coverage (>=5 test cases per feature)**: Validate isolated behaviors (e.g. step logging, mileage calculation, devotional rotation, join group).
- **Tier 2: Boundary & Corner Cases (>=5 test cases per feature)**: Validate boundaries (e.g. 0 steps, 1 step, 100k steps, leap days, timezone changes, max message length, empty strings, anonymous toggle).
- **Tier 3: Cross-Feature Combinations (Pairwise)**: Step log triggers communal milestone unlock; reflection save with devotional day shift; auth modal switch during logging.
- **Tier 4: Real-World Workload Scenarios**: Sunday church group walking surge (50 concurrent walkers logging), full 14-day continuous walking streak journey, anonymous vs public leaderboards.
