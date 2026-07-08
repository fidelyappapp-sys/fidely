// Mirrors Stripe.Subscription.status (kept as a plain string — no DB check
// constraint — since Stripe's own status enum evolves independently).
export type SubscriptionStatus = string;

export type MerchantStaffRole = "owner" | "staff";

export type PushStatus = "skipped" | "sent" | "failed";

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          auth_user_id: string;
          business_name: string;
          slug: string;
          logo_url: string | null;
          brand_color: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_item_id: string | null;
          subscription_status: SubscriptionStatus;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchants"]["Row"]> & {
          auth_user_id: string;
          business_name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchants"]["Row"]>;
        Relationships: [];
      };
      merchant_staff: {
        Row: {
          id: string;
          merchant_id: string;
          auth_user_id: string;
          role: MerchantStaffRole;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_staff"]["Row"]> & {
          merchant_id: string;
          auth_user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_staff"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_staff_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_programs: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          points_per_scan: number;
          reward_threshold: number;
          reward_description: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loyalty_programs"]["Row"]> & {
          merchant_id: string;
          name: string;
          reward_threshold: number;
          reward_description: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_programs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      loyalty_cards: {
        Row: {
          id: string;
          public_id: string;
          merchant_id: string;
          loyalty_program_id: string;
          customer_id: string;
          points: number;
          pass_serial_number: string;
          pass_auth_token: string;
          apple_pass_updated_at: string;
          google_object_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loyalty_cards"]["Row"]> & {
          merchant_id: string;
          loyalty_program_id: string;
          customer_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_cards"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_cards_loyalty_program_id_fkey";
            columns: ["loyalty_program_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_cards_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_events: {
        Row: {
          id: string;
          loyalty_card_id: string;
          merchant_id: string;
          staff_user_id: string | null;
          points_awarded: number;
          points_balance_after: number;
          stripe_usage_reported: boolean;
          stripe_meter_event_id: string | null;
          apple_push_status: PushStatus;
          google_push_status: PushStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scan_events"]["Row"]> & {
          loyalty_card_id: string;
          merchant_id: string;
          points_awarded: number;
          points_balance_after: number;
        };
        Update: Partial<Database["public"]["Tables"]["scan_events"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "scan_events_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_events_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_pass_registrations: {
        Row: {
          id: string;
          device_library_identifier: string;
          pass_type_identifier: string;
          serial_number: string;
          push_token: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_pass_registrations"]["Row"]> & {
          device_library_identifier: string;
          pass_type_identifier: string;
          serial_number: string;
          push_token: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_pass_registrations"]["Row"]>;
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          type: string;
          payload: Record<string, unknown>;
          processed_at: string;
        };
        Insert: {
          id: string;
          type: string;
          payload: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["stripe_webhook_events"]["Row"]>;
        Relationships: [];
      };
      rate_limit_events: {
        Row: {
          id: number;
          bucket_key: string;
          created_at: string;
        };
        Insert: { bucket_key: string };
        Update: Partial<Database["public"]["Tables"]["rate_limit_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_scan_points: {
        Args: { p_loyalty_card_id: string; p_staff_user_id: string };
        Returns: {
          scan_event_id: string;
          points_awarded: number;
          points_balance_after: number;
          merchant_id: string;
          stripe_customer_id: string | null;
          pass_serial_number: string;
          google_object_id: string | null;
        }[];
      };
      prune_rate_limit_events: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
  };
}
