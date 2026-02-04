# Life Insurance STP & Underwriting Rule Engine

## Original Problem Statement
Build a fully configurable, explainable, and auditable underwriting rule engine for life insurance new business systems with STP Pass/Fail, Case Type classification, Scorecard-based underwriting, and reason generation.

## Technology Stack
- **Backend**: .NET 8.0 Core Web API (C#)
- **Frontend**: React 19 with Shadcn UI + Tailwind CSS
- **Database**: SQLite (via Entity Framework Core)
- **Charts**: Recharts

## What's Been Implemented (Feb 2026)

### Backend (.NET Core)
- RESTful API with all CRUD operations
- Rule Engine with AND/OR/NOT logic evaluation
- 13+ operators (equals, between, in, contains, etc.)
- SQLite database with Entity Framework Core
- Audit logging for all changes
- Evaluation history storage

### Frontend (React)
- Dashboard with real-time metrics and charts
- Visual Rule Builder with condition/action builders
- Rules List with filtering, search, toggle
- Scorecards configuration page
- Decision Grids configuration (BMI, Income×SA)
- Evaluation Console with rule trace
- Products management
- Audit Logs viewer

### Pre-configured Data
- 10 sample rules (validation, STP, case type, scorecard)
- 3 products (Term Life, Endowment, ULIP)

## API Endpoints
- GET/POST /api/rules - Rule management
- GET/POST /api/scorecards - Scorecard configuration
- GET/POST /api/grids - Grid configuration
- GET/POST /api/products - Product management
- POST /api/underwriting/evaluate - STP evaluation
- GET /api/dashboard/stats - Dashboard statistics
- GET /api/audit-logs - Audit trail
- POST /api/seed - Seed sample data

## Backlog (P0/P1/P2)

### P0 - Critical
- [x] Core rule engine with evaluation
- [x] STP Pass/Fail decisions
- [x] Case Type classification

### P1 - High Priority
- [ ] User authentication with role-based access
- [ ] Rule versioning and rollback
- [ ] Bulk import/export (JSON/Excel)

### P2 - Medium Priority
- [ ] Advanced scorecard bands UI
- [ ] Grid matrix visual editor
- [ ] Rule simulation/testing mode
- [ ] API rate limiting
- [ ] Webhook notifications
