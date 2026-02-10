# Life Insurance STP & Underwriting Rule Engine

## Original Problem Statement
Design and build a Life Insurance Straight Through Processing (STP) and Underwriting Rule Engine that is fully configurable, explainable, and auditable. All rules, scorecards, grids, validations, and decision logic must be configurable from a frontend UI, with no hardcoded logic.

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: SQLite (temporary; user's original choice was MySQL)

## Core Features Implemented

### 1. Rule Engine Core
- [x] STP Pass/Fail decisions
- [x] Case Type classification (Normal, Direct Accept, Direct Fail, GCRP)
- [x] Scorecard-based underwriting with configurable parameters
- [x] Grid-based rules for BMI, Sum Assured vs. Income
- [x] Priority-based rule execution
- [x] Full audit trail and rule execution tracing

### 2. Rule Groups/Stages (Feb 2025)
- [x] Sequential execution stages for rule processing
- [x] Stage CRUD operations (Create, Read, Update, Delete)
- [x] Stage execution order configuration
- [x] "Stop on Fail" option per stage
- [x] Stage assignment for rules
- [x] Stage-based evaluation trace in results
- [x] Visual execution flow diagram

### 3. Dependent/Conditional Rules (Feb 2025)
- [x] Conditional form fields that appear based on parent answers
- [x] Smoker details: cigarettes_per_day, smoking_years (only if is_smoker=true)
- [x] Medical history details: ailment_type, ailment_duration_years, is_ailment_ongoing (only if has_medical_history=true)
- [x] Rules that evaluate based on conditional field values
- [x] Product-specific rule targeting

### 4. Sub-Products (Feb 2025)
- [x] Product hierarchy with parent-child relationships
- [x] Term Life category with sub-products:
  - Pure Term (death benefit only)
  - Term with Returns (maturity benefit)
- [x] Product-specific rules (different rules for Pure Term vs Term with Returns)
- [x] Product variant validation rules

### 5. Frontend UI
- [x] Dashboard with stats and recent evaluations
- [x] Rule Builder with visual condition editor
- [x] Rules List with filtering and search
- [x] Stages Management page
- [x] Scorecards configuration
- [x] Grids configuration
- [x] Evaluation Console with:
  - Dynamic conditional fields
  - Product sub-type selector
  - Stage trace visualization
- [x] Audit Logs viewer
- [x] Products management

## Sample Rules Implemented

### Validation Rules (Stage 1)
- Missing Income Validation
- Missing Premium Validation
- Age Eligibility Check
- Pure Term - High SA Age Restriction (SA >1Cr requires age <50)
- Term Returns - Minimum Premium Check (min Rs. 15,000)
- Term Returns - Max Age 55

### STP Decision Rules (Stage 2)
- High Sum Assured Check
- Smoker High Risk
- Medical History Check
- **Heavy Smoker Check** (dependent: cigarettes_per_day >20)
- **Ongoing Ailment Hard Stop** (dependent: serious ongoing ailment)
- **Past Ailment Duration Check** (dependent: recent ailment <5 years)

### Case Type Rules (Stage 3)
- Low Risk Direct Accept
- GCRP Referral
- Diabetes Management Check (dependent)
- Term Returns - Direct Accept for Young Low-Risk

### Scorecard Rules (Stage 4)
- Age Score - Young Adult Bonus
- Non-Smoker Bonus
- **Long-term Smoker Penalty** (dependent: smoking_years >10)

## Data Models

### Product (Updated)
```python
{
  id: string,
  code: string,
  name: string,
  product_type: string,
  description: string,
  parent_product_id: string,  # For sub-products
  has_maturity_benefit: bool,  # For Term with Returns
  min_age, max_age, min_sum_assured, max_sum_assured, min_premium
}
```

### ProposalData (Updated with Conditional Fields)
```python
{
  proposal_id, product_code, product_type,
  applicant_age, applicant_gender, applicant_income,
  sum_assured, premium, bmi,
  occupation_code, occupation_risk, agent_code, agent_tier, pincode,
  is_smoker, has_medical_history, existing_coverage,
  # Conditional fields (only when parent is true)
  cigarettes_per_day: int,      # if is_smoker = true
  smoking_years: int,           # if is_smoker = true
  ailment_type: string,         # if has_medical_history = true
  ailment_details: string,      # if has_medical_history = true
  ailment_duration_years: int,  # if has_medical_history = true
  is_ailment_ongoing: bool      # if has_medical_history = true
}
```

## Test Coverage
- Stage feature tests: 18 tests passing
- All backend endpoints tested via curl
- Frontend UI tested via Playwright screenshots

## Files Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI application (1700+ lines)
│   ├── insurance_stp.db   # SQLite database
│   └── tests/
│       └── test_stages.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Stages.jsx
│       │   ├── EvaluationConsole.jsx  # Updated with conditional fields
│       │   ├── RuleBuilder.jsx
│       │   └── RulesList.jsx
│       └── lib/
│           ├── api.js
│           └── constants.js  # Updated with new product types
└── memory/
    └── PRD.md
```

## Pending/Future Tasks

### P1: Database Migration to MySQL
- User's original choice was MySQL
- Current SQLite implementation is temporary

### P2: Enhancements
- Rule versioning and rollback
- Rule import/export functionality
- More ailment types and risk bands
- Policy document generation

## Session Updates
- **Feb 2025**: Added Rule Groups/Stages feature
- **Feb 2025**: Added Dependent/Conditional Rules
- **Feb 2025**: Added Sub-Products (Pure Term, Term with Returns)
