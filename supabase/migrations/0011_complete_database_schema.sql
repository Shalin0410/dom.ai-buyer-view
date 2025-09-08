-- =============================================================================
-- COMPLETE REAL ESTATE PLATFORM DATABASE SCHEMA - REFINED VERSION
-- =============================================================================
-- 
-- This migration creates the entire database from scratch
-- Run this on a fresh Supabase instance
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE ENUMS
-- =============================================================================

-- FUB CRM integration stages
CREATE TYPE fub_stage AS ENUM (
  'lead',                -- FUB ID: 2, orderWeight: 1000
  'hot_prospect',        -- FUB ID: 12, orderWeight: 2000
  'nurture',             -- FUB ID: 13, orderWeight: 3000
  'active_client',       -- FUB ID: 17, orderWeight: 4000
  'pending',             -- FUB ID: 14, orderWeight: 5000
  'closed',              -- FUB ID: 8, orderWeight: 6000
  'past_client',         -- FUB ID: 15, orderWeight: 7000
  'sphere',              -- FUB ID: 16, orderWeight: 8000
  'trash',               -- FUB ID: 11, orderWeight: 9000
  'unresponsive'         -- FUB ID: 18, orderWeight: 10000
);

-- High-level phases of the real estate transaction process
CREATE TYPE timeline_phase AS ENUM (
  'pre_escrow',          -- Before contract: lead generation, property search, offers
  'escrow',              -- Under contract: inspections, loan approval, closing prep
  'post_escrow',         -- After closing: key delivery, follow-up, referrals
  'inactive'             -- No active transaction: sphere, past clients, unresponsive
);

-- Types of steps that can be created in timelines
CREATE TYPE step_type AS ENUM (
  'pre_escrow',          -- Steps before going under contract
  'escrow',              -- Steps during escrow period
  'post_escrow'          -- Steps after closing
);

-- Comprehensive action item types for both agents and buyers
CREATE TYPE action_item_type AS ENUM (
  -- Pre-Escrow Actions - Agent Tasks
  'conduct_buyer_consultation',
  'connect_buyer_with_lender',
  'verify_proof_of_funds',
  'set_up_property_search',
  'schedule_attend_showings',
  'review_disclosures_reports',
  'discuss_offer_strategy',
  'prepare_offer_paperwork',
  
  -- Pre-Escrow Actions - Buyer Tasks
  'assess_finances_set_budget',
  'get_pre_approval',
  'gather_financial_documents',
  'provide_proof_of_funds',
  'research_neighborhoods',
  'attend_property_showings',
  'review_seller_disclosures',
  
  -- Escrow Actions - Agent Tasks
  'submit_contract_to_escrow',
  'ensure_earnest_money_deposited',
  'review_preliminary_title_report',
  'schedule_all_inspections',
  'negotiate_repairs_credits',
  'schedule_final_walkthrough',
  'review_closing_disclosure',
  'coordinate_notary_signing',
  'deliver_keys',
  
  -- Escrow Actions - Buyer Tasks
  'deposit_earnest_money',
  'review_sign_escrow_instructions',
  'schedule_complete_inspections',
  'secure_homeowners_insurance',
  'remove_contingencies',
  'wire_final_funds',
  'attend_final_walkthrough',
  'attend_closing_signing',
  
  -- Generic action type
  'other'
);

-- Property listing status
CREATE TYPE property_status AS ENUM (
  'active',              -- Available for purchase, actively marketed
  'under_contract',      -- Under contract but not yet closed
  'pending',             -- Sale pending, in escrow process
  'closed',              -- Sale completed, property sold
  'cancelled',           -- Contract cancelled, back on market
  'withdrawn'            -- Listing withdrawn from market
);

-- Types of documents managed in the system
CREATE TYPE document_type AS ENUM (
  'timeline',            -- Escrow timeline documents
  'disclosure',          -- Property disclosure documents
  'contract',            -- Purchase contracts and addenda
  'inspection',          -- Property inspection reports
  'financial',           -- Financial documents and statements
  'other'                -- Other document types
);

