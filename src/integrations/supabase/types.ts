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
  public: {
    Tables: {
      appointments: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string
          date: string
          duration_minutes: number
          id: string
          notes: string | null
          professional_id: string
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          time: string
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string
          date: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          professional_id: string
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          professional_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          booking_interval_minutes: number
          cover_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          max_advance_days: number
          name: string
          onboarded: boolean
          owner_id: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_interval_minutes?: number
          cover_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_advance_days?: number
          name: string
          onboarded?: boolean
          owner_id: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_interval_minutes?: number
          cover_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_advance_days?: number
          name?: string
          onboarded?: boolean
          owner_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          barbershop_id: string
          close_time: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string
        }
        Insert: {
          barbershop_id: string
          close_time?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string
        }
        Update: {
          barbershop_id?: string
          close_time?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          barbershop_id: string
          created_at: string
          email: string | null
          id: string
          last_visit: string | null
          name: string
          notes: string | null
          phone: string
          total_spent: number
          total_visits: number
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          name: string
          notes?: string | null
          phone: string
          total_spent?: number
          total_visits?: number
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          notes?: string | null
          phone?: string
          total_spent?: number
          total_visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          barbershop_id: string
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          sale_id: string | null
          type: Database["public"]["Enums"]["entry_type"]
        }
        Insert: {
          amount: number
          barbershop_id: string
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sale_id?: string | null
          type: Database["public"]["Enums"]["entry_type"]
        }
        Update: {
          amount?: number
          barbershop_id?: string
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sale_id?: string | null
          type?: Database["public"]["Enums"]["entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barbershop_id: string
          category: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_stock_alert: number
          name: string
          price: number
          stock_quantity: number
        }
        Insert: {
          active?: boolean
          barbershop_id: string
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_alert?: number
          name: string
          price?: number
          stock_quantity?: number
        }
        Update: {
          active?: boolean
          barbershop_id?: string
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_alert?: number
          name?: string
          price?: number
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          avatar_url: string | null
          barbershop_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          specialties: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          barbershop_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          specialties?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          barbershop_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          specialties?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          item_id: string
          name: string
          quantity: number
          sale_id: string
          type: Database["public"]["Enums"]["sale_item_type"]
          unit_price: number
        }
        Insert: {
          id?: string
          item_id: string
          name: string
          quantity?: number
          sale_id: string
          type: Database["public"]["Enums"]["sale_item_type"]
          unit_price?: number
        }
        Update: {
          id?: string
          item_id?: string
          name?: string
          quantity?: number
          sale_id?: string
          type?: Database["public"]["Enums"]["sale_item_type"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          appointment_id: string | null
          barbershop_id: string
          client_id: string | null
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          professional_id: string | null
          total_amount: number
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          professional_id?: string | null
          total_amount?: number
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          professional_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          barbershop_id: string
          category: string | null
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          barbershop_id: string
          category?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price?: number
        }
        Update: {
          active?: boolean
          barbershop_id?: string
          category?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      unaccent_lite: { Args: { t: string }; Returns: string }
      user_owns_barbershop: {
        Args: { _barbershop_id: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      entry_type: "income" | "expense"
      movement_type: "in" | "out"
      payment_method: "cash" | "pix" | "debit" | "credit"
      sale_item_type: "service" | "product"
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
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      entry_type: ["income", "expense"],
      movement_type: ["in", "out"],
      payment_method: ["cash", "pix", "debit", "credit"],
      sale_item_type: ["service", "product"],
    },
  },
} as const
