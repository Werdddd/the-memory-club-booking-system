export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_items: {
        Row: {
          booking_id: string
          created_at: string
          equipment_id: string
          id: string
          quantity: number
          rate_at_booking: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          equipment_id: string
          id?: string
          quantity?: number
          rate_at_booking: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          equipment_id?: string
          id?: string
          quantity?: number
          rate_at_booking?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          contact_number_1: string | null
          contact_number_2: string | null
          created_at: string
          customer_id: string | null
          deposit_paid: boolean
          email: string | null
          end_date: string
          full_name: string | null
          id: string
          id_document_1_path: string | null
          id_document_2_path: string | null
          notes: string | null
          pickup_time: string | null
          proof_of_billing_path: string | null
          proof_of_payment_path: string | null
          return_time: string | null
          selfie_with_id_path: string | null
          signature_method:
            | Database["public"]["Enums"]["signature_method"]
            | null
          signature_path: string | null
          signature_text: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          terms_accepted: boolean
          total_amount: number
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_number_1?: string | null
          contact_number_2?: string | null
          created_at?: string
          customer_id?: string | null
          deposit_paid?: boolean
          email?: string | null
          end_date: string
          full_name?: string | null
          id?: string
          id_document_1_path?: string | null
          id_document_2_path?: string | null
          notes?: string | null
          pickup_time?: string | null
          proof_of_billing_path?: string | null
          proof_of_payment_path?: string | null
          return_time?: string | null
          selfie_with_id_path?: string | null
          signature_method?:
            | Database["public"]["Enums"]["signature_method"]
            | null
          signature_path?: string | null
          signature_text?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          terms_accepted?: boolean
          total_amount?: number
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_number_1?: string | null
          contact_number_2?: string | null
          created_at?: string
          customer_id?: string | null
          deposit_paid?: boolean
          email?: string | null
          end_date?: string
          full_name?: string | null
          id?: string
          id_document_1_path?: string | null
          id_document_2_path?: string | null
          notes?: string | null
          pickup_time?: string | null
          proof_of_billing_path?: string | null
          proof_of_payment_path?: string | null
          return_time?: string | null
          selfie_with_id_path?: string | null
          signature_method?:
            | Database["public"]["Enums"]["signature_method"]
            | null
          signature_path?: string | null
          signature_text?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          terms_accepted?: boolean
          total_amount?: number
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          daily_rate: number
          deposit_amount: number
          description: string | null
          extended_daily_rate: number
          id: string
          image_url: string | null
          is_available: boolean
          model: string | null
          name: string
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: Database["public"]["Enums"]["equipment_category"]
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          daily_rate: number
          deposit_amount?: number
          description?: string | null
          extended_daily_rate: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          model?: string | null
          name: string
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["equipment_category"]
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          daily_rate?: number
          deposit_amount?: number
          description?: string | null
          extended_daily_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          model?: string | null
          name?: string
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment_addons: {
        Row: {
          addon_id: string
          created_at: string
          equipment_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          equipment_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          equipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_addons_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          id: number
          qr_code_url: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          qr_code_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          qr_code_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      booking_is_guest: {
        Args: { target_booking_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "ongoing"
        | "completed"
        | "cancelled"
      equipment_category:
        | "camera"
        | "lens"
        | "lighting"
        | "audio"
        | "accessory"
        | "other"
      equipment_condition:
        | "new"
        | "excellent"
        | "good"
        | "fair"
        | "needs_repair"
      signature_method: "typed" | "drawn"
      trip_type: "local" | "international"
      user_role: "admin" | "customer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "ongoing",
        "completed",
        "cancelled",
      ],
      equipment_category: [
        "camera",
        "lens",
        "lighting",
        "audio",
        "accessory",
        "other",
      ],
      equipment_condition: ["new", "excellent", "good", "fair", "needs_repair"],
      signature_method: ["typed", "drawn"],
      trip_type: ["local", "international"],
      user_role: ["admin", "customer"],
    },
  },
} as const
