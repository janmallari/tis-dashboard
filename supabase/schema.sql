

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


CREATE SCHEMA IF NOT EXISTS "api";


ALTER SCHEMA "api" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."agency_status" AS ENUM (
    'onboarding',
    'active',
    'suspended'
);


ALTER TYPE "public"."agency_status" OWNER TO "postgres";


CREATE TYPE "public"."agency_user_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."agency_user_role" OWNER TO "postgres";


CREATE TYPE "public"."integration_status" AS ENUM (
    'active',
    'disabled',
    'removed'
);


ALTER TYPE "public"."integration_status" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'super_admin',
    'agency_user'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agency_is_active_or_onboarding"("p_agency_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT a.status IN ('active','onboarding')
  FROM public.agencies a
  WHERE a.id = p_agency_id
$$;


ALTER FUNCTION "public"."agency_is_active_or_onboarding"("p_agency_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_agency_with_admin"("agency_name" "text", "slug" "text", "created_by" "uuid", "admin_name" "text", "admin_email" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_user_id uuid;
  new_user_id uuid;
  new_agency_id integer;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email;
  IF existing_user_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'User with email exists');
  END IF;

  INSERT INTO auth.users (email, full_name)
  VALUES (admin_email, admin_name)
  RETURNING id INTO new_user_id;

  INSERT INTO public.agencies (name, slug, created_by, status)
  VALUES (agency_name, slug, created_by, 'onboarding')
  RETURNING id INTO new_agency_id;

  INSERT INTO public.agency_users (user_id, agency_id, role)
  VALUES (new_user_id, new_agency_id, 'admin');

  RETURN json_build_object('success', true, 'agency_id', new_agency_id, 'user_id', new_user_id);
END;
$$;


ALTER FUNCTION "public"."create_agency_with_admin"("agency_name" "text", "slug" "text", "created_by" "uuid", "admin_name" "text", "admin_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_integration"("p_integration_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.storage_integrations
  SET status = 'disabled', updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$;


ALTER FUNCTION "public"."disable_integration"("p_integration_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_integration"("p_agency_id" bigint) RETURNS TABLE("id" "uuid", "provider" "text", "access_token" "text", "refresh_token" "text", "expires_at" timestamp with time zone, "status" "public"."integration_status")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT id, provider, access_token, refresh_token, expires_at, status
  FROM public.storage_integrations
  WHERE agency_id = p_agency_id
    AND status = 'active'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_active_integration"("p_agency_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_agency_users"("agency_id" bigint) RETURNS TABLE("id" "uuid", "full_name" "text", "email" "text", "role" "public"."agency_user_role", "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT up.id, up.full_name, auu.email::text, au.role, au.is_active
  FROM public.agency_users au
  JOIN public.user_profiles up ON up.id = au.user_id
  JOIN auth.users auu ON auu.id = up.id
  WHERE au.agency_id = get_agency_users.agency_id;
END;
$$;


ALTER FUNCTION "public"."get_agency_users"("agency_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_agencies"("user_id" "uuid") RETURNS TABLE("agency_id" bigint, "agency_name" "text", "user_role" "public"."agency_user_role")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, au.role
  FROM public.agencies a
  JOIN public.agency_users au ON a.id = au.agency_id
  WHERE au.user_id = user_id AND au.is_active = true AND a.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_user_agencies"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_agency_admin"("user_id" "uuid", "agency_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agency_users 
    WHERE user_id = user_id 
    AND agency_id = agency_id 
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_agency_admin"("user_id" "uuid", "agency_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND user_type = 'super_admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_integration"("p_integration_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.storage_integrations
  SET status = 'removed', updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$;


ALTER FUNCTION "public"."remove_integration"("p_integration_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_agency_status"("target_agency_id" bigint, "new_status" "public"."agency_status") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.agencies
  SET status = new_status
  WHERE id = target_agency_id;
END;
$$;


ALTER FUNCTION "public"."set_agency_status"("target_agency_id" bigint, "new_status" "public"."agency_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_storage_integrations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_storage_integrations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_in_agency_active_or_onboarding"("p_user" "uuid", "p_agency_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- true if user is a member of the agency (active membership)
  -- AND the agency status is active/onboarding
  RETURN EXISTS (
    SELECT 1
    FROM public.agency_users au
    JOIN public.agencies a ON a.id = au.agency_id
    WHERE au.user_id = p_user
      AND au.agency_id = p_agency_id
      AND au.is_active = true
      AND a.status IN ('active','onboarding')
  );
END;
$$;


ALTER FUNCTION "public"."user_in_agency_active_or_onboarding"("p_user" "uuid", "p_agency_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_agency_admin"("check_user_id" "uuid", "check_agency_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agency_users 
    WHERE user_id = check_user_id 
    AND agency_id = check_agency_id
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."user_is_agency_admin"("check_user_id" "uuid", "check_agency_id" bigint) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agencies" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "website" "text",
    "phone" "text",
    "address" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "report_limit" bigint,
    "is_unlimited" boolean DEFAULT true,
    "status" "public"."agency_status" DEFAULT 'onboarding'::"public"."agency_status" NOT NULL
);


ALTER TABLE "public"."agencies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."agencies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agencies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agencies_id_seq" OWNED BY "public"."agencies"."id";



CREATE TABLE IF NOT EXISTS "public"."agency_invitation_logs" (
    "id" bigint NOT NULL,
    "agency_id" bigint NOT NULL,
    "invited_user_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "invited_email" "text" NOT NULL,
    "role" "public"."agency_user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agency_invitation_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."agency_invitation_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agency_invitation_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agency_invitation_logs_id_seq" OWNED BY "public"."agency_invitation_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."agency_users" (
    "id" bigint NOT NULL,
    "agency_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."agency_user_role" DEFAULT 'user'::"public"."agency_user_role",
    "is_active" boolean DEFAULT true,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "joined_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agency_users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."agency_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agency_users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agency_users_id_seq" OWNED BY "public"."agency_users"."id";



CREATE TABLE IF NOT EXISTS "public"."storage_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agency_id" bigint NOT NULL,
    "provider" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "status" "public"."integration_status" DEFAULT 'active'::"public"."integration_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "storage_integrations_provider_check" CHECK (("provider" = ANY (ARRAY['google_drive'::"text", 'sharepoint'::"text"])))
);


ALTER TABLE "public"."storage_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "user_type" "public"."user_type" DEFAULT 'agency_user'::"public"."user_type",
    "avatar_url" "text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "onboarding_completed" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agencies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agencies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agency_invitation_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agency_invitation_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agency_users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agency_users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."agency_invitation_logs"
    ADD CONSTRAINT "agency_invitation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agency_users"
    ADD CONSTRAINT "agency_users_agency_id_user_id_key" UNIQUE ("agency_id", "user_id");



ALTER TABLE ONLY "public"."agency_users"
    ADD CONSTRAINT "agency_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."storage_integrations"
    ADD CONSTRAINT "storage_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_agencies_active" ON "public"."agencies" USING "btree" ("is_active");



CREATE INDEX "idx_agencies_created_by" ON "public"."agencies" USING "btree" ("created_by");



CREATE INDEX "idx_agencies_slug" ON "public"."agencies" USING "btree" ("slug");



CREATE INDEX "idx_agency_invitation_logs_agency" ON "public"."agency_invitation_logs" USING "btree" ("agency_id");



CREATE INDEX "idx_agency_invitation_logs_invited_by" ON "public"."agency_invitation_logs" USING "btree" ("invited_by");



CREATE INDEX "idx_agency_users_active" ON "public"."agency_users" USING "btree" ("is_active");



CREATE INDEX "idx_agency_users_agency" ON "public"."agency_users" USING "btree" ("agency_id");



CREATE INDEX "idx_agency_users_role" ON "public"."agency_users" USING "btree" ("role");



CREATE INDEX "idx_agency_users_user" ON "public"."agency_users" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_agencies_updated_at" BEFORE UPDATE ON "public"."agencies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_agency_users_updated_at" BEFORE UPDATE ON "public"."agency_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_storage_integrations_updated_at" BEFORE UPDATE ON "public"."storage_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_storage_integrations_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."agency_invitation_logs"
    ADD CONSTRAINT "agency_invitation_logs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency_invitation_logs"
    ADD CONSTRAINT "agency_invitation_logs_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."agency_invitation_logs"
    ADD CONSTRAINT "agency_invitation_logs_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency_users"
    ADD CONSTRAINT "agency_users_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agency_users"
    ADD CONSTRAINT "agency_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."agency_users"
    ADD CONSTRAINT "agency_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."storage_integrations"
    ADD CONSTRAINT "storage_integrations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Agency admins can view logs for their agencies" ON "public"."agency_invitation_logs" FOR SELECT USING (("agency_id" IN ( SELECT "agency_users"."agency_id"
   FROM "public"."agency_users"
  WHERE (("agency_users"."user_id" = "auth"."uid"()) AND ("agency_users"."role" = 'admin'::"public"."agency_user_role") AND ("agency_users"."is_active" = true)))));



CREATE POLICY "Agency admins can view users in their agencies" ON "public"."agency_users" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."user_is_agency_admin"("auth"."uid"(), "agency_id")));



CREATE POLICY "Agency admins manage storage integrations" ON "public"."storage_integrations" USING (((EXISTS ( SELECT 1
   FROM "public"."agency_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."agency_id" = "storage_integrations"."agency_id") AND ("au"."role" = 'admin'::"public"."agency_user_role") AND ("au"."is_active" = true)))) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles" "up"
  WHERE (("up"."id" = "auth"."uid"()) AND ("up"."user_type" = 'super_admin'::"public"."user_type"))))));



CREATE POLICY "Agency users insert to agency_users when active/onboarding" ON "public"."agency_users" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."agency_users" "au"
     JOIN "public"."agencies" "a" ON (("a"."id" = "au"."agency_id")))
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("agency_users"."agency_id" = "a"."id") AND ("a"."status" = ANY (ARRAY['active'::"public"."agency_status", 'onboarding'::"public"."agency_status"]))))));



CREATE POLICY "Super admin full agencies access" ON "public"."agencies" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."user_type" = 'super_admin'::"public"."user_type")))));



