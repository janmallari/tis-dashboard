-- Create clients table
CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" bigserial PRIMARY KEY,
    "name" text NOT NULL,
    "media_plan_template" text,
    "media_plan_results_template" text,
    "slides_template" text,
    "agency_id" bigint NOT NULL REFERENCES "public"."agencies"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Agency members can view their clients" ON "public"."clients"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."agency_users" au 
            WHERE au.agency_id = clients.agency_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_profiles" up
            WHERE up.id = auth.uid() 
            AND up.user_type = 'super_admin'
        )
    );

CREATE POLICY "Agency members can insert clients" ON "public"."clients"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."agency_users" au 
            WHERE au.agency_id = clients.agency_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_profiles" up
            WHERE up.id = auth.uid() 
            AND up.user_type = 'super_admin'
        )
    );

CREATE POLICY "Agency members can update their clients" ON "public"."clients"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."agency_users" au 
            WHERE au.agency_id = clients.agency_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_profiles" up
            WHERE up.id = auth.uid() 
            AND up.user_type = 'super_admin'
        )
    );

CREATE POLICY "Agency members can delete their clients" ON "public"."clients"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "public"."agency_users" au 
            WHERE au.agency_id = clients.agency_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM "public"."user_profiles" up
            WHERE up.id = auth.uid() 
            AND up.user_type = 'super_admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS "clients_agency_id_idx" ON "public"."clients"("agency_id");
CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "public"."clients"("name");

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON "public"."clients";
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON "public"."clients"
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();