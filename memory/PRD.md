# Life Insurance STP & Underwriting Rule Engine

## Technology Stack - CURRENT STATUS

| Technology | Current | Target | Status |
|------------|---------|--------|--------|
| **Node.js** | v20.20.0 | v24 | Container limitation |
| **React** | 19.2.0 | 19.2 | ✅ Updated |
| **.NET Core** | Requires reinstall | 9.0 | Code ready, SDK needed |
| **Backend** | Python FastAPI | .NET 9 | .NET code prepared |

## Important Notes
- **React upgraded to 19.2.0** ✅
- **.NET 9 backend code is ready** at `/app/dotnet-backend/InsuranceSTP/`
- The .NET SDK needs to be installed on deployment server
- Currently running Python/FastAPI backend for testing

## .NET 9 Backend Location
```
/app/dotnet-backend/InsuranceSTP/
├── InsuranceSTP.csproj (net9.0)
├── Controllers/ApiController.cs
├── Models/Models.cs (includes RiskBands, Stages, Dependent fields)
├── Data/AppDbContext.cs
├── Services/RuleEngine.cs
└── Program.cs
```

## To Deploy .NET 9 Backend
```bash
# Install .NET 9 SDK
curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 9.0

# Build and run
cd /app/dotnet-backend/InsuranceSTP
dotnet restore
dotnet publish -c Release -o ../publish
cd ../publish
dotnet InsuranceSTP.dll --urls "http://0.0.0.0:8001"
```

## Features Implemented
- [x] Rule Groups/Stages (4 stages)
- [x] Dependent/Conditional Rules (19 rules)
- [x] Sub-Products (Pure Term, Term with Returns)
- [x] Risk Bands & Premium Loading (17 bands)
- [x] Dynamic Evaluation Form
- [x] Risk Bands Management UI

## API Endpoints (Both Python & .NET)
- `/api/rules` - Rules CRUD
- `/api/stages` - Stages CRUD  
- `/api/risk-bands` - Risk Bands CRUD
- `/api/underwriting/evaluate` - Evaluation with risk loading
- `/api/seed` - Sample data

## Session Updates
- Feb 2025: Rule Groups/Stages
- Feb 2025: Dependent/Conditional Rules
- Feb 2025: Sub-Products
- Feb 2025: Risk Bands & Premium Loading
- Feb 2025: React upgraded to 19.2.0
- Feb 2025: .NET 9 backend code prepared