CREATE POLICY "Super admin full agency_users access" ON "public"."agency_users" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."user_type" = 'super_admin'::"public"."user_type")))));



CREATE POLICY "Super admins can manage all agency users" ON "public"."agency_users" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."user_type" = 'super_admin'::"public"."user_type")))));



CREATE POLICY "Super admins can view all invitation logs" ON "public"."agency_invitation_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."user_type" = 'super_admin'::"public"."user_type")))));



CREATE POLICY "Super admins can view all profiles" ON "public"."user_profiles" FOR SELECT USING ((("auth"."jwt"() ->> 'user_type'::"text") = 'super_admin'::"text"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."agencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agencies_delete_admin_only_when_open" ON "public"."agencies" FOR DELETE USING ((("public"."user_is_agency_admin"("auth"."uid"(), "id") AND ("status" = ANY (ARRAY['active'::"public"."agency_status", 'onboarding'::"public"."agency_status"]))) OR "public"."is_super_admin"("auth"."uid"())));



CREATE POLICY "agencies_insert_super_admin_only" ON "public"."agencies" FOR INSERT WITH CHECK ("public"."is_super_admin"("auth"."uid"()));



CREATE POLICY "agencies_select_own_active_or_onboarding" ON "public"."agencies" FOR SELECT USING (("public"."user_in_agency_active_or_onboarding"("auth"."uid"(), "id") OR "public"."is_super_admin"("auth"."uid"())));



CREATE POLICY "agencies_update_admin_only_when_open" ON "public"."agencies" FOR UPDATE USING ((("public"."user_is_agency_admin"("auth"."uid"(), "id") AND ("status" = ANY (ARRAY['active'::"public"."agency_status", 'onboarding'::"public"."agency_status"]))) OR "public"."is_super_admin"("auth"."uid"())));



ALTER TABLE "public"."agency_invitation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agency_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agency_users_delete_admin_only_when_open" ON "public"."agency_users" FOR DELETE USING ((("public"."user_is_agency_admin"("auth"."uid"(), "agency_id") AND "public"."agency_is_active_or_onboarding"("agency_id")) OR "public"."is_super_admin"("auth"."uid"())));



CREATE POLICY "agency_users_insert_admin_only_when_open" ON "public"."agency_users" FOR INSERT WITH CHECK ((("public"."user_is_agency_admin"("auth"."uid"(), "agency_id") AND "public"."agency_is_active_or_onboarding"("agency_id")) OR "public"."is_super_admin"("auth"."uid"())));



CREATE POLICY "agency_users_select_self_when_open" ON "public"."agency_users" FOR SELECT USING (((("user_id" = "auth"."uid"()) AND "public"."agency_is_active_or_onboarding"("agency_id")) OR "public"."user_is_agency_admin"("auth"."uid"(), "agency_id") OR "public"."is_super_admin"("auth"."uid"())));



CREATE POLICY "agency_users_update_admin_only_when_open" ON "public"."agency_users" FOR UPDATE USING ((("public"."user_is_agency_admin"("auth"."uid"(), "agency_id") AND "public"."agency_is_active_or_onboarding"("agency_id")) OR "public"."is_super_admin"("auth"."uid"())));



ALTER TABLE "public"."storage_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "api" TO "anon";
GRANT USAGE ON SCHEMA "api" TO "authenticated";
GRANT USAGE ON SCHEMA "api" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."agency_is_active_or_onboarding"("p_agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."agency_is_active_or_onboarding"("p_agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."agency_is_active_or_onboarding"("p_agency_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_agency_with_admin"("agency_name" "text", "slug" "text", "created_by" "uuid", "admin_name" "text", "admin_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_agency_with_admin"("agency_name" "text", "slug" "text", "created_by" "uuid", "admin_name" "text", "admin_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_agency_with_admin"("agency_name" "text", "slug" "text", "created_by" "uuid", "admin_name" "text", "admin_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_integration"("p_integration_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."disable_integration"("p_integration_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_integration"("p_integration_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_integration"("p_agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_integration"("p_agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_integration"("p_agency_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_agency_users"("agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_agency_users"("agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agency_users"("agency_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_agencies"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_agencies"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_agencies"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_agency_admin"("user_id" "uuid", "agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_agency_admin"("user_id" "uuid", "agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_agency_admin"("user_id" "uuid", "agency_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_integration"("p_integration_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_integration"("p_integration_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_integration"("p_integration_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_agency_status"("target_agency_id" bigint, "new_status" "public"."agency_status") TO "anon";
GRANT ALL ON FUNCTION "public"."set_agency_status"("target_agency_id" bigint, "new_status" "public"."agency_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_agency_status"("target_agency_id" bigint, "new_status" "public"."agency_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_storage_integrations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_storage_integrations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_storage_integrations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_in_agency_active_or_onboarding"("p_user" "uuid", "p_agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."user_in_agency_active_or_onboarding"("p_user" "uuid", "p_agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_in_agency_active_or_onboarding"("p_user" "uuid", "p_agency_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_agency_admin"("check_user_id" "uuid", "check_agency_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_agency_admin"("check_user_id" "uuid", "check_agency_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_agency_admin"("check_user_id" "uuid", "check_agency_id" bigint) TO "service_role";


















GRANT ALL ON TABLE "public"."agencies" TO "anon";
GRANT ALL ON TABLE "public"."agencies" TO "authenticated";
GRANT ALL ON TABLE "public"."agencies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agency_invitation_logs" TO "anon";
GRANT ALL ON TABLE "public"."agency_invitation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."agency_invitation_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agency_invitation_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agency_invitation_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agency_invitation_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agency_users" TO "anon";
GRANT ALL ON TABLE "public"."agency_users" TO "authenticated";
GRANT ALL ON TABLE "public"."agency_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agency_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agency_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agency_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."storage_integrations" TO "anon";
GRANT ALL ON TABLE "public"."storage_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
