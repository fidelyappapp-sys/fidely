// Mirrors Stripe.Subscription.status (kept as a plain string — no DB check
// constraint — since Stripe's own status enum evolves independently).
export type SubscriptionStatus = string;

export type MerchantStaffRole = "owner" | "staff";

export type StampStyle =
  | "star"
  | "square"
  | "triangle"
  | "heart"
  | "butterfly"
  | "circle"
  | "diamond";

export type SectorKey =
  | "restaurant"
  | "food_truck"
  | "bar"
  | "hairdresser"
  | "cafe"
  | "bakery"
  | "beauty_spa"
  | "gym"
  | "dry_cleaning"
  | "garage"
  | "florist"
  | "bookstore"
  | "pet_shop"
  | "pharmacy"
  | "cinema";

// The stamp icon picker (CardCustomizer) merges the generic shapes with the
// sector icons into one selector, so stamp_style must accept either set.
export type StampIconKey = StampStyle | SectorKey;

export type PushStatus = "skipped" | "sent" | "failed";

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface OpeningHoursEntry {
  day: WeekDay;
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type OpeningHours = OpeningHoursEntry[];

export type KitDeliveryMethod = "hand_delivery" | "postal_shipping";
export type KitDeliveryStatus = "pending" | "processing" | "shipped" | "delivered" | "installed";

export interface KitShippingAddress {
  name: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
}

export type ShopOrderStatus = "pending" | "paid" | "shipped" | "delivered";

export type PlaqueTier = "avis" | "presence" | "pro";
export type HubTabKey = "menu" | "avis" | "social" | "contact";
export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "website" | "other";

// Tabs for a *standalone* presence/pro plaque (merchant_id is null — no
// merchant account, admin-filled via app/admin/(protected)/plaques instead
// of merchant_hub_config/merchant_menu_items). "fidelite" only makes sense
// alongside plaques.loyalty_enabled, but nothing here enforces that pairing.
export type StandalonePlaqueTabKey = "accueil" | "avis" | "menu" | "offres" | "fidelite";

export interface PlaqueMenuConfig {
  enabledTabs: StandalonePlaqueTabKey[];
  menuItems?: { name: string; description?: string | null; priceCents?: number | null }[];
  offers?: string[];
}

export interface ShopOrderItem {
  key: "display_stand" | "sheet" | "qr" | "full_kit" | "new_shop_kit" | "nfc_card" | "nfc_loyalty_card" | "nfc_chip";
  label: string;
  quantity: number;
  unitAmountCents: number;
  // Which point of sale each unit is configured for once received — only
  // set for "qr"/"nfc_chip"/"full_kit" items (see PLAQUE_COMPONENTS in
  // lib/boutique.ts). One entry per unit (length === quantity). Label is a
  // snapshot at order time, not a live join, so it survives the point of
  // sale being renamed or removed later.
  posAssignments?: { posId: string; posLabel: string }[];
}

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
          subscription_canceled_at: string | null;
          subscription_paused_at: string | null;
          subscription_pause_ends_at: string | null;
          pause_reminder_sent_at: string | null;
          onboarding_completed: boolean;
          google_maps_link: string | null;
          birthday_notifications_enabled: boolean;
          phone: string | null;
          address: string | null;
          google_review_link: string | null;
          google_place_id: string | null;
          opening_hours: OpeningHours;
          kit_delivery_method: KitDeliveryMethod | null;
          kit_shipping_address: KitShippingAddress | null;
          kit_delivery_status: KitDeliveryStatus;
          kit_payment_intent_id: string | null;
          stamp_style: StampIconKey;
          business_type: string | null;
          background_photo_url: string | null;
          background_photo_enabled: boolean;
          sector: SectorKey | null;
          name_display_mode: "text" | "logo";
          text_color: string | null;
          owner_first_name: string | null;
          owner_last_name: string | null;
          owner_phone: string | null;
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
      merchant_menu_items: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          price_cents: number | null;
          photo_url: string | null;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_menu_items"]["Row"]> & {
          merchant_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_menu_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_menu_items_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_gallery_photos: {
        Row: {
          id: string;
          merchant_id: string;
          url: string;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_gallery_photos"]["Row"]> & {
          merchant_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_gallery_photos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_gallery_photos_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_staff: {
        Row: {
          id: string;
          merchant_id: string;
          auth_user_id: string | null;
          role: MerchantStaffRole;
          scan_token: string | null;
          first_name: string | null;
          last_name: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_staff"]["Row"]> & {
          merchant_id: string;
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
      merchant_qr_codes: {
        Row: {
          id: string;
          merchant_id: string;
          label: string;
          target_url: string;
          kind: "custom" | "join_source" | "main";
          city: string | null;
          loyalty_program_id: string | null;
          brand_color: string | null;
          text_color: string | null;
          stamp_style: StampIconKey | null;
          sector: SectorKey | null;
          logo_url: string | null;
          background_photo_url: string | null;
          background_photo_enabled: boolean | null;
          name_display_mode: "text" | "logo" | null;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_qr_codes"]["Row"]> & {
          merchant_id: string;
          label: string;
          target_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_qr_codes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_qr_codes_merchant_id_fkey";
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
          display_mode: "stamps" | "points";
          points_per_scan: number;
          stamp_count: number;
          points_per_euro: number | null;
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
          birth_date: string | null;
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
          last_push_message: string | null;
          last_birthday_year: number | null;
          source: string | null;
          merchant_qr_code_id: string | null;
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
      push_notifications: {
        Row: {
          id: string;
          merchant_id: string;
          type: "manual" | "birthday";
          title: string | null;
          body: string;
          recipient_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_notifications"]["Row"]> & {
          merchant_id: string;
          type: "manual" | "birthday";
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_notifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "push_notifications_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      review_requests: {
        Row: {
          id: string;
          loyalty_card_id: string;
          merchant_id: string;
          due_at: string;
          status: "pending" | "sent" | "skipped" | "failed";
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["review_requests"]["Row"]> & {
          loyalty_card_id: string;
          merchant_id: string;
          due_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_requests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "review_requests_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_requests_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_claims: {
        Row: {
          id: string;
          loyalty_card_id: string;
          merchant_id: string;
          points_at_claim: number;
          reward_description: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reward_claims"]["Row"]> & {
          loyalty_card_id: string;
          merchant_id: string;
          points_at_claim: number;
          reward_description: string;
        };
        Update: Partial<Database["public"]["Tables"]["reward_claims"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reward_claims_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reward_claims_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          loyalty_card_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          loyalty_card_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_orders: {
        Row: {
          id: string;
          merchant_id: string;
          items: ShopOrderItem[];
          amount_cents: number;
          delivery_method: KitDeliveryMethod | null;
          shipping_address: KitShippingAddress | null;
          status: ShopOrderStatus;
          stripe_checkout_session_id: string | null;
          tier: PlaqueTier | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shop_orders"]["Row"]> & {
          merchant_id: string;
          items: ShopOrderItem[];
          amount_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["shop_orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "shop_orders_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      public_shop_orders: {
        Row: {
          id: string;
          item_key: "nfc_card";
          quantity: number;
          unit_amount_cents: number;
          amount_cents: number;
          shipping_address: KitShippingAddress | null;
          buyer_email: string | null;
          buyer_name: string | null;
          status: ShopOrderStatus;
          stripe_checkout_session_id: string | null;
          tier: "avis";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["public_shop_orders"]["Row"]> & {
          item_key: "nfc_card";
          quantity: number;
          unit_amount_cents: number;
          amount_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["public_shop_orders"]["Row"]>;
        Relationships: [];
      };
      avis_links: {
        Row: {
          id: string;
          public_shop_order_id: string;
          buyer_email: string;
          google_review_link: string;
          edit_token_hash: string | null;
          edit_token_rotated_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["avis_links"]["Row"]> & {
          public_shop_order_id: string;
          buyer_email: string;
          google_review_link: string;
        };
        Update: Partial<Database["public"]["Tables"]["avis_links"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "avis_links_public_shop_order_id_fkey";
            columns: ["public_shop_order_id"];
            isOneToOne: true;
            referencedRelation: "public_shop_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      plaques: {
        Row: {
          id: string;
          short_code: string;
          tier: PlaqueTier | null;
          merchant_id: string | null;
          avis_link_id: string | null;
          label: string | null;
          shop_order_id: string | null;
          public_shop_order_id: string | null;
          redirect_url: string | null;
          loyalty_enabled: boolean;
          merchant_name: string | null;
          merchant_address: string | null;
          google_place_id: string | null;
          menu_config: PlaqueMenuConfig | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plaques"]["Row"]> & {
          tier: PlaqueTier;
        };
        Update: Partial<Database["public"]["Tables"]["plaques"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "plaques_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plaques_avis_link_id_fkey";
            columns: ["avis_link_id"];
            isOneToOne: false;
            referencedRelation: "avis_links";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_hub_config: {
        Row: {
          merchant_id: string;
          enabled_tabs: HubTabKey[];
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_hub_config"]["Row"]> & {
          merchant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_hub_config"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_hub_config_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: true;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_social_links: {
        Row: {
          id: string;
          merchant_id: string;
          platform: SocialPlatform;
          url: string;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_social_links"]["Row"]> & {
          merchant_id: string;
          platform: SocialPlatform;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_social_links"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_social_links_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_hub_modifications: {
        Row: {
          id: number;
          merchant_id: string;
          year_month: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_hub_modifications"]["Row"]> & {
          merchant_id: string;
          year_month: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_hub_modifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_hub_modifications_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_plaque_subscriptions: {
        Row: {
          merchant_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_subscription_item_id: string | null;
          billing_interval: "month" | "year";
          status: string;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_plaque_subscriptions"]["Row"]> & {
          merchant_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          billing_interval: "month" | "year";
        };
        Update: Partial<Database["public"]["Tables"]["merchant_plaque_subscriptions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_plaque_subscriptions_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: true;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchant_menu_translations: {
        Row: {
          menu_item_id: string;
          locale: string;
          translated_name: string;
          translated_description: string | null;
          translated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_menu_translations"]["Row"]> & {
          menu_item_id: string;
          locale: string;
          translated_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_menu_translations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "merchant_menu_translations_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "merchant_menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          auth_user_id: string;
          created_at: string;
        };
        Insert: { auth_user_id: string };
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Row"]>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_auth_user_id: string;
          action: string;
          target_merchant_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]> & {
          admin_auth_user_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_target_merchant_id_fkey";
            columns: ["target_merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          merchant_id: string;
          stripe_invoice_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          hosted_invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          format: "stripe_hosted" | "facturx" | "ubl";
          plateforme_agreee: string | null;
          statut_transmission: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          merchant_id: string;
          stripe_invoice_id: string;
          amount_cents: number;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_scan_points: {
        Args: { p_loyalty_card_id: string; p_staff_user_id: string | null };
        Returns: {
          scan_event_id: string;
          points_awarded: number;
          points_balance_after: number;
          merchant_id: string;
          stripe_customer_id: string | null;
          pass_serial_number: string;
          google_object_id: string | null;
          business_name: string;
          display_mode: string;
          reward_threshold: number;
          reward_description: string;
          reward_claimed: boolean;
        }[];
      };
      prune_rate_limit_events: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      try_record_hub_modification: {
        Args: { target_merchant_id: string; monthly_limit: number };
        Returns: boolean;
      };
      find_birthday_cards: {
        Args: Record<string, never>;
        Returns: {
          loyalty_card_id: string;
          merchant_id: string;
          pass_serial_number: string;
          google_object_id: string | null;
          business_name: string;
        }[];
      };
    };
  };
}
