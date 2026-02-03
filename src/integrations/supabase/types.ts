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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          wedding_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          wedding_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          category: string
          created_at: string
          external_link: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          wedding_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          external_link?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          wedding_id: string
        }
        Update: {
          category?: string
          created_at?: string
          external_link?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          guest_name: string
          id: string
          message: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          guest_name: string
          id?: string
          message: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          guest_name?: string
          id?: string
          message?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          gift_id: string | null
          gift_name: string
          id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          gift_id?: string | null
          gift_name: string
          id?: string
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          gift_id?: string | null
          gift_name?: string
          id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string
          id: string
          mercado_pago_payment_id: string | null
          mercado_pago_preference_id: string | null
          status: string
          total_amount: number
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name: string
          id?: string
          mercado_pago_payment_id?: string | null
          mercado_pago_preference_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          id?: string
          mercado_pago_payment_id?: string | null
          mercado_pago_preference_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rsvp_responses: {
        Row: {
          attendance: string
          created_at: string
          dietary_restrictions: string | null
          guest_email: string | null
          guest_name: string
          guests_count: number
          id: string
          message: string | null
          wedding_id: string
        }
        Insert: {
          attendance: string
          created_at?: string
          dietary_restrictions?: string | null
          guest_email?: string | null
          guest_name: string
          guests_count?: number
          id?: string
          message?: string | null
          wedding_id: string
        }
        Update: {
          attendance?: string
          created_at?: string
          dietary_restrictions?: string | null
          guest_email?: string | null
          guest_name?: string
          guests_count?: number
          id?: string
          message?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          about_text: string | null
          additional_info: string | null
          ceremony_address: string | null
          ceremony_date: string | null
          ceremony_location: string | null
          ceremony_time: string | null
          colors_to_avoid: string | null
          couple_name: string
          created_at: string
          dress_code_text: string | null
          hero_image_url: string | null
          id: string
          layout: string
          mercado_pago_access_token: string | null
          mercado_pago_public_key: string | null
          partner1_name: string
          partner2_name: string
          reception_address: string | null
          reception_location: string | null
          reception_time: string | null
          same_location: boolean
          section_about: boolean
          section_dress_code: boolean
          section_gallery: boolean
          section_gifts: boolean
          section_message_wall: boolean
          section_rsvp: boolean
          section_video: boolean
          section_wedding_info: boolean
          slug: string | null
          story_photo_1: string | null
          story_photo_2: string | null
          story_photo_3: string | null
          tagline: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          wedding_date: string | null
        }
        Insert: {
          about_text?: string | null
          additional_info?: string | null
          ceremony_address?: string | null
          ceremony_date?: string | null
          ceremony_location?: string | null
          ceremony_time?: string | null
          colors_to_avoid?: string | null
          couple_name: string
          created_at?: string
          dress_code_text?: string | null
          hero_image_url?: string | null
          id?: string
          layout?: string
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          partner1_name?: string
          partner2_name?: string
          reception_address?: string | null
          reception_location?: string | null
          reception_time?: string | null
          same_location?: boolean
          section_about?: boolean
          section_dress_code?: boolean
          section_gallery?: boolean
          section_gifts?: boolean
          section_message_wall?: boolean
          section_rsvp?: boolean
          section_video?: boolean
          section_wedding_info?: boolean
          slug?: string | null
          story_photo_1?: string | null
          story_photo_2?: string | null
          story_photo_3?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          wedding_date?: string | null
        }
        Update: {
          about_text?: string | null
          additional_info?: string | null
          ceremony_address?: string | null
          ceremony_date?: string | null
          ceremony_location?: string | null
          ceremony_time?: string | null
          colors_to_avoid?: string | null
          couple_name?: string
          created_at?: string
          dress_code_text?: string | null
          hero_image_url?: string | null
          id?: string
          layout?: string
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          partner1_name?: string
          partner2_name?: string
          reception_address?: string | null
          reception_location?: string | null
          reception_time?: string | null
          same_location?: boolean
          section_about?: boolean
          section_dress_code?: boolean
          section_gallery?: boolean
          section_gifts?: boolean
          section_message_wall?: boolean
          section_rsvp?: boolean
          section_video?: boolean
          section_wedding_info?: boolean
          slug?: string | null
          story_photo_1?: string | null
          story_photo_2?: string | null
          story_photo_3?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_wedding_slug: { Args: { couple_name: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
