// Database Types - Auto-generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      buyers: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          agent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
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
export type DbBuyer = Database['public']['Tables']['buyers']['Row'];
export type DbAgent = Database['public']['Tables']['agents']['Row'];
export type DbBuyerProperty = Database['public']['Tables']['buyer_properties']['Row'];
export type DbPropertyPhoto = Database['public']['Tables']['property_photos']['Row'];
export type DbPropertyActivity = Database['public']['Tables']['property_activities']['Row'];

// Insert types
export type DbPropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type DbBuyerInsert = Database['public']['Tables']['buyers']['Insert'];
export type DbAgentInsert = Database['public']['Tables']['agents']['Insert'];
export type DbBuyerPropertyInsert = Database['public']['Tables']['buyer_properties']['Insert'];
export type DbPropertyPhotoInsert = Database['public']['Tables']['property_photos']['Insert'];
export type DbPropertyActivityInsert = Database['public']['Tables']['property_activities']['Insert'];

// Update types
export type DbPropertyUpdate = Database['public']['Tables']['properties']['Update'];
export type DbBuyerUpdate = Database['public']['Tables']['buyers']['Update'];
export type DbAgentUpdate = Database['public']['Tables']['agents']['Update'];
export type DbBuyerPropertyUpdate = Database['public']['Tables']['buyer_properties']['Update'];
export type DbPropertyPhotoUpdate = Database['public']['Tables']['property_photos']['Update'];
export type DbPropertyActivityUpdate = Database['public']['Tables']['property_activities']['Update'];