-- Chatbot conversation status
CREATE TYPE conversation_status AS ENUM (
  'active',              -- Active conversation, ongoing
  'archived',            -- Archived conversation, no longer active
  'deleted'              -- Deleted conversation, removed from system
);

-- Chat message roles
CREATE TYPE message_role AS ENUM (
  'user',                -- Message from human user (agent or buyer)
  'assistant',           -- Message from AI chatbot
  'system'               -- System-generated message
);

-- Person roles
CREATE TYPE person_role AS ENUM (
  'agent',               -- Agent role
  'buyer',               -- Buyer role
  'admin',               -- Admin role
  'manager',             -- User role
  'assistant',           -- Assistant role
  'other'                -- Other role
);

-- =============================================================================
-- STEP 2: CREATE CORE TABLES
-- =============================================================================

-- Multi-tenant organization structure
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type text,
  
  -- FUB Integration Settings
  fub_api_key text NOT NULL,
  fub_account_id text NOT NULL,
  
  -- Business Information
  business_address jsonb DEFAULT '{}',
  business_phone text,
  business_email text,
  website text,
  logo_url text,
  timezone text DEFAULT 'America/Los_Angeles',
  
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Unified person table supporting multiple roles
CREATE TABLE persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fub_person_id int UNIQUE,
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  email text UNIQUE NOT NULL,
  phone text,
  
  -- Role Management
  roles person_role[] NOT NULL DEFAULT '{}',
  primary_role person_role NOT NULL,
  
  -- Agent-specific fields
  license_number text,
  license_state text,
  license_expiry date,
  
  -- Buyer relationship
  assigned_agent_id uuid REFERENCES persons(id),
  
  -- Contact tracking
  last_contact_date date,
  next_followup_date date,
  
  -- Status and sync tracking
  is_active boolean DEFAULT true,
  last_synced_with_fub timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Separate buyer profile information
CREATE TABLE buyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Financial Information
  price_min int,
  price_max int,
  budget_approved boolean DEFAULT false,
  pre_approval_amount numeric,
  pre_approval_expiry date,
  down_payment_amount numeric,
  
  -- Preferences
  buyer_needs text,
  preferred_areas text[] DEFAULT '{}',
  property_type_preferences text[] DEFAULT '{}',
  must_have_features text[] DEFAULT '{}',
  nice_to_have_features text[] DEFAULT '{}',
  
  -- Timeline preferences
  ideal_move_in_date date,
  urgency_level text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 3: CREATE STEP TEMPLATES AND TIMELINE SYSTEM
-- =============================================================================

-- Templates for creating flexible step definitions
CREATE TABLE step_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Step Definition
  name text NOT NULL,
  description text,
  step_type step_type NOT NULL,
  default_order int NOT NULL,
  
  -- Template properties
  is_system_default boolean DEFAULT false,
  is_required boolean DEFAULT true,
  is_active boolean DEFAULT true,
  
  -- Default settings
  default_duration_days int,
  
  -- Business rules
  business_rules jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Properties table
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  listing_agent_id uuid REFERENCES persons(id),
  
  -- Address Information
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  coordinates jsonb DEFAULT '{}',
  
  -- Property Details
  listing_price numeric NOT NULL,
  purchase_price numeric,
  bedrooms int NOT NULL,
  bathrooms numeric NOT NULL,
  square_feet int,
  property_type text NOT NULL,
  year_built int,
  lot_size numeric,
  
  -- Listing Information
  status property_status NOT NULL,
  mls_number text UNIQUE,
  listing_url text,
  description text,
  days_on_market int,
  
  -- Flexible additional data
  features jsonb DEFAULT '{}',
  schools jsonb DEFAULT '{}',
  neighborhood_info jsonb DEFAULT '{}',
  
  -- Activity tracking
  has_active_interest boolean DEFAULT false,
  last_activity_at timestamp DEFAULT now(),
  
  -- FUB Integration
  fub_property_id int,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Property photos
CREATE TABLE property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  url text NOT NULL,
  caption text,
  is_primary boolean DEFAULT false,
  display_order int DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 4: CREATE BUYER-PROPERTY RELATIONSHIPS AND TIMELINES
-- =============================================================================

