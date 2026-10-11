# RE-VOLVE

**Vehicle Retirement & Environmental Intelligence System**  
*Smarter vehicle decisions. Cleaner cities.*

RE-VOLVE is a software-only decision-support platform for India’s vehicle ecosystem. It turns available registration characteristics, fuel type, Bharat Stage, PUC status, and fitness information into an **explainable inspection-priority score** — without treating vehicle age as a pollution measurement, and without claiming live access to restricted government databases.

## What it does

- Dashboard over a labelled synthetic fleet (and optional user CSV)
- Filters that recompute every KPI and chart
- Explainable 0–100 inspection priority with evidence, gaps, and next steps
- Regional schematic (not an air-quality map)
- Population findings with confidence and claim guards
- Intervention simulator (inspection-first vs replacement-first) using a priority-point coverage proxy
- CSV import, validation, cleaning export
- Local RC/PUC text extraction (no external OCR)
- Dataset assistant that only answers from loaded records

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Drizzle ORM
- Recharts

This repository follows the project’s established Next.js + Postgres template rather than a separate FastAPI service. Scoring, import, and simulation run as route handlers so the same modules can later be wrapped as AWS Lambda functions.

## Setup

```bash
cp .env.example .env
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npm install
npx drizzle-kit push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first dashboard load seeds **1,100 synthetic records** (deterministic seed 42).

## Scripts

```bash
npm run dev
npm run build
npm run start
npx tsx src/lib/scoring.test.ts
```

## Documentation

- [API](docs/API.md)
- [AWS architecture](docs/AWS.md)
- [Demo script](docs/DEMO.md)
- [Limitations](docs/LIMITATIONS.md)
- In-app: `/methodology`

## Privacy

Do not upload owner names, addresses, phone numbers, or identity documents. Use anonymised record IDs. Document extraction masks registration marks.

## Licence

Prototype for Amazon Environmental Hacks. Not an official MoRTH / CPCB / state transport product.
