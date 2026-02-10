# Life Insurance STP & Underwriting Rule Engine

## Original Problem Statement
Design and build a Life Insurance Straight Through Processing (STP) and Underwriting Rule Engine that is fully configurable, explainable, and auditable.

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: SQLite (temporary; user's original choice was MySQL)

## Core Features Implemented

### 1. Rule Engine Core
- [x] STP Pass/Fail decisions
- [x] Case Type classification (Normal, Direct Accept, Direct Fail, GCRP)
- [x] Scorecard-based underwriting
- [x] Grid-based rules
- [x] Priority-based rule execution
- [x] Full audit trail

### 2. Rule Groups/Stages
- [x] Sequential execution stages
- [x] Stage CRUD operations
- [x] "Stop on Fail" option per stage
- [x] Stage-based evaluation trace

### 3. Dependent/Conditional Rules
- [x] Dynamic form fields based on parent answers
- [x] Smoker details (cigarettes/day, years)
- [x] Medical history details (ailment type, duration, ongoing)
- [x] Rules that evaluate conditional field values

### 4. Sub-Products
- [x] Product hierarchy (Term Life → Pure Term, Term with Returns)
- [x] Product-specific rules
- [x] Product variant validation

### 5. Risk Bands & Premium Loading (NEW)
- [x] **17 Risk Bands** across 5 categories:
  - **Age**: Young Adult (-5%), Prime Age (0%), Middle Age (+15%), Senior (+35%), Elder (+75%)
  - **Smoking**: Base Loading (+25%), Heavy Smoker (+30%), Long-term (+20%)
  - **Medical**: Diabetes (+40%), Hypertension (+30%), Thyroid (+15%), Asthma (+20%)
  - **BMI**: Underweight (+10%), Overweight (+10%), Obese (+25%)
  - **Occupation**: High Risk (+50%), Medium Risk (+20%)
- [x] Auto-calculated premium adjustments
- [x] Risk score accumulation
- [x] Visual display of applied bands in evaluation
- [x] Risk Bands management UI

## Sample Premium Calculation
For a 45-year-old smoker with diabetes and BMI 28:
- Base Premium: ₹25,000
- Applied Bands:
  - Middle Age (41-50): +15%
  - Smoker Base Loading: +25%
  - Long-term Smoker: +20%
  - Diabetes: +40%
  - Overweight BMI: +10%
- **Total Loading: +110%**
- **Loaded Premium: ₹52,500**

## API Endpoints
- `/api/rules` - Rules CRUD
- `/api/stages` - Stages CRUD
- `/api/risk-bands` - Risk Bands CRUD (NEW)
- `/api/scorecards` - Scorecards CRUD
- `/api/grids` - Grids CRUD
- `/api/products` - Products CRUD
- `/api/underwriting/evaluate` - Main evaluation (returns risk_loading)

## Files Structure
```
/app
├── backend/
│   └── server.py          # 2300+ lines
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── RiskBands.jsx     # NEW
│       │   ├── Stages.jsx
│       │   ├── EvaluationConsole.jsx
│       │   └── ...
└── memory/
    └── PRD.md
```

## Pending/Future Tasks
- **P1**: Migrate to MySQL
- **P2**: Rule versioning and rollback
- **P3**: Premium loading bands for specific products
- **P4**: Policy document generation

## Session Updates
- **Feb 2025**: Rule Groups/Stages
- **Feb 2025**: Dependent/Conditional Rules
- **Feb 2025**: Sub-Products
- **Feb 2025**: Risk Bands & Premium Loading
