ALTER TABLE "owners" ALTER COLUMN "twitter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ALTER COLUMN "twitter_handle" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "clerk_user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_clerk_user_id_unique" UNIQUE("clerk_user_id");