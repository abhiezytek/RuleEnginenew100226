# Life Insurance STP & Underwriting Rule Engine

A fully configurable, enterprise-ready underwriting rule engine built with **.NET 8.0 Core Web API** and **React 19**.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | .NET 8.0 Core Web API (C#) |
| Frontend | React 19 + Shadcn UI + Tailwind CSS |
| Database | SQLite (switchable to SQL Server/MySQL/PostgreSQL) |
| ORM | Entity Framework Core |

## Project Structure

```
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # UI Components
│   │   ├── pages/              # Page Components
│   │   └── lib/                # Utilities & API
│   ├── .env.example            # Environment template
│   └── package.json
│
├── dotnet-backend/             # .NET Backend
│   └── InsuranceSTP/
│       ├── Controllers/        # API Controllers
│       ├── Models/             # Entity & DTO Models
│       ├── Services/           # Rule Engine
│       ├── Data/               # EF Core DbContext
│       ├── appsettings.json    # Configuration
│       └── .env.sample         # Environment template
│
└── ENV_FILES_README.md         # Environment setup guide
```

## Quick Start

### Backend (.NET)

```bash
cd dotnet-backend/InsuranceSTP

# Copy environment config
cp .env.sample .env

# Restore packages
dotnet restore

# Run the API (starts on port 8001)
dotnet run
```

### Frontend (React)

```bash
cd frontend

# Copy environment config
cp .env.example .env.local

# Install dependencies
yarn install

# Start development server
yarn start
```

## Environment Configuration

### Frontend Environment Files

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env.example` | Template | ✅ Yes |
| `.env.development.example` | Dev template | ✅ Yes |
| `.env.production.example` | Prod template | ✅ Yes |
| `.env.test.example` | Test template | ✅ Yes |
| `.env.local` | Local secrets | ❌ No |
| `.env.*.local` | Environment secrets | ❌ No |

### Backend Environment Files

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `appsettings.json` | Base config | ✅ Yes |
| `appsettings.Development.json` | Dev config | ✅ Yes |
| `appsettings.Production.json` | Prod config | ✅ Yes |
| `appsettings.Test.json` | Test config | ✅ Yes |
| `.env.sample` | Template | ✅ Yes |

## Database Configuration

The backend supports multiple databases. Update connection string in `appsettings.json` or environment:

**SQLite (Default):**
```json
"ConnectionStrings": {
  "DefaultConnection": "Data Source=insurance_stp.db"
}
```

**SQL Server:**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=InsuranceSTP;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
}
```

**MySQL:**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=insurance_stp;User=root;Password=YourPassword;"
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/rules` | Rule management |
| GET/POST | `/api/scorecards` | Scorecard config |
| GET/POST | `/api/grids` | Grid config |
| GET/POST | `/api/products` | Product management |
| POST | `/api/underwriting/evaluate` | STP evaluation |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/audit-logs` | Audit trail |
| POST | `/api/seed` | Seed sample data |

## Features

- ✅ Visual Rule Builder with AND/OR/NOT logic
- ✅ 13+ condition operators
- ✅ STP Pass/Fail decisions
- ✅ Case Type classification
- ✅ Scorecard-based scoring
- ✅ Decision grids (BMI, Income×SA)
- ✅ Rule execution trace
- ✅ Audit logging
- ✅ Product configuration

## License

MIT
