


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."feedback_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "rating" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedback_events_rating_check" CHECK (("rating" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."feedback_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "model_family" "text" NOT NULL,
    "profile_type" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "verification_status" "text" NOT NULL,
    "confidence_level" "text" NOT NULL,
    "source_url" "text",
    "source_checked_at" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "stale_after_days" integer DEFAULT 30 NOT NULL,
    "capabilities_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "prompting_recommendations_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "known_limitations_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_notes" "text",
    "profile_version" "text" DEFAULT '1.0.0'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "model_profiles_confidence_level_check" CHECK (("confidence_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "model_profiles_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['verified'::"text", 'unverified'::"text", 'stale'::"text"])))
);


ALTER TABLE "public"."model_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_anonymous_id" "text" NOT NULL,
    "user_id" "uuid",
    "input_prompt" "text" NOT NULL,
    "working_language" "text" NOT NULL,
    "selected_profile_slug" "text" NOT NULL,
    "task_goal" "text",
    "task_type" "text",
    "expected_output_format" "text",
    "constraints" "text",
    "sensitive_data_risk_level" "text" DEFAULT 'none'::"text" NOT NULL,
    "sensitive_data_findings_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "overall_score" integer NOT NULL,
    "score_level" "text" NOT NULL,
    "analysis_json" "jsonb" NOT NULL,
    "improved_prompt" "text" NOT NULL,
    "model_id_used" "text" NOT NULL,
    "provider_used" "text" NOT NULL,
    "analysis_schema_version" "text" NOT NULL,
    "scoring_version" "text" NOT NULL,
    "model_profile_version" "text" NOT NULL,
    "prompt_template_version" "text" NOT NULL,
    "share_token" "text",
    "is_share_enabled" boolean DEFAULT false NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "is_favorite" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "audit_mode" "text",
    CONSTRAINT "prompt_analyses_overall_score_check" CHECK ((("overall_score" >= 0) AND ("overall_score" <= 100))),
    CONSTRAINT "prompt_analyses_score_level_check" CHECK (("score_level" = ANY (ARRAY['weak'::"text", 'needs_work'::"text", 'decent'::"text", 'strong'::"text", 'excellent'::"text"]))),
    CONSTRAINT "prompt_analyses_sensitive_data_risk_level_check" CHECK (("sensitive_data_risk_level" = ANY (ARRAY['none'::"text", 'low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "prompt_analyses_working_language_check" CHECK (("working_language" = ANY (ARRAY['pl'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."prompt_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "plan_slug" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_anonymous_id" "text" NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "metadata_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_hash" "text",
    "user_agent_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "plan_slug" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."feedback_events"
    ADD CONSTRAINT "feedback_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_profiles"
    ADD CONSTRAINT "model_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_profiles"
    ADD CONSTRAINT "model_profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."prompt_analyses"
    ADD CONSTRAINT "prompt_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_analyses"
    ADD CONSTRAINT "prompt_analyses_share_token_key" UNIQUE ("share_token");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_feedback_events_analysis" ON "public"."feedback_events" USING "btree" ("analysis_id");



CREATE INDEX "idx_model_profiles_slug" ON "public"."model_profiles" USING "btree" ("slug");



CREATE INDEX "idx_prompt_analyses_created_at" ON "public"."prompt_analyses" USING "btree" ("created_at");



CREATE INDEX "idx_prompt_analyses_deleted_at" ON "public"."prompt_analyses" USING "btree" ("deleted_at");



CREATE INDEX "idx_prompt_analyses_is_favorite" ON "public"."prompt_analyses" USING "btree" ("is_favorite");



CREATE INDEX "idx_prompt_analyses_owner" ON "public"."prompt_analyses" USING "btree" ("owner_anonymous_id");



CREATE INDEX "idx_prompt_analyses_profile" ON "public"."prompt_analyses" USING "btree" ("selected_profile_slug");



CREATE INDEX "idx_prompt_analyses_sensitive_risk" ON "public"."prompt_analyses" USING "btree" ("sensitive_data_risk_level");



CREATE INDEX "idx_prompt_analyses_share_token" ON "public"."prompt_analyses" USING "btree" ("share_token");



CREATE INDEX "idx_prompt_analyses_user_id" ON "public"."prompt_analyses" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_customers_customer_id" ON "public"."stripe_customers" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_usage_events_created_at" ON "public"."usage_events" USING "btree" ("created_at");



CREATE INDEX "idx_usage_events_owner" ON "public"."usage_events" USING "btree" ("owner_anonymous_id");



CREATE INDEX "idx_usage_events_type" ON "public"."usage_events" USING "btree" ("event_type");



CREATE INDEX "idx_usage_events_user_id" ON "public"."usage_events" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_plan_slug" ON "public"."user_profiles" USING "btree" ("plan_slug");



ALTER TABLE ONLY "public"."feedback_events"
    ADD CONSTRAINT "feedback_events_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."prompt_analyses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_analyses"
    ADD CONSTRAINT "prompt_analyses_selected_profile_slug_fkey" FOREIGN KEY ("selected_profile_slug") REFERENCES "public"."model_profiles"("slug");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "allow_public_read_model_profiles" ON "public"."model_profiles" FOR SELECT USING (true);



CREATE POLICY "block_client_write_stripe_customer" ON "public"."stripe_customers" USING (false) WITH CHECK (false);



CREATE POLICY "block_client_write_subscription" ON "public"."subscriptions" USING (false) WITH CHECK (false);



ALTER TABLE "public"."feedback_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_read_own_stripe_customer" ON "public"."stripe_customers" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_read_own_subscription" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_events" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."model_profiles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."model_profiles" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."model_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