-- Junction table linking buyers to properties
CREATE TABLE buyer_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type text DEFAULT 'home_buyer',
  interest_level text,
  
  -- Offer Information
  offer_amount numeric,
  offer_date date,
  offer_status text,
  
  -- Key timeline dates
  contract_date date,
  escrow_date date,
  expected_closing_date date,
  actual_closing_date date,
  
  -- Status tracking
  is_active boolean DEFAULT true,
  last_activity_at timestamp with time zone DEFAULT now(),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(buyer_id, property_id)
);

-- Timeline tracking for each buyer-property relationship
CREATE TABLE timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_property_id uuid NOT NULL REFERENCES buyer_properties(id) ON DELETE CASCADE,
  
  -- Current Status
  current_phase timeline_phase NOT NULL,
  current_fub_stage fub_stage NOT NULL,
  stage_last_updated timestamp with time zone DEFAULT now(),
  
  -- Customization options
  is_custom_timeline boolean DEFAULT false,
  timeline_name text,
  timeline_notes text,
  auto_advance_enabled boolean DEFAULT true,
  
  -- Flexible data storage
  custom_data jsonb DEFAULT '{}',
  
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(buyer_property_id)
);

-- Individual steps within each timeline
CREATE TABLE timeline_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  
  -- Step reference
  step_template_id uuid REFERENCES step_templates(id),
  custom_step_name text,
  
  -- Step properties
  step_type step_type NOT NULL,
  step_order int NOT NULL,
  
  -- Status & Progress
  is_completed boolean DEFAULT false,
  completed_date date,
  due_date date,
  notes text,
  completion_notes text,
  
  -- Flexible step data
  step_data jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Audit trail for timeline changes
CREATE TABLE timeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  
  -- Change details
  changed_from timeline_phase,
  changed_to timeline_phase NOT NULL,
  fub_stage_from fub_stage,
  fub_stage_to fub_stage NOT NULL,
  
  -- Context and attribution
  changed_by uuid REFERENCES persons(id),
  change_reason text,
  system_generated boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 5: CREATE ACTION ITEMS AND COMMUNICATION
-- =============================================================================

-- Comprehensive action item system
CREATE TABLE action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role-based assignment
  assigned_agent_id uuid REFERENCES persons(id),
  assigned_buyer_id uuid REFERENCES persons(id),
  
  -- Context
  buyer_property_id uuid REFERENCES buyer_properties(id),
  timeline_step_id uuid REFERENCES timeline_steps(id),
  
  -- Action details
  action_type action_item_type NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Status and priority
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  due_date date,
  completed_date date,
  
  -- Progress tracking
  item_order int,
  completion_notes text,
  created_by uuid REFERENCES persons(id),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure only one assignment type
  CONSTRAINT check_assignment CHECK (
    (assigned_agent_id IS NOT NULL AND assigned_buyer_id IS NULL) OR
    (assigned_agent_id IS NULL AND assigned_buyer_id IS NOT NULL)
  )
);

-- =============================================================================
-- STEP 6: CREATE GMAIL INTEGRATION AND EMAIL SYSTEM
-- =============================================================================

-- Gmail OAuth connection per agent
CREATE TABLE gmail_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL UNIQUE REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Gmail connection
  gmail_user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone,
  
  -- Sync settings
  auto_sync boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
);

-- Email messages synced from Gmail
CREATE TABLE email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_property_id uuid REFERENCES buyer_properties(id),
  
  -- Gmail metadata
  gmail_message_id text NOT NULL UNIQUE,
  gmail_thread_id text NOT NULL,
  subject text,
  sender text NOT NULL,
  recipients text[] DEFAULT '{}',
  
  -- Content
  body_text text,
  body_html text,
  
  -- Classification
  message_type text DEFAULT 'general',
  importance text DEFAULT 'normal',
  
  -- Processing status
  is_processed boolean DEFAULT false,
  
  -- Flexible extracted data
  extracted_data jsonb DEFAULT '{}',
  
  gmail_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 7: CREATE DOCUMENT MANAGEMENT AND FINANCIAL SYSTEM
-- =============================================================================

