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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          action_type: Database["public"]["Enums"]["action_item_type"]
          assigned_agent_id: string
          assigned_buyer_id: string | null
          assigned_to: Database["public"]["Enums"]["action_items_assigned_to"]
          buyer_property_id: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          item_order: number | null
          organization_id: string
          priority: string | null
          status: string | null
          timeline_step_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_item_type"]
          assigned_agent_id: string
          assigned_buyer_id?: string | null
          assigned_to: Database["public"]["Enums"]["action_items_assigned_to"]
          buyer_property_id?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_order?: number | null
          organization_id: string
          priority?: string | null
          status?: string | null
          timeline_step_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_item_type"]
          assigned_agent_id?: string
          assigned_buyer_id?: string | null
          assigned_to?: Database["public"]["Enums"]["action_items_assigned_to"]
          buyer_property_id?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_order?: number | null
          organization_id?: string
          priority?: string | null
          status?: string | null
          timeline_step_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "timeline_health_check"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "action_items_assigned_buyer_id_fkey"
            columns: ["assigned_buyer_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_assigned_buyer_id_fkey"
            columns: ["assigned_buyer_id"]
            isOneToOne: false
            referencedRelation: "timeline_health_check"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "action_items_buyer_property_id_fkey"
            columns: ["buyer_property_id"]
            isOneToOne: false
            referencedRelation: "buyer_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "timeline_health_check"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "action_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_timeline_step_id_fkey"
            columns: ["timeline_step_id"]
            isOneToOne: false
            referencedRelation: "timeline_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_profiles: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          budget_approved: boolean | null
          buyer_needs: string | null
          created_at: string | null
          down_payment_amount: number | null
          id: string
          ideal_move_in_date: string | null
          must_have_features: string[] | null
          nice_to_have_features: string[] | null
          person_id: string
          pre_approval_amount: number | null
          pre_approval_expiry: string | null
          preferred_areas: string[] | null
          price_max: number | null
          price_min: number | null
          property_type_preferences: string[] | null
          raw_background: string | null
          updated_at: string | null
          urgency_level: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          budget_approved?: boolean | null
          buyer_needs?: string | null
          created_at?: string | null
          down_payment_amount?: number | null
          id?: string
          ideal_move_in_date?: string | null
          must_have_features?: string[] | null
          nice_to_have_features?: string[] | null
          person_id: string
          pre_approval_amount?: number | null
          pre_approval_expiry?: string | null
          preferred_areas?: string[] | null
          price_max?: number | null
          price_min?: number | null
          property_type_preferences?: string[] | null
          raw_background?: string | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          budget_approved?: boolean | null
          buyer_needs?: string | null
          created_at?: string | null
          down_payment_amount?: number | null
          id?: string
          ideal_move_in_date?: string | null
          must_have_features?: string[] | null
          nice_to_have_features?: string[] | null
          person_id?: string
          pre_approval_amount?: number | null
          pre_approval_expiry?: string | null
          preferred_areas?: string[] | null
          price_max?: number | null
          price_min?: number | null
          property_type_preferences?: string[] | null
          raw_background?: string | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "timeline_health_check"
            referencedColumns: ["person_id"]
          },
        ]
      }
      buyer_properties: {
        Row: {
          actual_closing_date: string | null
          buyer_id: string
          contract_date: string | null
          created_at: string | null
          escrow_date: string | null
          expected_closing_date: string | null
          hybrid_score: number | null
          id: string
          interest_level: Database["public"]["Enums"]["interest_level"]
          is_active: boolean | null
          last_activity_at: string | null
          llm_score: number | null
          match_reasons: string | null
          ml_score: number | null
          offer_amount: number | null
          offer_date: string | null
          offer_status: string | null
          organization_id: string
          property_id: string
          recommendation_source: string | null
          recommended_at: string | null
          relationship_type: string | null
          rule_score: number | null
          updated_at: string | null
        }
        Insert: {
          actual_closing_date?: string | null
          buyer_id: string
          contract_date?: string | null
          created_at?: string | null
          escrow_date?: string | null
          expected_closing_date?: string | null
          hybrid_score?: number | null
          id?: string
          interest_level: Database["public"]["Enums"]["interest_level"]
          is_active?: boolean | null
          last_activity_at?: string | null
          llm_score?: number | null
          match_reasons?: string | null
          ml_score?: number | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_status?: string | null
          organization_id: string
          property_id: string
          recommendation_source?: string | null
          recommended_at?: string | null
          relationship_type?: string | null
          rule_score?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_closing_date?: string | null
          buyer_id?: string
          contract_date?: string | null
          created_at?: string | null
          escrow_date?: string | null
          expected_closing_date?: string | null
          hybrid_score?: number | null
          id?: string
          interest_level?: Database["public"]["Enums"]["interest_level"]
          is_active?: boolean | null
          last_activity_at?: string | null
          llm_score?: number | null
          match_reasons?: string | null
          ml_score?: number | null
          offer_amount?: number | null
          offer_date?: string | null
          offer_status?: string | null
          organization_id?: string
          property_id?: string
          recommendation_source?: string | null
          recommended_at?: string | null
          relationship_type?: string | null
          rule_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_properties_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_properties_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "timeline_health_check"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "buyer_properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      // Additional tables omitted for brevity - they remain the same
    }
    Views: {
      // Views omitted for brevity
    }
    Functions: {
      // Functions omitted for brevity
    }
    Enums: {
      action_item_type:
        | "conduct_buyer_consultation"
        | "connect_buyer_with_lender"
        | "verify_proof_of_funds"
        | "set_up_property_search"
        | "schedule_attend_showings"
        | "review_disclosures_reports"
        | "discuss_offer_strategy"
        | "prepare_offer_paperwork"
        | "assess_finances_set_budget"
        | "get_pre_approval"
        | "gather_financial_documents"
        | "provide_proof_of_funds"
        | "research_neighborhoods"
        | "attend_property_showings"
        | "review_seller_disclosures"
        | "submit_contract_to_escrow"
        | "ensure_earnest_money_deposited"
        | "review_preliminary_title_report"
        | "schedule_all_inspections"
        | "negotiate_repairs_credits"
        | "schedule_final_walkthrough"
        | "review_closing_disclosure"
        | "coordinate_notary_signing"
        | "deliver_keys"
        | "deposit_earnest_money"
        | "review_sign_escrow_instructions"
        | "schedule_complete_inspections"
        | "secure_homeowners_insurance"
        | "remove_contingencies"
        | "wire_final_funds"
        | "attend_final_walkthrough"
        | "attend_closing_signing"
        | "other"
      action_items_assigned_to: "agent" | "buyer" | "both"
      conversation_status: "active" | "archived" | "deleted"
      document_type:
        | "timeline"
        | "disclosure"
        | "contract"
        | "inspection"
        | "financial"
        | "other"
      fub_stage:
        | "lead"
        | "hot_prospect"
        | "nurture"
        | "active_client"
        | "pending"
        | "closed"
        | "past_client"
        | "sphere"
        | "trash"
        | "unresponsive"
      interest_level:
        | "interested"
        | "loved"
        | "viewing_scheduled"
        | "under_contract"
        | "pending"
        | "passed"
      message_role: "user" | "assistant" | "system"
      person_role:
        | "agent"
        | "buyer"
        | "admin"
        | "manager"
        | "assistant"
        | "other"
      property_status:
        | "active"
        | "under_contract"
        | "pending"
        | "closed"
        | "cancelled"
        | "withdrawn"
      step_type: "pre_escrow" | "escrow" | "post_escrow"
      timeline_phase: "pre_escrow" | "escrow" | "post_escrow" | "inactive"
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
