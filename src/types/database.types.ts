// Database Types - Auto-generated from Supabase schema
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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      persons: {
        Row: {
          agent_id: string | null
          background: string | null
          budget_approved: boolean | null
          buyer_needs: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          fub_person_id: number | null
          id: string
          last_contact_date: string | null
          last_name: string | null
          last_synced_with_fub: string | null
          middle_name: string | null
          next_followup_date: string | null
          organization_id: string | null
          phone: string | null
          pre_approval_amount: number | null
          pre_approval_expiry: string | null
          price: number | null
          price_max: number | null
          price_min: number | null
          role: Database["public"]["Enums"]["person_role"] | null
          stage: string | null
          tags: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          background?: string | null
          budget_approved?: boolean | null
          buyer_needs?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          fub_person_id?: number | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          last_synced_with_fub?: string | null
          middle_name?: string | null
          next_followup_date?: string | null
          organization_id?: string | null
          phone?: string | null
          pre_approval_amount?: number | null
          pre_approval_expiry?: string | null
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          role?: Database["public"]["Enums"]["person_role"] | null
          stage?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          background?: string | null
          budget_approved?: boolean | null
          buyer_needs?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          fub_person_id?: number | null
          id?: string
          last_contact_date?: string | null
          last_name?: string | null
          last_synced_with_fub?: string | null
          middle_name?: string | null
          next_followup_date?: string | null
          organization_id?: string | null
          phone?: string | null
          pre_approval_amount?: number | null
          pre_approval_expiry?: string | null
          price?: number | null
          price_max?: number | null
          price_min?: number | null
          role?: Database["public"]["Enums"]["person_role"] | null
          stage?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_agent_id_fk_new"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_organization_id_fk_new"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          id: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          listing_price: number;
          purchase_price: number | null;
          bedrooms: number;
          bathrooms: number;
          square_feet: number | null;
          lot_size: number | null;
          year_built: number | null;
          property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'other';
          status: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          mls_number: string | null;
          listing_url: string | null;
          notes: string | null;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          listing_price: number;
          purchase_price?: number | null;
          bedrooms: number;
          bathrooms: number;
          square_feet?: number | null;
          lot_size?: number | null;
          year_built?: number | null;
          property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'other';
          status: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          mls_number?: string | null;
          listing_url?: string | null;
          notes?: string | null;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          listing_price?: number;
          purchase_price?: number | null;
          bedrooms?: number;
          bathrooms?: number;
          square_feet?: number | null;
          lot_size?: number | null;
          year_built?: number | null;
          property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'other';
          status?: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage?: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required?: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          mls_number?: string | null;
          listing_url?: string | null;
          notes?: string | null;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      buyer_properties: {
        Row: {
          id: string;
          buyer_id: string;
          property_id: string;
          status: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          notes: string | null;
          purchase_price: number | null;
          offer_date: string | null;
          closing_date: string | null;
          added_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          property_id: string;
          status?: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage?: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required?: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          notes?: string | null;
          purchase_price?: number | null;
          offer_date?: string | null;
          closing_date?: string | null;
          added_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          property_id?: string;
          status?: 'researching' | 'viewing' | 'offer_submitted' | 'under_contract' | 'in_escrow' | 'closed' | 'withdrawn';
          buying_stage?: 'initial_research' | 'active_search' | 'offer_negotiation' | 'under_contract' | 'closing';
          action_required?: 'schedule_viewing' | 'submit_offer' | 'review_documents' | 'inspection' | 'appraisal' | 'final_walkthrough' | 'none';
          notes?: string | null;
          purchase_price?: number | null;
          offer_date?: string | null;
          closing_date?: string | null;
          added_at?: string;
          last_activity_at?: string;
        };
      };
      property_photos: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          caption: string | null;
          is_primary: boolean;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          caption?: string | null;
          is_primary?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          url?: string;
          caption?: string | null;
          is_primary?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_activities: {
        Row: {
          id: string;
          buyer_property_id: string;
          type: 'note' | 'viewing' | 'offer' | 'document' | 'milestone';
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_property_id: string;
          type: 'note' | 'viewing' | 'offer' | 'document' | 'milestone';
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_property_id?: string;
          type?: 'note' | 'viewing' | 'offer' | 'document' | 'milestone';
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      person_role: "buyer" | "agent" | "other";
      property_status: "researching" | "viewing" | "offer_submitted" | "under_contract" | "in_escrow" | "closed" | "withdrawn";
      property_buying_stage: "initial_research" | "active_search" | "offer_negotiation" | "under_contract" | "closing";
      property_action_required: "schedule_viewing" | "submit_offer" | "review_documents" | "inspection" | "appraisal" | "final_walkthrough" | "none";
      property_type: "single_family" | "condo" | "townhouse" | "multi_family" | "other";
    };
  };
}

// Type aliases for convenience
export type PropertyStatus = Database['public']['Tables']['properties']['Row']['status'];
export type BuyingStage = Database['public']['Tables']['properties']['Row']['buying_stage'];
export type ActionRequired = Database['public']['Tables']['properties']['Row']['action_required'];
export type PropertyType = Database['public']['Tables']['properties']['Row']['property_type'];
export type ActivityType = Database['public']['Tables']['property_activities']['Row']['type'];

// Table row types
export type DbProperty = Database['public']['Tables']['properties']['Row'];
export type DbPerson = Database['public']['Tables']['persons']['Row'];
export type DbBuyerProperty = Database['public']['Tables']['buyer_properties']['Row'];
export type DbPropertyPhoto = Database['public']['Tables']['property_photos']['Row'];
export type DbPropertyActivity = Database['public']['Tables']['property_activities']['Row'];

// Insert types
export type DbPropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type DbPersonInsert = Database['public']['Tables']['persons']['Insert'];
export type DbBuyerPropertyInsert = Database['public']['Tables']['buyer_properties']['Insert'];
export type DbPropertyPhotoInsert = Database['public']['Tables']['property_photos']['Insert'];
export type DbPropertyActivityInsert = Database['public']['Tables']['property_activities']['Insert'];

// Update types
export type DbPropertyUpdate = Database['public']['Tables']['properties']['Update'];
export type DbPersonUpdate = Database['public']['Tables']['persons']['Update'];
export type DbBuyerPropertyUpdate = Database['public']['Tables']['buyer_properties']['Update'];
export type DbPropertyPhotoUpdate = Database['public']['Tables']['property_photos']['Update'];
export type DbPropertyActivityUpdate = Database['public']['Tables']['property_activities']['Update'];

// Legacy type aliases for backward compatibility
export type DbAgent = DbPerson;
export type DbAgentInsert = DbPersonInsert;
export type DbAgentUpdate = DbPersonUpdate;

export type DbBuyer = DbPerson;
export type DbBuyerInsert = DbPersonInsert;
export type DbBuyerUpdate = DbPersonUpdate;
