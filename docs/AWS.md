# AWS architecture (modular)

RE-VOLVE is shaped so a later AWS deploy is a packaging step, not a rewrite. The local demo does **not** require AWS credentials.

```
Browser
  → Next.js App Router (API Gateway analogue)
      → Route handlers (Lambda analogue)
          → PostgreSQL / Drizzle (DynamoDB analogue)
          → data/uploads (S3 analogue)
          → console JSON logs (CloudWatch analogue)
```

| Service | Implemented now | Later AWS mapping |
| --- | --- | --- |
| Amazon S3 | `storeObject()` writes `data/uploads` | Bucket for CSV and document objects |
| AWS Lambda | Next.js route handlers | Same TypeScript modules as Lambdas |
| Amazon API Gateway | Next routes under `/api/*` | HTTP API in front of Lambda |
| Amazon DynamoDB | PostgreSQL tables `vehicle_records`, `import_batches`, `assessments` | Same items on Dynamo / Aurora |
| Amazon CloudWatch | `logEvent()` JSON to stdout | Log group / metrics filters |
| Amazon Bedrock | Not connected | Optional explanation layer; current assistant is rules + SQL |
| Amazon SageMaker | Not used | Not justified without a labelled in-use emissions dataset |

Set `AWS_S3_BUCKET` and `AWS_ACCESS_KEY_ID` to flip `awsMode()` to `"aws"`. The S3 put-object client is intentionally not bundled until credentials exist, so the prototype cannot accidentally leak keys.

**Never** expose AWS keys in frontend code or `NEXT_PUBLIC_*` variables.
