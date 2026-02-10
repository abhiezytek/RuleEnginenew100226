# Life Insurance STP & Underwriting Rule Engine

## Original Problem Statement
Design and build a Life Insurance Straight Through Processing (STP) and Underwriting Rule Engine that is fully configurable, explainable, and auditable. All rules, scorecards, grids, validations, and decision logic must be configurable from a frontend UI, with no hardcoded logic.

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python) - Note: User originally requested .NET but Python backend is the active implementation
- **Database**: SQLite (temporary; user's original choice was MySQL)

## Core Features Implemented

### 1. Rule Engine Core
- [x] STP Pass/Fail decisions
- [x] Case Type classification (Normal, Direct Accept, Direct Fail, GCRP)
- [x] Scorecard-based underwriting with configurable parameters
- [x] Grid-based rules for BMI, Sum Assured vs. Income
- [x] Priority-based rule execution
- [x] Full audit trail and rule execution tracing

### 2. Rule Groups/Stages (NEW - Feb 2025)
- [x] Sequential execution stages for rule processing
- [x] Stage CRUD operations (Create, Read, Update, Delete)
- [x] Stage execution order configuration
- [x] "Stop on Fail" option per stage
- [x] Stage assignment for rules
- [x] Stage-based evaluation trace in results
- [x] Visual execution flow diagram

### 3. Frontend UI
- [x] Dashboard with stats and recent evaluations
- [x] Rule Builder with visual condition editor
- [x] Rules List with filtering and search
- [x] Stages Management page
- [x] Scorecards configuration
- [x] Grids configuration
- [x] Evaluation Console with stage trace
- [x] Audit Logs viewer
- [x] Products management

### 4. API Endpoints
- [x] `/api/rules` - Rules CRUD
- [x] `/api/stages` - Stages CRUD (NEW)
- [x] `/api/scorecards` - Scorecards CRUD
- [x] `/api/grids` - Grids CRUD
- [x] `/api/products` - Products CRUD
- [x] `/api/underwriting/evaluate` - Main evaluation endpoint
- [x] `/api/dashboard/stats` - Dashboard statistics
- [x] `/api/audit-logs` - Audit trail
- [x] `/api/seed` - Sample data seeding

## Data Models

### RuleStage
```python
{
  id: string,
  name: string,
  description: string,
  execution_order: int,  # Lower = earlier execution
  stop_on_fail: bool,    # Stop if any rule in stage fails
  color: string,         # UI display color
  is_enabled: bool,
  rule_count: int        # Computed field
}
```

### Rule (Updated)
```python
{
  id: string,
  name: string,
  description: string,
  category: enum,        # validation, stp_decision, case_type, scorecard
  stage_id: string,      # NEW: Reference to RuleStage
  stage_name: string,    # NEW: Populated from stage
  condition_group: object,
  action: object,
  priority: int,
  is_enabled: bool,
  products: list,
  case_types: list,
  version: int
}
```

### EvaluationResult (Updated)
```python
{
  proposal_id: string,
  stp_decision: string,
  case_type: int,
  case_type_label: string,
  scorecard_value: int,
  triggered_rules: list,
  validation_errors: list,
  reason_codes: list,
  reason_messages: list,
  rule_trace: list,
  stage_trace: list,     # NEW: Stage-by-stage execution
  evaluation_time_ms: float
}
```

## Stage Execution Logic
1. Stages are processed in `execution_order` (ascending)
2. Within each stage, rules are processed by `priority` (ascending)
3. If a stage has `stop_on_fail=true` and any rule fails, subsequent stages are skipped
4. Rules without a stage assignment are processed last (as "Unassigned Rules")
5. Each stage's execution time and triggered rules are tracked in `stage_trace`

## Test Coverage
- 18 pytest tests covering:
  - Stage CRUD operations
  - Rule-stage assignments
  - Stage-based evaluation
  - Dashboard statistics
  - All tests passing (100%)

## Files Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── insurance_stp.db   # SQLite database
│   └── tests/
│       └── test_stages.py # Stage feature tests
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Stages.jsx          # NEW: Stages management
│       │   ├── EvaluationConsole.jsx # Updated with stage trace
│       │   ├── RuleBuilder.jsx     # Updated with stage selector
│       │   └── RulesList.jsx       # Updated with stage column
│       └── lib/
│           └── api.js              # Updated with stage APIs
└── memory/
    └── PRD.md
```

## Pending/Future Tasks

### P1: Database Migration to MySQL
- User's original choice was MySQL
- Current SQLite implementation is temporary
- Migration requires: connection string update, driver installation, EF migrations

### P2: Code Cleanup
- Remove obsolete `/app/dotnet-backend` directory
- Remove unused Python backend code if .NET is preferred

### P3: Enhancements
- Rule dependencies (rules can depend on outputs of previous rules)
- Visual rule chain flowchart
- Rule versioning and rollback
- Rule import/export functionality

## Session History
- **Initial**: FastAPI + MongoDB
- **Migration 1**: FastAPI + SQLite
- **Migration 2**: .NET Core + SQLite (attempted)
- **Current**: FastAPI + SQLite (active)
- **Feb 2025**: Added Rule Groups/Stages feature
