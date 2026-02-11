# Life Insurance STP & Underwriting Rule Engine

## Project Overview
A comprehensive rule engine for life insurance straight-through processing (STP) and underwriting decisions. Features rule groups/stages, conditional rules, risk scoring bands, and bulk evaluation capabilities.

## Technology Stack

| Technology | Current | Status |
|------------|---------|--------|
| **Node.js** | v20.20.0 | Running |
| **React** | 19.2.0 | Running |
| **Backend** | Python FastAPI | Running |
| **Database** | SQLite | Running |
| **Alternative Backend** | .NET 9 | Code ready at /app/dotnet-backend |

## Features Implemented

### Core Features
- [x] Rule Groups/Stages (4 stages with execution order)
- [x] Dependent/Conditional Rules (19 rules)
- [x] Sub-Products (Pure Term, Term with Returns)
- [x] Risk Bands & Premium Loading (17 bands)
- [x] Dynamic Evaluation Form
- [x] Risk Bands Management UI
- [x] **Bulk Evaluation** (CSV upload & batch processing) - NEWLY ADDED

### Bulk Evaluation Features
- CSV file upload for batch processing
- Template download with sample data
- Results summary (pass/fail counts, pass rate)
- Individual results table with premiums and loading
- Export results to CSV
- Maximum 1000 proposals per file

## API Endpoints

### Evaluation Endpoints
- `POST /api/underwriting/evaluate` - Single proposal evaluation
- `POST /api/underwriting/evaluate-csv` - Bulk CSV evaluation
- `POST /api/underwriting/evaluate-batch` - Batch JSON evaluation
- `GET /api/underwriting/csv-template` - Download CSV template

### CRUD Endpoints
- `/api/rules` - Rules management
- `/api/stages` - Stages management
- `/api/risk-bands` - Risk Bands management
- `/api/scorecards` - Scorecards management
- `/api/grids` - Decision grids
- `/api/products` - Products management
- `/api/evaluations` - Evaluation history
- `/api/audit-logs` - Audit trail
- `/api/dashboard/stats` - Dashboard statistics
- `/api/seed` - Seed sample data

## Frontend Routes
- `/` - Dashboard
- `/rules` - Rules list
- `/rules/new` - Rule builder
- `/stages` - Stages management
- `/risk-bands` - Risk bands management
- `/scorecards` - Scorecards
- `/grids` - Decision grids
- `/evaluate` - Single evaluation console
- `/bulk-evaluate` - Bulk evaluation (CSV upload)
- `/audit` - Audit logs
- `/products` - Products management

## Data Models

### Rule Stage
- `id`, `name`, `description`
- `execution_order` - Processing order
- `stop_on_fail` - Stop processing if stage fails
- `color` - UI display color
- `is_enabled`

### Rule
- `id`, `name`, `description`, `category`
- `stage_id` - Assigned stage
- `condition_group` - JSON conditions
- `action` - Decision/score impact
- `priority`, `is_enabled`
- `products`, `case_types` - Applicability filters

### Risk Band
- `id`, `name`, `category`
- `condition` - Field, operator, value
- `loading_percentage` - Premium increase %
- `risk_score` - Points to add
- `products`, `priority`, `is_enabled`

### Proposal Data
- Applicant info: age, gender, income, BMI
- Product info: type, sum assured, premium
- Risk factors: is_smoker, cigarettes_per_day, smoking_years
- Medical: has_medical_history, ailment_type, ailment_duration_years

## Session Updates
- Feb 2025: Rule Groups/Stages
- Feb 2025: Dependent/Conditional Rules
- Feb 2025: Sub-Products
- Feb 2025: Risk Bands & Premium Loading
- Feb 2025: React upgraded to 19.2.0
- Feb 2025: .NET 9 backend code prepared (at /app/dotnet-backend)
- Feb 2025: **Bulk Evaluation feature implemented and tested**

## .NET Backend (Alternative)
Complete .NET 9 backend code available at `/app/dotnet-backend/InsuranceSTP/`:
- `Controllers/ApiController.cs` - All API endpoints
- `Models/Models.cs` - Data models
- `Services/RuleEngine.cs` - Rule evaluation engine
- `Data/AppDbContext.cs` - Database context

To deploy .NET backend:
```bash
export PATH="/opt/dotnet:$PATH"
cd /app/dotnet-backend/InsuranceSTP
dotnet restore && dotnet publish -c Release
```

## Testing
- Backend tests: `/app/backend/tests/test_bulk_evaluation.py`
- Test reports: `/app/test_reports/iteration_3.json`
- All tests passing (100% success rate)
