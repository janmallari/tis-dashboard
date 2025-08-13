// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Export types for convenience
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Export specific table types based on your schema
export type Agency = Tables<'agencies'>;
export type UserProfile = Tables<'user_profiles'>;
export type AgencyUser = Tables<'agency_users'>;
export type StorageIntegration = Tables<'storage_integrations'>;
export type AgencyInvitationLog = Tables<'agency_invitation_logs'>;

// Export enum types
export type UserType = Enums<'user_type'>;
export type AgencyStatus = Enums<'agency_status'>;
export type AgencyUserRole = Enums<'agency_user_role'>;
export type IntegrationStatus = Enums<'integration_status'>;

// Useful composite types
export type AgencyWithCreator = Agency & {
  creator: UserProfile;
};

export type AgencyUserWithProfile = AgencyUser & {
  user_profile: UserProfile;
  agency: Agency;
};

export type AgencyWithUsers = Agency & {
  agency_users: AgencyUserWithProfile[];
};

// Function return types (for your custom functions)
export type GetUserAgenciesResult = {
  id: number;
  name: string;
  slug: string;
  created_by: string;
  status: Database['public']['Enums']['agency_status'];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  address: string;
  description: string;
  phone: string;
  report_limit: number;
  settings: Json;
  website: string;
  is_unlimited: boolean;
  user_role: Database['public']['Enums']['agency_user_role'];
  has_active_integration: boolean;
};

export type GetAgencyUsersResult = {
  id: string;
  full_name: string | null;
  email: string;
  role: AgencyUserRole;
  is_active: boolean;
};

export type StorageIntegrationInsert = TablesInsert<'storage_integrations'>;
