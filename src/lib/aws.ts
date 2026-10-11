/**
 * Local adapters for the AWS-shaped architecture.
 *
 * The Next.js process is the runtime. When AWS credentials are absent the
 * adapters stay in-process: PostgreSQL stands in for DynamoDB, the local
 * filesystem stands in for S3, and structured console logs stand in for
 * CloudWatch. Route handlers stand in for Lambda + API Gateway.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type AwsMode = "local" | "aws";

export function awsMode(): AwsMode {
  const bucket = process.env.AWS_S3_BUCKET;
  const key = process.env.AWS_ACCESS_KEY_ID;
  if (bucket && key) return "aws";
  return "local";
}

export function architectureStatus() {
  const mode = awsMode();
  return {
    mode,
    components: [
      {
        service: "Amazon S3",
        role: "Dataset and document object storage",
        status: mode === "aws" ? "configured" : "local filesystem adapter",
        notes: "Uploads land in data/uploads when credentials are absent.",
      },
      {
        service: "AWS Lambda + API Gateway",
        role: "Assessment, import, and simulation functions",
        status: "implemented as Next.js route handlers",
        notes: "Same TypeScript modules can be wrapped as Lambdas later.",
      },
      {
        service: "Amazon DynamoDB",
        role: "Vehicle records, assessments, import batches",
        status: "PostgreSQL via Drizzle (local / RDS-shaped)",
        notes: "Table design maps 1:1 to the documented Dynamo items.",
      },
      {
        service: "Amazon CloudWatch",
        role: "Structured application logs",
        status: "console JSON in local demo mode",
        notes: "logEvent() is the single logging seam.",
      },
      {
        service: "Amazon Bedrock",
        role: "Optional explanatory assistant",
        status: "not connected",
        notes: "The in-app assistant answers only from loaded records and methodology.",
      },
    ],
  };
}

export function logEvent(level: "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    service: "revolve",
    ...extra,
  };
  if (level === "error") console.error(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}

export async function storeObject(filename: string, bytes: Buffer | Uint8Array | string) {
  const dir = path.join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const key = `${Date.now()}-${safe}`;
  const full = path.join(dir, key);
  await writeFile(full, bytes);
  logEvent("info", "object.stored", { key, mode: awsMode() });
  return { key, adapter: awsMode() };
}
