export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      favorites: {
        Row: { created_at: string; outfit_id: string; user_id: string }
        Insert: { created_at?: string; outfit_id: string; user_id: string }
        Update: { created_at?: string; outfit_id?: string; user_id?: string }
        Relationships: []
      }
      item_pair_affinity: {
        Row: { affinity: number; item_a: string; item_b: string; updated_at: string; user_id: string }
        Insert: { affinity?: number; item_a: string; item_b: string; updated_at?: string; user_id: string }
        Update: { affinity?: number; item_a?: string; item_b?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
      items: {
        Row: {
          archived: boolean
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          colors: Json
          created_at: string
          formality: number
          id: string
          name: string | null
          notes: string | null
          pattern: Database["public"]["Enums"]["item_pattern"]
          photo_path: string
          seasons: Database["public"]["Enums"]["season_tag"][]
          styles: Database["public"]["Enums"]["style_tag"][]
          thumb_path: string | null
          updated_at: string
          user_id: string
          warmth: number
        }
        Insert: {
          archived?: boolean
          brand?: string | null
          category: Database["public"]["Enums"]["item_category"]
          colors?: Json
          created_at?: string
          formality?: number
          id?: string
          name?: string | null
          notes?: string | null
          pattern?: Database["public"]["Enums"]["item_pattern"]
          photo_path: string
          seasons?: Database["public"]["Enums"]["season_tag"][]
          styles?: Database["public"]["Enums"]["style_tag"][]
          thumb_path?: string | null
          updated_at?: string
          user_id: string
          warmth?: number
        }
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>
        Relationships: []
      }
      outfit_items: {
        Row: { item_id: string; outfit_id: string }
        Insert: { item_id: string; outfit_id: string }
        Update: { item_id?: string; outfit_id?: string }
        Relationships: []
      }
      outfits: {
        Row: {
          created_at: string
          id: string
          last_worn_at: string | null
          name: string | null
          rating: number | null
          user_id: string
          worn_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_worn_at?: string | null
          name?: string | null
          rating?: number | null
          user_id: string
          worn_count?: number
        }
        Update: Partial<Database["public"]["Tables"]["outfits"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_styles: Database["public"]["Enums"]["style_tag"][]
          display_name: string | null
          home_timezone: string | null
          id: string
        }
        Insert: {
          created_at?: string
          default_styles?: Database["public"]["Enums"]["style_tag"][]
          display_name?: string | null
          home_timezone?: string | null
          id: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      trip_items: {
        Row: { item_id: string; packed: boolean; trip_id: string }
        Insert: { item_id: string; packed?: boolean; trip_id: string }
        Update: { item_id?: string; packed?: boolean; trip_id?: string }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          destination: string | null
          end_date: string
          expected_temp_max: number | null
          expected_temp_min: number | null
          id: string
          name: string
          notes: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          end_date: string
          expected_temp_max?: number | null
          expected_temp_min?: number | null
          id?: string
          name: string
          notes?: string | null
          start_date: string
          user_id: string
        }
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>
        Relationships: []
      }
      wear_log: {
        Row: {
          created_at: string
          id: string
          outfit_id: string | null
          user_id: string
          weather: Json | null
          worn_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          outfit_id?: string | null
          user_id: string
          weather?: Json | null
          worn_on?: string
        }
        Update: Partial<Database["public"]["Tables"]["wear_log"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      item_category:
        | "top"
        | "bottom"
        | "dress"
        | "outerwear"
        | "shoes"
        | "bag"
        | "hat"
        | "accessory"
      item_pattern:
        | "solid"
        | "striped"
        | "plaid"
        | "floral"
        | "graphic"
        | "animal"
        | "print"
      season_tag: "spring" | "summer" | "autumn" | "winter"
      style_tag:
        | "minimal"
        | "classic"
        | "streetwear"
        | "elegant"
        | "bohemian"
        | "sporty"
        | "preppy"
        | "edgy"
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
