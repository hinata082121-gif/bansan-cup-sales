/**
 * supabase/migrations のスキーマに対応する型。
 * `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts` で再生成できる形式に合わせている。
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      allowed_emails: {
        Row: { email: string; note: string | null; created_at: string };
        Insert: { email: string; note?: string | null; created_at?: string };
        Update: { email?: string; note?: string | null; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          name_kana: string;
          prefecture: string;
          city: string;
          address: string;
          zip_code: string | null;
          tel: string | null;
          lat: number | null;
          lng: number | null;
          official_url: string;
          opening_note: string | null;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          name_kana: string;
          prefecture: string;
          city: string;
          address: string;
          zip_code?: string | null;
          tel?: string | null;
          lat?: number | null;
          lng?: number | null;
          official_url: string;
          opening_note?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_kana?: string;
          prefecture?: string;
          city?: string;
          address?: string;
          zip_code?: string | null;
          tel?: string | null;
          lat?: number | null;
          lng?: number | null;
          official_url?: string;
          opening_note?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          store_id: string;
          visit_date: string;
          flyer_status: Database["public"]["Enums"]["flyer_status"] | null;
          note: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          visit_date: string;
          flyer_status?: Database["public"]["Enums"]["flyer_status"] | null;
          note?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          visit_date?: string;
          flyer_status?: Database["public"]["Enums"]["flyer_status"] | null;
          note?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visits_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      visit_staff: {
        Row: {
          id: string;
          visit_id: string;
          sort_order: number;
          staff_name: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          employment_type: Database["public"]["Enums"]["employment_type"] | null;
          conversation: string | null;
          soccer_interest: Database["public"]["Enums"]["soccer_interest"] | null;
        };
        Insert: {
          id?: string;
          visit_id: string;
          sort_order?: number;
          staff_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          employment_type?: Database["public"]["Enums"]["employment_type"] | null;
          conversation?: string | null;
          soccer_interest?: Database["public"]["Enums"]["soccer_interest"] | null;
        };
        Update: {
          id?: string;
          visit_id?: string;
          sort_order?: number;
          staff_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          employment_type?: Database["public"]["Enums"]["employment_type"] | null;
          conversation?: string | null;
          soccer_interest?: Database["public"]["Enums"]["soccer_interest"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "visit_staff_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          time_slot: Database["public"]["Enums"]["time_slot"] | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          time_slot?: Database["public"]["Enums"]["time_slot"] | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          time_slot?: Database["public"]["Enums"]["time_slot"] | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_stores: {
        Row: { schedule_id: string; store_id: string; sort_order: number };
        Insert: { schedule_id: string; store_id: string; sort_order?: number };
        Update: { schedule_id?: string; store_id?: string; sort_order?: number };
        Relationships: [
          {
            foreignKeyName: "schedule_stores_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_stores_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      store_progress: {
        Row: {
          store_id: string | null;
          last_visit_date: string | null;
          visit_count: number | null;
          next_schedule_date: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_my_access: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_allowed: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      today_jst: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      save_visit: {
        Args: {
          p_visit_id: string | null;
          p_store_id: string;
          p_visit_date: string;
          p_flyer_status: Database["public"]["Enums"]["flyer_status"] | null;
          p_note: string | null;
          p_staff?: Json;
        };
        Returns: string;
      };
      save_schedule: {
        Args: {
          p_schedule_id: string | null;
          p_date: string;
          p_time_slot: Database["public"]["Enums"]["time_slot"] | null;
          p_memo: string | null;
          p_store_ids?: string[];
        };
        Returns: string;
      };
    };
    Enums: {
      flyer_status: "distributed" | "not_distributed" | "previously_distributed";
      gender: "male" | "female" | "other";
      employment_type: "manager" | "employee" | "part_time" | "unknown";
      soccer_interest: "yes" | "no" | "unknown";
      time_slot: "noon" | "evening" | "night" | "undecided";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
