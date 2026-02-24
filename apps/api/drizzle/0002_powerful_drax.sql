ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_slug_unique";--> statement-breakpoint
DROP INDEX "endpoints_workspace_id_idx";--> statement-breakpoint
DROP INDEX "endpoints_service_id_idx";--> statement-breakpoint
DROP INDEX "endpoints_deleted_at_idx";--> statement-breakpoint
DROP INDEX "services_workspace_id_idx";--> statement-breakpoint
DROP INDEX "services_deleted_at_idx";--> statement-breakpoint
DROP INDEX "users_deleted_at_idx";--> statement-breakpoint
DROP INDEX "workspaces_owner_id_idx";--> statement-breakpoint
DROP INDEX "workspaces_deleted_at_idx";--> statement-breakpoint
DROP INDEX "endpoints_active_check_idx";--> statement-breakpoint
CREATE INDEX "endpoints_workspace_id_active_idx" ON "endpoints" USING btree ("workspace_id") WHERE "endpoints"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "endpoints_service_id_active_idx" ON "endpoints" USING btree ("service_id") WHERE "endpoints"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "services_workspace_id_active_idx" ON "services" USING btree ("workspace_id") WHERE "services"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_active_idx" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "workspaces_owner_id_active_idx" ON "workspaces" USING btree ("owner_id") WHERE "workspaces"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_active_idx" ON "workspaces" USING btree ("slug") WHERE "workspaces"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "endpoints_active_check_idx" ON "endpoints" USING btree ("is_active","check_interval_seconds") WHERE "endpoints"."deleted_at" IS NULL;