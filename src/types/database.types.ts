export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: number
          is_active: boolean | null
          is_unlimited: boolean | null
          name: string
          phone: string | null
          report_limit: number | null
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["agency_status"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_unlimited?: boolean | null
          name: string
          phone?: string | null
          report_limit?: number | null
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["agency_status"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_unlimited?: boolean | null
          name?: string
          phone?: string | null
          report_limit?: number | null
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["agency_status"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_invitation_logs: {
        Row: {
          agency_id: number
          created_at: string | null
          id: number
          invited_by: string
          invited_email: string
          invited_user_id: string
          role: Database["public"]["Enums"]["agency_user_role"]
        }
        Insert: {
          agency_id: number
          created_at?: string | null
          id?: number
          invited_by: string
          invited_email: string
          invited_user_id: string
          role: Database["public"]["Enums"]["agency_user_role"]
        }
        Update: {
          agency_id?: number
          created_at?: string | null
          id?: number
          invited_by?: string
          invited_email?: string
          invited_user_id?: string
          role?: Database["public"]["Enums"]["agency_user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "agency_invitation_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_invitation_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_invitation_logs_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_users: {
        Row: {
          agency_id: number
          created_at: string | null
          id: number
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          notes: string | null
          role: Database["public"]["Enums"]["agency_user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agency_id: number
          created_at?: string | null
          id?: number
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["agency_user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: number
          created_at?: string | null
          id?: number
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["agency_user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_users_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_integrations: {
        Row: {
          access_token: string
          agency_id: number
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string | null
        }
        Insert: {
          access_token: string
          agency_id: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          agency_id?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_integrations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          onboarding_completed: boolean | null
          timezone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agency_is_active_or_onboarding: {
        Args: { p_agency_id: number }
        Returns: boolean
      }
      agency_is_active_or_onboarding_no_rls: {
        Args: { p_agency_id: number }
        Returns: boolean
      }
      create_agency_with_admin: {
        Args: {
          agency_name: string
          slug: string
          created_by: string
          admin_name: string
          admin_email: string
        }
        Returns: Json
      }
      disable_integration: {
        Args: { p_integration_id: string }
        Returns: undefined
      }
      get_active_integration: {
        Args: { p_agency_id: number }
        Returns: {
          id: string
          provider: string
          access_token: string
          refresh_token: string
          expires_at: string
          status: Database["public"]["Enums"]["integration_status"]
        }[]
      }
      get_agency_users: {
        Args: { agency_id: number }
        Returns: {
          id: string
          full_name: string
          email: string
          role: Database["public"]["Enums"]["agency_user_role"]
          is_active: boolean
        }[]
      }
      get_user_agencies: {
        Args: { user_id: string }
        Returns: {
          id: number
          name: string
          slug: string
          created_by: string
          status: Database["public"]["Enums"]["agency_status"]
          is_active: boolean
          created_at: string
          updated_at: string
          address: string
          description: string
          phone: string
          report_limit: number
          settings: Json
          website: string
          is_unlimited: boolean
          user_role: Database["public"]["Enums"]["agency_user_role"]
          has_active_integration: boolean
        }[]
      }
      is_agency_admin: {
        Args: { user_id: string; agency_id: number }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_super_admin_no_rls: {
        Args: { p_user: string }
        Returns: boolean
      }
      remove_integration: {
        Args: { p_integration_id: string }
        Returns: undefined
      }
      set_agency_status: {
        Args: {
          target_agency_id: number
          new_status: Database["public"]["Enums"]["agency_status"]
        }
        Returns: undefined
      }
      user_in_agency_active_or_onboarding: {
        Args: { p_user: string; p_agency_id: number }
        Returns: boolean
      }
      user_in_agency_active_or_onboarding_no_rls: {
        Args: { p_user: string; p_agency_id: number }
        Returns: boolean
      }
      user_is_agency_admin: {
        Args: { check_user_id: string; check_agency_id: number }
        Returns: boolean
      }
      user_is_agency_admin_no_rls: {
        Args: { p_user: string; p_agency_id: number }
        Returns: boolean
      }
    }
    Enums: {
      agency_status: "onboarding" | "active" | "suspended"
      agency_user_role: "admin" | "user"
      integration_status: "active" | "disabled" | "removed"
      user_type: "super_admin" | "agency_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agency_status: ["onboarding", "active", "suspended"],
      agency_user_role: ["admin", "user"],
      integration_status: ["active", "disabled", "removed"],
      user_type: ["super_admin", "agency_user"],
    },
  },
} as const