-- Document storage and management
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_property_id uuid REFERENCES buyer_properties(id),
  
  -- Document metadata
  title text NOT NULL,
  document_type document_type NOT NULL,
  file_name text NOT NULL,
  file_size int,
  mime_type text,
  
  -- Storage
  storage_path text NOT NULL,
  storage_provider text DEFAULT 'supabase',
  
  -- Processing status
  extraction_status text DEFAULT 'pending',
  
  -- All processed data
  processed_data jsonb DEFAULT '{}',
  
  -- Access control
  is_public boolean DEFAULT false,
  access_level text DEFAULT 'agent_only',
  
  -- Upload metadata
  uploaded_by uuid REFERENCES persons(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Property financial calculations and net sheets
CREATE TABLE net_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_property_id uuid NOT NULL REFERENCES buyer_properties(id) ON DELETE CASCADE,
  
  -- Core financials
  listing_price numeric NOT NULL,
  purchase_price numeric,
  down_payment_percentage numeric DEFAULT 20,
  
  -- Loan details
  loan_amount numeric,
  interest_rate numeric,
  loan_term int DEFAULT 30,
  
  -- Monthly payments
  principal_interest numeric,
  property_tax_monthly numeric,
  insurance_monthly numeric,
  hoa_fees_monthly numeric,
  total_monthly_payment numeric,
  
  -- Closing costs
  closing_cost_estimate numeric,
  earnest_money numeric,
  cash_to_close numeric,
  
  -- Comparisons
  monthly_savings_vs_rent numeric,
  
  -- Market data
  market_data jsonb DEFAULT '{}',
  
  is_current boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 8: CREATE CHATBOT SYSTEM AND SYSTEM TABLES
-- =============================================================================

-- Chatbot conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  title text,
  status conversation_status NOT NULL DEFAULT 'active',
  
  -- All conversation metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Individual messages within conversations
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  role message_role NOT NULL,
  content text NOT NULL,
  
  -- AI tracking
  sources jsonb DEFAULT '[]',
  tokens_used int,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now()
);

-- System configuration
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Setting definition
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  setting_type text NOT NULL,
  description text,
  
  -- Setting properties
  is_system_setting boolean DEFAULT false,
  is_sensitive boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(organization_id, setting_key)
);

-- FUB sync logging
CREATE TABLE fub_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Sync classification
  sync_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  fub_entity_id int,
  
  -- Sync status
  sync_status text NOT NULL,
  sync_direction text NOT NULL,
  
  -- Enhanced logging fields for trigger operations
  error_level text DEFAULT 'info',
  trigger_name text,
  
  -- All sync details
  sync_data jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Persons indexes
CREATE INDEX idx_persons_organization_id ON persons(organization_id);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_fub_person_id ON persons(fub_person_id);
CREATE INDEX idx_persons_primary_role ON persons(primary_role);
CREATE INDEX idx_persons_assigned_agent_id ON persons(assigned_agent_id);
CREATE INDEX idx_persons_organization_role ON persons(organization_id, primary_role);
CREATE INDEX idx_persons_agent_buyers ON persons(assigned_agent_id, primary_role);

-- Buyer profiles indexes
CREATE INDEX idx_buyer_profiles_person_id ON buyer_profiles(person_id);
CREATE INDEX idx_buyer_profiles_price_range ON buyer_profiles(price_min, price_max);
CREATE INDEX idx_buyer_profiles_pre_approval_expiry ON buyer_profiles(pre_approval_expiry);

-- Step templates indexes
CREATE INDEX idx_step_templates_organization_id ON step_templates(organization_id);
CREATE INDEX idx_step_templates_step_type ON step_templates(step_type);
CREATE INDEX idx_step_templates_org_type_order ON step_templates(organization_id, step_type, default_order);
CREATE INDEX idx_step_templates_is_active ON step_templates(is_active);

-- Properties indexes
CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_mls_number ON properties(mls_number);
CREATE INDEX idx_properties_city_state ON properties(city, state);
CREATE INDEX idx_properties_price_beds_baths ON properties(listing_price, bedrooms, bathrooms);
CREATE INDEX idx_properties_has_active_interest ON properties(has_active_interest);
CREATE INDEX idx_properties_last_activity_at ON properties(last_activity_at);

