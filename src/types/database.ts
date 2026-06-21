export interface Database {
  public: {
    Tables: {
      barbershops: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          booking_interval_minutes: number;
          max_advance_days: number;
          onboarded: boolean;
          created_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string;
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["barbershops"]["Row"],
          | "id"
          | "created_at"
          | "stripe_customer_id"
          | "stripe_subscription_id"
          | "subscription_status"
          | "trial_ends_at"
          | "current_period_ends_at"
        >;
        Update: Partial<Database["public"]["Tables"]["barbershops"]["Insert"]>;
        Relationships: [];
      };
      business_hours: {
        Row: {
          id: string;
          barbershop_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["business_hours"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["business_hours"]["Insert"]>;
        Relationships: [];
      };
      professional_business_hours: {
        Row: {
          id: string;
          barbershop_id: string;
          professional_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["professional_business_hours"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["professional_business_hours"]["Insert"]>;
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          phone: string | null;
          avatar_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["professionals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["professionals"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          duration_minutes: number;
          price: number;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      professional_services: {
        Row: { professional_id: string; service_id: string; barbershop_id: string };
        Insert: Database["public"]["Tables"]["professional_services"]["Row"];
        Update: Partial<Database["public"]["Tables"]["professional_services"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          phone: string;
          email: string | null;
          notes: string | null;
          last_visit: string | null;
          total_visits: number;
          total_spent: number;
          no_show_count: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["clients"]["Row"],
          "id" | "created_at" | "total_visits" | "total_spent" | "no_show_count"
        >;
        Update: Partial<Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at">>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          barbershop_id: string;
          professional_id: string;
          client_id: string;
          service_id: string;
          date: string;
          time: string;
          duration_minutes: number;
          status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          category: string | null;
          description: string | null;
          price: number;
          cost: number;
          stock_quantity: number;
          min_stock_alert: number;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          type: "in" | "out";
          quantity: number;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock_movements"]["Row"], "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          barbershop_id: string;
          appointment_id: string | null;
          client_id: string | null;
          professional_id: string | null;
          total_amount: number;
          payment_method: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          type: "service" | "product";
          item_id: string;
          name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: Omit<Database["public"]["Tables"]["sale_items"]["Row"], "id">;
        Update: never;
        Relationships: [];
      };
      financial_entries: {
        Row: {
          id: string;
          barbershop_id: string;
          type: "income" | "expense";
          category: string;
          description: string | null;
          amount: number;
          payment_method: string | null;
          date: string;
          recurring: boolean;
          sale_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["financial_entries"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["financial_entries"]["Insert"]>;
        Relationships: [];
      };
      fixed_costs: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          amount: number;
          due_day: number;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fixed_costs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["fixed_costs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      // View pública do link de agendamento — sem owner_id.
      public_barbershops: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          booking_interval_minutes: number;
          max_advance_days: number;
          onboarded: boolean;
        };
        Relationships: [];
      };
      // View pública do link de agendamento — sem phone.
      public_professionals: {
        Row: {
          id: string;
          barbershop_id: string;
          name: string;
          avatar_url: string | null;
          active: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      // Horários ocupados (SECURITY DEFINER) — substitui o SELECT anônimo
      // direto em appointments no link de agendamento.
      get_booked_slots: {
        Args: { p_barbershop_id: string; p_date: string };
        Returns: {
          professional_id: string;
          time: string;
          duration_minutes: number;
        }[];
      };
    };
  };
}
