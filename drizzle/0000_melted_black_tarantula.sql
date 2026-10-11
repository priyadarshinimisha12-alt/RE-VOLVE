CREATE TABLE "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_record_id" text,
	"input_snapshot" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text,
	"row_count" integer,
	"accepted_count" integer,
	"rejected_count" integer,
	"duplicate_count" integer,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicle_records" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"registration_year" integer,
	"vehicle_category" text,
	"fuel_type" text,
	"emission_standard" text,
	"annual_distance_km" integer,
	"puc_status" text,
	"puc_expiry_date" text,
	"historical_puc_failures" integer,
	"fitness_status" text,
	"fitness_expiry_date" text,
	"state" text,
	"rto_district" text,
	"measured_co_percent" real,
	"measured_hc_ppm" real,
	"measured_smoke_opacity" real,
	"source_type" text DEFAULT 'synthetic_demo' NOT NULL,
	"source_reference" text,
	"data_quality_score" integer,
	"inspection_priority_score" integer,
	"priority_category" text,
	"contributing_factors" jsonb,
	"missing_fields" jsonb,
	"recommended_next_step" text,
	"recommendation_rationale" text,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"import_batch_id" text,
	CONSTRAINT "vehicle_records_record_id_unique" UNIQUE("record_id")
);
