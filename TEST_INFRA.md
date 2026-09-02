# E2E Test Infra: Bodied by Esh Digital Clinical Client Intake System

## Test Philosophy
- **Opaque-box, requirement-driven**: Exercise all intake routes, coach hub, draft auto-save, API ingress, rate limiting, and admin review portal strictly as an end user / client / coach.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workloads.
- **Zero Emoji AST Enforcer**: Static scan ensuring 100% compliance with Global Rule 1 (0 Unicode/AI emojis, 100% Lucide React SVGs).

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Workload) |
|---|---------|-------------|:-----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Track A (`/intake/park-to-peak`) | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | Pairwise | Scenario 1 |
| 2 | Track B (`/intake/executive-concierge`) | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | Pairwise | Scenario 2 |
| 3 | Track C (`/intake/nutrition-metabolic`) | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | Pairwise | Scenario 3 |
| 4 | Coach Hub (`/intake`) | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | Pairwise | Scenario 4 |
| 5 | LocalStorage Draft Engine | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | Pairwise | Scenario 5 |
| 6 | Ingress API `POST /api/intake` | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | Pairwise | Scenario 1-3 |
| 7 | Sliding-Window Rate Limiter | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | Pairwise | Scenario 6 |
| 8 | Admin API `GET /api/intake` | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | Pairwise | Scenario 4 |
| 9 | Admin Portal (`/admin/intakes`) | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | Pairwise | Scenario 4 |
| 10 | Static Design & Zero Emoji Gate | ORIGINAL_REQUEST §R4 | 5 tests | 5 tests | Pairwise | All Scenarios |

## Test Architecture
- **Automated Runner**: `scripts/run-intake-tests.mjs`
- **Integration**: Included in `npm test` and `scripts/run-prr-audit-suite.mjs`
- **Pass/Fail Semantics**: Exit code 0 if all tests pass with 100% assertion score; non-zero on any failure.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | On-Site Athlete Complete Journey | Coach copies Track A link -> Client opens form -> Drafts answers -> Signs turf/weather waiver -> Submits -> DB persists -> GHL contact created -> Coach receives SMS & email | High |
| 2 | Executive Remote Biometrics Journey | Client opens Track B -> Enters Oura/Whoop stats & desk ergonomics -> Restores from interrupted session -> Signs dynamic recovery waiver -> Submits -> Receives confirmation email | High |
| 3 | Nutrition & Metabolic Recomp Journey | Client fills anthropometrics -> Dynamic MSJ BMR calculation -> Protein target set -> Food trigger log -> AI scanner consent -> Submits | High |
| 4 | Coach Esh Administrative Review Journey | Coach logs in -> Sidebar links to `/admin/intakes` -> Filters new intakes -> Opens clinical detail drawer -> Reviews PAR-Q+ & signature -> Updates status to 'enrolled' | High |
| 5 | Network Failure & Mobile Interrupt Recovery | User fills 80% of form -> Closes browser tab -> Reopens URL -> Restores draft seamlessly -> Submits -> Draft purged from LocalStorage | Medium |
| 6 | DDoS / Ingress Fuzzing Defense | Burst of 20 rapid submissions from single IP -> First 5 processed -> 6-20 return RFC 429 Too Many Requests with Retry-After header | Medium |

## Coverage Thresholds
- **Tier 1**: ≥50 discrete feature assertions across 10 areas
- **Tier 2**: ≥50 boundary and corner-case fuzz assertions
- **Tier 3**: ≥15 cross-feature combinatorial integration assertions
- **Tier 4**: 6 comprehensive real-world multi-actor end-to-end scenarios
- **Static Zero-Emoji Check**: 100% of `.tsx`, `.ts`, and `.css` files verified with zero emojis
- **Total Minimum**: ≥120 discrete verification checks