-- Property photos indexes
CREATE INDEX idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX idx_property_photos_display_order ON property_photos(property_id, display_order);

-- Buyer properties indexes
CREATE INDEX idx_buyer_properties_organization_id ON buyer_properties(organization_id);
CREATE INDEX idx_buyer_properties_buyer_id ON buyer_properties(buyer_id);
CREATE INDEX idx_buyer_properties_property_id ON buyer_properties(property_id);
CREATE INDEX idx_buyer_properties_active ON buyer_properties(buyer_id, is_active);

-- Timelines indexes
CREATE INDEX idx_timelines_buyer_property_id ON timelines(buyer_property_id);
CREATE INDEX idx_timelines_current_phase ON timelines(current_phase);
CREATE INDEX idx_timelines_current_fub_stage ON timelines(current_fub_stage);
CREATE INDEX idx_timelines_stage_last_updated ON timelines(stage_last_updated);

-- Timeline steps indexes
CREATE INDEX idx_timeline_steps_timeline_id ON timeline_steps(timeline_id);
CREATE INDEX idx_timeline_steps_template_id ON timeline_steps(step_template_id);
CREATE INDEX idx_timeline_steps_timeline_order ON timeline_steps(timeline_id, step_order);
CREATE INDEX idx_timeline_steps_step_type ON timeline_steps(step_type);
CREATE INDEX idx_timeline_steps_due_date ON timeline_steps(due_date);

-- Timeline history indexes
CREATE INDEX idx_timeline_history_timeline_id ON timeline_history(timeline_id);
CREATE INDEX idx_timeline_history_changed_by ON timeline_history(changed_by);
CREATE INDEX idx_timeline_history_created_at ON timeline_history(created_at);

-- Action items indexes
CREATE INDEX idx_action_items_organization_id ON action_items(organization_id);
CREATE INDEX idx_action_items_assigned_agent_id ON action_items(assigned_agent_id);
CREATE INDEX idx_action_items_assigned_buyer_id ON action_items(assigned_buyer_id);
CREATE INDEX idx_action_items_buyer_property_id ON action_items(buyer_property_id);
CREATE INDEX idx_action_items_timeline_step_id ON action_items(timeline_step_id);
CREATE INDEX idx_action_items_action_type ON action_items(action_type);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- Gmail integrations indexes
CREATE INDEX idx_gmail_integrations_organization_id ON gmail_integrations(organization_id);
CREATE INDEX idx_gmail_integrations_agent_id ON gmail_integrations(agent_id);
CREATE INDEX idx_gmail_integrations_gmail_user_id ON gmail_integrations(gmail_user_id);

-- Email messages indexes
CREATE INDEX idx_email_messages_organization_id ON email_messages(organization_id);
CREATE INDEX idx_email_messages_buyer_property_id ON email_messages(buyer_property_id);
CREATE INDEX idx_email_messages_gmail_message_id ON email_messages(gmail_message_id);
CREATE INDEX idx_email_messages_gmail_thread_id ON email_messages(gmail_thread_id);
CREATE INDEX idx_email_messages_message_type ON email_messages(message_type);
CREATE INDEX idx_email_messages_gmail_date ON email_messages(gmail_date);

