# Environment files explanation for Git
# =====================================

## Frontend Environment Files (/frontend/)

| File | Purpose | Git |
|------|---------|-----|
| `.env` | Default/base config | ✅ Commit (no secrets) |
| `.env.local` | Local overrides | ❌ .gitignore |
| `.env.development.local` | Dev environment | ❌ .gitignore |
| `.env.test.local` | Test environment | ❌ .gitignore |
| `.env.production.local` | Prod environment | ❌ .gitignore |

## Backend Environment Files (/dotnet-backend/InsuranceSTP/)

| File | Purpose | Git |
|------|---------|-----|
| `appsettings.json` | Base config | ✅ Commit |
| `appsettings.Development.json` | Dev config | ✅ Commit |
| `appsettings.Production.json` | Prod template | ✅ Commit (no secrets) |
| `appsettings.Test.json` | Test config | ✅ Commit |
| `.env.sample` | Sample env vars | ✅ Commit |

## How to Use

### Frontend:
1. Copy `.env.development.local` to `.env.local`
2. Update `REACT_APP_BACKEND_URL` to your API URL
3. Run `yarn start`

### Backend (.NET):
1. Copy `.env.sample` to `.env`
2. Update `DATABASE_URL` for your database
3. Run `dotnet run`

## Database Connection Strings

### SQLite (Default):
```
Data Source=insurance_stp.db
```

### SQL Server:
```
Server=localhost;Database=InsuranceSTP;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
```

### MySQL:
```
Server=localhost;Port=3306;Database=insurance_stp;User=root;Password=YourPassword;
```

### PostgreSQL:
```
Host=localhost;Port=5432;Database=insurance_stp;Username=postgres;Password=YourPassword;
```
