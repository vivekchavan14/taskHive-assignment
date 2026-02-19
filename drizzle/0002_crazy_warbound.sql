ALTER TABLE "gigs" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "deliverables" text;--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "execution_logs" text;