-- Documents indexes
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_buyer_property_id ON documents(buyer_property_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_extraction_status ON documents(extraction_status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- Net sheets indexes
CREATE INDEX idx_net_sheets_buyer_property_id ON net_sheets(buyer_property_id);
CREATE INDEX idx_net_sheets_buyer_property_current ON net_sheets(buyer_property_id, is_current);

-- Conversations indexes
CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- System settings indexes
CREATE INDEX idx_system_settings_organization_id ON system_settings(organization_id);
CREATE INDEX idx_system_settings_key ON system_settings(organization_id, setting_key);

-- FUB sync log indexes
CREATE INDEX idx_fub_sync_log_organization_id ON fub_sync_log(organization_id);
CREATE INDEX idx_fub_sync_log_sync_type ON fub_sync_log(sync_type);
CREATE INDEX idx_fub_sync_log_sync_status ON fub_sync_log(sync_status);
CREATE INDEX idx_fub_sync_log_created_at ON fub_sync_log(created_at);
CREATE INDEX idx_fub_sync_log_error_level ON fub_sync_log(error_level);
CREATE INDEX idx_trigger_operations ON fub_sync_log(sync_type, entity_type, created_at);

-- =============================================================================
-- STEP 10: CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_templates_updated_at BEFORE UPDATE ON step_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_properties_updated_at BEFORE UPDATE ON buyer_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timelines_updated_at BEFORE UPDATE ON timelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_steps_updated_at BEFORE UPDATE ON timeline_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gmail_integrations_updated_at BEFORE UPDATE ON gmail_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_net_sheets_updated_at BEFORE UPDATE ON net_sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 11: CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_sync_log ENABLE ROW LEVEL SECURITY;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION auth.get_user_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM persons 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR ALL USING (id = auth.get_user_organization_id());

-- Persons: Users can see people in their organization
CREATE POLICY "Users can view persons in own organization" ON persons
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Buyer profiles: Users can see buyer profiles in their organization
CREATE POLICY "Users can view buyer profiles in own organization" ON buyer_profiles
  FOR ALL USING (
    person_id IN (
      SELECT id FROM persons WHERE organization_id = auth.get_user_organization_id()
    )
  );

-- Step templates: Users can see templates in their organization
CREATE POLICY "Users can view step templates in own organization" ON step_templates
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Properties: Users can see properties in their organization
CREATE POLICY "Users can view properties in own organization" ON properties
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Property photos: Users can see photos for properties in their organization
CREATE POLICY "Users can view property photos in own organization" ON property_photos
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE organization_id = auth.get_user_organization_id()
    )
  );

-- Buyer properties: Users can see relationships in their organization
CREATE POLICY "Users can view buyer properties in own organization" ON buyer_properties
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Timelines: Users can see timelines in their organization
CREATE POLICY "Users can view timelines in own organization" ON timelines
  FOR ALL USING (
    buyer_property_id IN (
      SELECT id FROM buyer_properties WHERE organization_id = auth.get_user_organization_id()
    )
  );

-- Timeline steps: Users can see steps in their organization
CREATE POLICY "Users can view timeline steps in own organization" ON timeline_steps
  FOR ALL USING (
    timeline_id IN (
      SELECT id FROM timelines 
      WHERE buyer_property_id IN (
        SELECT id FROM buyer_properties WHERE organization_id = auth.get_user_organization_id()
      )
    )
  );

-- Timeline history: Users can see history in their organization
CREATE POLICY "Users can view timeline history in own organization" ON timeline_history
  FOR ALL USING (
    timeline_id IN (
      SELECT id FROM timelines 
      WHERE buyer_property_id IN (
        SELECT id FROM buyer_properties WHERE organization_id = auth.get_user_organization_id()
      )
    )
  );

-- Action items: Users can see action items in their organization
CREATE POLICY "Users can view action items in own organization" ON action_items
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Gmail integrations: Users can see integrations in their organization
CREATE POLICY "Users can view Gmail integrations in own organization" ON gmail_integrations
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Email messages: Users can see emails in their organization
CREATE POLICY "Users can view email messages in own organization" ON email_messages
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Documents: Users can see documents in their organization
CREATE POLICY "Users can view documents in own organization" ON documents
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Net sheets: Users can see net sheets in their organization
CREATE POLICY "Users can view net sheets in own organization" ON net_sheets
  FOR ALL USING (
    buyer_property_id IN (
      SELECT id FROM buyer_properties WHERE organization_id = auth.get_user_organization_id()
    )
  );

-- Conversations: Users can see conversations in their organization
CREATE POLICY "Users can view conversations in own organization" ON conversations
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Messages: Users can see messages in their organization
CREATE POLICY "Users can view messages in own organization" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id = auth.get_user_organization_id()
    )
  );

-- System settings: Users can see settings in their organization
CREATE POLICY "Users can view system settings in own organization" ON system_settings
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- FUB sync log: Users can see sync logs in their organization
CREATE POLICY "Users can view FUB sync logs in own organization" ON fub_sync_log
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- =============================================================================
-- STEP 12: INSERT DEFAULT SYSTEM DATA
-- =============================================================================

