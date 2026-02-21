CREATE TABLE "endpoints" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "endpoints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workspace_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"route" varchar(2048) NOT NULL,
	"http_method" varchar(10) DEFAULT 'GET' NOT NULL,
	"headers" jsonb,
	"body" jsonb,
	"expected_status_code" integer DEFAULT 200 NOT NULL,
	"expected_body" jsonb,
	"check_interval_seconds" integer DEFAULT 300 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workspace_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"base_url" varchar(2048) NOT NULL,
	"default_headers" jsonb,
	"default_timeout_seconds" integer DEFAULT 30 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workspaces_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"owner_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"max_services" integer DEFAULT 5 NOT NULL,
	"max_check_interval_seconds" integer DEFAULT 300 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "endpoints_workspace_id_idx" ON "endpoints" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "endpoints_service_id_idx" ON "endpoints" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "endpoints_deleted_at_idx" ON "endpoints" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "endpoints_active_check_idx" ON "endpoints" USING btree ("is_active","deleted_at");--> statement-breakpoint
CREATE INDEX "services_workspace_id_idx" ON "services" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "services_deleted_at_idx" ON "services" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "workspaces_deleted_at_idx" ON "workspaces" USING btree ("deleted_at");