-- Insert default step templates for common real estate workflows
INSERT INTO step_templates (organization_id, name, description, step_type, default_order, is_system_default, is_required, default_duration_days, business_rules) VALUES
-- Pre-escrow steps
(gen_random_uuid(), 'Initial Consultation', 'Meet with buyer to understand needs and budget', 'pre_escrow', 1, true, true, 1, '{"required_fields": ["buyer_needs", "price_range"], "completion_criteria": "consultation_completed"}'),
(gen_random_uuid(), 'Financial Preparation', 'Help buyer get pre-approved and gather documents', 'pre_escrow', 2, true, true, 7, '{"required_fields": ["pre_approval_amount", "proof_of_funds"], "completion_criteria": "pre_approval_obtained"}'),
(gen_random_uuid(), 'Property Search Setup', 'Create personalized MLS search criteria', 'pre_escrow', 3, true, true, 2, '{"required_fields": ["search_criteria", "preferred_areas"], "completion_criteria": "search_setup_complete"}'),
(gen_random_uuid(), 'Property Tours', 'Schedule and attend property showings', 'pre_escrow', 4, true, true, 14, '{"required_fields": ["showing_schedule"], "completion_criteria": "minimum_showings_attended"}'),
(gen_random_uuid(), 'Offer Strategy', 'Discuss and prepare offer strategy', 'pre_escrow', 5, true, true, 3, '{"required_fields": ["offer_strategy", "offer_terms"], "completion_criteria": "offer_strategy_defined"}'),
(gen_random_uuid(), 'Offer Submission', 'Submit offer and negotiate terms', 'pre_escrow', 6, true, true, 7, '{"required_fields": ["offer_amount", "offer_terms"], "completion_criteria": "offer_accepted"}'),

-- Escrow steps
(gen_random_uuid(), 'Open Escrow', 'Submit contract to escrow company', 'escrow', 1, true, true, 1, '{"required_fields": ["escrow_company", "escrow_number"], "completion_criteria": "escrow_opened"}'),
(gen_random_uuid(), 'Earnest Money', 'Ensure earnest money is deposited', 'escrow', 2, true, true, 3, '{"required_fields": ["earnest_money_amount", "deposit_receipt"], "completion_criteria": "earnest_money_deposited"}'),
(gen_random_uuid(), 'Inspections', 'Schedule and complete all inspections', 'escrow', 3, true, true, 10, '{"required_fields": ["inspection_reports", "repair_requests"], "completion_criteria": "inspections_completed"}'),
(gen_random_uuid(), 'Loan Approval', 'Secure final loan approval', 'escrow', 4, true, true, 14, '{"required_fields": ["loan_approval", "clear_to_close"], "completion_criteria": "loan_approved"}'),
(gen_random_uuid(), 'Final Walkthrough', 'Complete final property walkthrough', 'escrow', 5, true, true, 1, '{"required_fields": ["walkthrough_completed", "property_condition"], "completion_criteria": "walkthrough_satisfactory"}'),
(gen_random_uuid(), 'Closing', 'Complete closing and funding', 'escrow', 6, true, true, 1, '{"required_fields": ["closing_documents", "funding_complete"], "completion_criteria": "transaction_closed"}'),

-- Post-escrow steps
(gen_random_uuid(), 'Key Delivery', 'Deliver keys and property access', 'post_escrow', 1, true, true, 1, '{"required_fields": ["keys_delivered", "access_provided"], "completion_criteria": "buyer_has_access"}'),
(gen_random_uuid(), 'Follow-up', 'Follow up with buyer after closing', 'post_escrow', 2, true, true, 7, '{"required_fields": ["follow_up_completed", "buyer_satisfaction"], "completion_criteria": "buyer_satisfied"}'),
(gen_random_uuid(), 'Referral Request', 'Ask for referrals and reviews', 'post_escrow', 3, true, false, 14, '{"required_fields": ["referral_requested", "review_submitted"], "completion_criteria": "referral_received"}');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration creates the complete real estate platform database
-- All tables, enums, indexes, triggers, and RLS policies are now in place
-- The system is ready for use with proper multi-tenant isolation
