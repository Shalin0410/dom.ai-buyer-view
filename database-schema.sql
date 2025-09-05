-- =============================================================================
-- REAL ESTATE PLATFORM DATABASE SCHEMA - SUPABASE IMPLEMENTATION
-- =============================================================================
-- 
-- PURPOSE: This database powers a comprehensive real estate platform that:
-- - Manages buyer-agent relationships and property transactions
-- - Tracks the complete home buying journey from lead to closing
-- - Provides transparency and communication tools for all parties
-- - Integrates with CRM systems (FUB) and email (Gmail)
-- - Supports AI-powered chatbot assistance
--
-- TARGET USERS: Real estate agents, home buyers, and organizations
-- BUSINESS GOAL: Make home buying transparent and manageable
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS - Define controlled vocabularies for consistent data classification
-- =============================================================================

-- FUB (Follow Up Boss) CRM integration stages
CREATE TYPE fub_stage AS ENUM (
  'lead',                -- FUB ID: 2, orderWeight: 1000 - Initial lead capture, needs qualification
  'hot_prospect',        -- FUB ID: 12, orderWeight: 2000 - Engaged prospect, actively interested
  'nurture',            -- FUB ID: 13, orderWeight: 3000 - Long-term nurturing, building relationship
  'active_client',      -- FUB ID: 17, orderWeight: 4000 - Actively working with agent, viewing properties
  'pending',            -- FUB ID: 14, orderWeight: 5000 - Under contract, in escrow process
  'closed',             -- FUB ID: 8, orderWeight: 6000 - Deal completed, transaction finished
  'past_client',        -- FUB ID: 15, orderWeight: 7000 - Previous customer, potential for referrals
  'sphere',             -- FUB ID: 16, orderWeight: 8000 - Referral network, not actively buying
  'trash',              -- FUB ID: 11, orderWeight: 9000 - Unqualified leads, not a good fit
  'unresponsive'        -- FUB ID: 18, orderWeight: 10000 - Non-responsive contacts, need re-engagement
);

-- High-level phases of the real estate transaction process
CREATE TYPE timeline_phase AS ENUM (
  'pre_escrow',         -- Before contract: lead generation, property search, offers
  'escrow',            -- Under contract: inspections, loan approval, closing prep
  'post_escrow',       -- After closing: key delivery, follow-up, referrals
  'inactive'           -- No active transaction: sphere, past clients, unresponsive
);

-- Types of steps that can be created in timelines
CREATE TYPE step_type AS ENUM (
  'pre_escrow',         -- Steps before going under contract
  'escrow',            -- Steps during escrow period
  'post_escrow'        -- Steps after closing
);

-- Comprehensive action item types for both agents and buyers
CREATE TYPE action_item_type AS ENUM (
  -- ===== PRE-ESCROW ACTIONS =====
  
  -- Agent Pre-Escrow Actions
  'conduct_buyer_consultation',      -- Meet with buyer to understand needs and budget
  'connect_buyer_with_lender',       -- Refer buyer to trusted mortgage lenders
  'verify_proof_of_funds',           -- Request and verify buyer's financial documents
  'set_up_property_search',          -- Create personalized MLS search criteria
  'schedule_attend_showings',        -- Arrange and attend property tours with buyer
  'review_disclosures_reports',      -- Review seller disclosures with buyer
  'discuss_offer_strategy',          -- Advise on offer terms and negotiation strategy
  'prepare_offer_paperwork',         -- Prepare offer documents and contracts
  
  -- Buyer Pre-Escrow Actions
  'assess_finances_set_budget',      -- Review financial situation and set price range
  'get_pre_approval',                -- Obtain mortgage pre-approval from lender
  'gather_financial_documents',      -- Collect bank statements, tax returns, etc.
  'provide_proof_of_funds',          -- Submit financial documents to agent/lender
  'research_neighborhoods',          -- Research areas, schools, amenities
  'attend_property_showings',        -- Attend property tours and open houses
  'review_seller_disclosures',       -- Review property disclosures and reports
  
  -- ===== ESCROW ACTIONS =====
  
  -- Agent Escrow Actions
  'submit_contract_to_escrow',       -- Submit signed contract to escrow company
  'ensure_earnest_money_deposited',  -- Verify earnest money is received by escrow
  'review_preliminary_title_report', -- Review title report with buyer
  'schedule_all_inspections',        -- Arrange home, pest, and specialty inspections
  'negotiate_repairs_credits',       -- Negotiate repairs or credits with seller
  'schedule_final_walkthrough',      -- Schedule final property walkthrough
  'review_closing_disclosure',       -- Review final closing costs with buyer
  'coordinate_notary_signing',       -- Coordinate closing document signing
  'deliver_keys',                    -- Deliver keys to buyer after closing
  
  -- Buyer Escrow Actions
  'deposit_earnest_money',           -- Submit earnest money deposit to escrow
  'review_sign_escrow_instructions', -- Read and sign escrow instructions
  'schedule_complete_inspections',   -- Schedule and attend property inspections
  'secure_homeowners_insurance',     -- Obtain required homeowners insurance
  'remove_contingencies',            -- Sign contingency removal documents
  'wire_final_funds',                -- Wire remaining funds to escrow
  'attend_final_walkthrough',        -- Attend final property walkthrough
  'attend_closing_signing',          -- Attend closing appointment and sign documents
  
  -- Generic action type for custom tasks
  'other'                           -- Custom action items for flexibility
);

-- Property listing status
CREATE TYPE property_status AS ENUM (
  'active',             -- Available for purchase, actively marketed
  'under_contract',     -- Under contract but not yet closed
  'pending',           -- Sale pending, in escrow process
  'closed',            -- Sale completed, property sold
  'cancelled',         -- Contract cancelled, back on market
  'withdrawn'          -- Listing withdrawn from market
);

-- Document types
CREATE TYPE document_type AS ENUM (
  'timeline',           -- Escrow timeline documents
  'disclosure',         -- Property disclosure documents
  'contract',           -- Purchase contracts and addenda
  'inspection',         -- Property inspection reports
  'financial',          -- Financial documents and statements
  'other'               -- Other document types
);

-- Chatbot conversation status
CREATE TYPE conversation_status AS ENUM (
  'active',             -- Active conversation, ongoing
  'archived',           -- Archived conversation, no longer active
  'deleted'             -- Deleted conversation, removed from system
);

-- Chat message roles
CREATE TYPE message_role AS ENUM (
  'user',               -- Message from human user (agent or buyer)
  'assistant',          -- Message from AI chatbot
  'system'              -- System-generated message
);

-- =============================================================================
-- CORE ORGANIZATION & USER MANAGEMENT
-- =============================================================================

-- Multi-tenant organization structure
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_type TEXT,
  
  -- FUB Integration Settings
  fub_api_key TEXT,
  fub_account_id TEXT,
  
  -- Business Information
  business_address JSONB DEFAULT '{}',
  business_phone TEXT,
  business_email TEXT,
  website TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for organizations
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Unified person table supporting multiple roles
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fub_person_id INTEGER UNIQUE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  
  -- Role Management
  roles TEXT[] NOT NULL,
  primary_role TEXT NOT NULL,
  
  -- Agent-specific fields
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  
  -- Buyer relationship
  assigned_agent_id UUID REFERENCES persons(id),
  
  -- Contact tracking for buyers
  last_contact_date DATE,
  next_followup_date DATE,
  
  -- Status and sync tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_with_fub TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for persons
CREATE INDEX idx_persons_organization_id ON persons(organization_id);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_fub_person_id ON persons(fub_person_id);
CREATE INDEX idx_persons_primary_role ON persons(primary_role);
CREATE INDEX idx_persons_assigned_agent_id ON persons(assigned_agent_id);
CREATE INDEX idx_persons_organization_role ON persons(organization_id, primary_role);
CREATE INDEX idx_persons_agent_buyers ON persons(assigned_agent_id, primary_role);

-- Separate buyer profile information
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL UNIQUE REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Financial Information
  price_min INTEGER,
  price_max INTEGER,
  budget_approved BOOLEAN DEFAULT FALSE,
  pre_approval_amount NUMERIC,
  pre_approval_expiry DATE,
  down_payment_amount NUMERIC,
  
  -- Preferences
  buyer_needs TEXT,
  preferred_areas TEXT[],
  property_type_preferences TEXT[],
  must_have_features TEXT[],
  nice_to_have_features TEXT[],
  
  -- Timeline preferences
  ideal_move_in_date DATE,
  urgency_level TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for buyer_profiles
CREATE INDEX idx_buyer_profiles_person_id ON buyer_profiles(person_id);
CREATE INDEX idx_buyer_profiles_price_range ON buyer_profiles(price_min, price_max);
CREATE INDEX idx_buyer_profiles_pre_approval_expiry ON buyer_profiles(pre_approval_expiry);

-- =============================================================================
-- CUSTOMIZABLE STEP SYSTEM
-- =============================================================================

-- Templates for creating flexible step definitions
CREATE TABLE step_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Step Definition
  name TEXT NOT NULL,
  description TEXT,
  step_type step_type NOT NULL,
  default_order INTEGER NOT NULL,
  
  -- Template properties
  is_system_default BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Default settings for new instances
  default_duration_days INTEGER,
  
  -- Business rules
  business_rules JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for step_templates
CREATE INDEX idx_step_templates_organization_id ON step_templates(organization_id);
CREATE INDEX idx_step_templates_step_type ON step_templates(step_type);
CREATE INDEX idx_step_templates_org_type_order ON step_templates(organization_id, step_type, default_order);
CREATE INDEX idx_step_templates_is_active ON step_templates(is_active);

-- =============================================================================
-- PROPERTY MANAGEMENT
-- =============================================================================

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  listing_agent_id UUID REFERENCES persons(id),
  
  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  coordinates JSONB DEFAULT '{}',
  
  -- Property Details
  listing_price NUMERIC NOT NULL,
  purchase_price NUMERIC,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC NOT NULL,
  square_feet INTEGER,
  property_type TEXT NOT NULL,
  year_built INTEGER,
  lot_size NUMERIC,
  
  -- Listing Information
  status property_status NOT NULL,
  mls_number TEXT UNIQUE,
  listing_url TEXT,
  description TEXT,
  days_on_market INTEGER,
  
  -- Flexible additional data
  features JSONB DEFAULT '{}',
  schools JSONB DEFAULT '{}',
  neighborhood_info JSONB DEFAULT '{}',
  
  -- Activity tracking
  has_active_interest BOOLEAN DEFAULT FALSE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- FUB Integration
  fub_property_id INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for properties
CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_mls_number ON properties(mls_number);
CREATE INDEX idx_properties_city_state ON properties(city, state);
CREATE INDEX idx_properties_price_beds_baths ON properties(listing_price, bedrooms, bathrooms);
CREATE INDEX idx_properties_has_active_interest ON properties(has_active_interest);
CREATE INDEX idx_properties_last_activity_at ON properties(last_activity_at);

-- Property photos
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for property_photos
CREATE INDEX idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX idx_property_photos_property_order ON property_photos(property_id, display_order);

-- =============================================================================
-- BUYER-PROPERTY RELATIONSHIPS & TIMELINES
-- =============================================================================

-- Junction table linking buyers to properties
CREATE TABLE buyer_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type TEXT DEFAULT 'home_buyer',
  interest_level TEXT,
  
  -- Offer Information
  offer_amount NUMERIC,
  offer_date DATE,
  offer_status TEXT,
  
  -- Key timeline dates
  contract_date DATE,
  escrow_date DATE,
  expected_closing_date DATE,
  actual_closing_date DATE,
  
  -- Status tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(buyer_id, property_id)
);

-- Create indexes for buyer_properties
CREATE INDEX idx_buyer_properties_organization_id ON buyer_properties(organization_id);
CREATE INDEX idx_buyer_properties_buyer_id ON buyer_properties(buyer_id);
CREATE INDEX idx_buyer_properties_property_id ON buyer_properties(property_id);
CREATE INDEX idx_buyer_properties_buyer_active ON buyer_properties(buyer_id, is_active);

-- Timeline tracking for each buyer-property relationship
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_property_id UUID NOT NULL UNIQUE REFERENCES buyer_properties(id) ON DELETE CASCADE,
  
  -- Current Status
  current_phase timeline_phase NOT NULL,
  current_fub_stage fub_stage NOT NULL,
  stage_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Customization options
  is_custom_timeline BOOLEAN DEFAULT FALSE,
  timeline_name TEXT,
  timeline_notes TEXT,
  auto_advance_enabled BOOLEAN DEFAULT TRUE,
  
  -- Flexible data storage
  custom_data JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for timelines
CREATE INDEX idx_timelines_buyer_property_id ON timelines(buyer_property_id);
CREATE INDEX idx_timelines_current_phase ON timelines(current_phase);
CREATE INDEX idx_timelines_current_fub_stage ON timelines(current_fub_stage);
CREATE INDEX idx_timelines_stage_last_updated ON timelines(stage_last_updated);

-- Individual steps within each timeline
CREATE TABLE timeline_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  
  -- Step reference
  step_template_id UUID REFERENCES step_templates(id),
  custom_step_name TEXT,
  
  -- Step properties
  step_type step_type NOT NULL,
  step_order INTEGER NOT NULL,
  
  -- Status & Progress
  is_completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  due_date DATE,
  notes TEXT,
  completion_notes TEXT,
  
  -- Flexible step data
  step_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for timeline_steps
CREATE INDEX idx_timeline_steps_timeline_id ON timeline_steps(timeline_id);
CREATE INDEX idx_timeline_steps_step_template_id ON timeline_steps(step_template_id);
CREATE INDEX idx_timeline_steps_timeline_order ON timeline_steps(timeline_id, step_order);
CREATE INDEX idx_timeline_steps_step_type ON timeline_steps(step_type);
CREATE INDEX idx_timeline_steps_due_date ON timeline_steps(due_date);

-- Audit trail for timeline changes
CREATE TABLE timeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  
  -- Change details
  changed_from timeline_phase,
  changed_to timeline_phase NOT NULL,
  fub_stage_from fub_stage,
  fub_stage_to fub_stage NOT NULL,
  
  -- Context and attribution
  changed_by UUID REFERENCES persons(id),
  change_reason TEXT,
  system_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for timeline_history
CREATE INDEX idx_timeline_history_timeline_id ON timeline_history(timeline_id);
CREATE INDEX idx_timeline_history_changed_by ON timeline_history(changed_by);
CREATE INDEX idx_timeline_history_created_at ON timeline_history(created_at);

-- =============================================================================
-- ACTION ITEMS
-- =============================================================================

-- Comprehensive action item system
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role-based assignment
  assigned_agent_id UUID REFERENCES persons(id),
  assigned_buyer_id UUID REFERENCES persons(id),
  
  -- Context
  buyer_property_id UUID REFERENCES buyer_properties(id),
  timeline_step_id UUID REFERENCES timeline_steps(id),
  
  -- Action details
  action_type action_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status and priority
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_date DATE,
  
  -- Progress tracking
  item_order INTEGER,
  completion_notes TEXT,
  created_by UUID REFERENCES persons(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for action_items
CREATE INDEX idx_action_items_organization_id ON action_items(organization_id);
CREATE INDEX idx_action_items_assigned_agent_id ON action_items(assigned_agent_id);
CREATE INDEX idx_action_items_assigned_buyer_id ON action_items(assigned_buyer_id);
CREATE INDEX idx_action_items_buyer_property_id ON action_items(buyer_property_id);
CREATE INDEX idx_action_items_timeline_step_id ON action_items(timeline_step_id);
CREATE INDEX idx_action_items_action_type ON action_items(action_type);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- =============================================================================
-- GMAIL INTEGRATION
-- =============================================================================

-- Gmail OAuth connection per agent
CREATE TABLE gmail_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL UNIQUE REFERENCES persons(id) ON DELETE CASCADE,
  
  -- Gmail connection
  gmail_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Sync settings
  auto_sync BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for gmail_integrations
CREATE INDEX idx_gmail_integrations_organization_id ON gmail_integrations(organization_id);
CREATE INDEX idx_gmail_integrations_agent_id ON gmail_integrations(agent_id);
CREATE INDEX idx_gmail_integrations_gmail_user_id ON gmail_integrations(gmail_user_id);

-- Email messages synced from Gmail
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_property_id UUID REFERENCES buyer_properties(id),
  
  -- Gmail metadata
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT NOT NULL,
  recipients TEXT[],
  
  -- Content
  body_text TEXT,
  body_html TEXT,
  
  -- Classification
  message_type TEXT DEFAULT 'general',
  importance TEXT DEFAULT 'normal',
  
  -- Processing status
  is_processed BOOLEAN DEFAULT FALSE,
  
  -- Flexible extracted data
  extracted_data JSONB DEFAULT '{}',
  
  gmail_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for email_messages
CREATE INDEX idx_email_messages_organization_id ON email_messages(organization_id);
CREATE INDEX idx_email_messages_buyer_property_id ON email_messages(buyer_property_id);
CREATE INDEX idx_email_messages_gmail_message_id ON email_messages(gmail_message_id);
CREATE INDEX idx_email_messages_gmail_thread_id ON email_messages(gmail_thread_id);
CREATE INDEX idx_email_messages_message_type ON email_messages(message_type);
CREATE INDEX idx_email_messages_gmail_date ON email_messages(gmail_date);

-- =============================================================================
-- DOCUMENT MANAGEMENT
-- =============================================================================

-- Document storage and management
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_property_id UUID REFERENCES buyer_properties(id),
  
  -- Document metadata
  title TEXT NOT NULL,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_provider TEXT DEFAULT 'supabase',
  
  -- Processing status
  extraction_status TEXT DEFAULT 'pending',
  
  -- All processed data
  processed_data JSONB DEFAULT '{}',
  
  -- Access control
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'agent_only',
  
  -- Upload metadata
  uploaded_by UUID REFERENCES persons(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_buyer_property_id ON documents(buyer_property_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_extraction_status ON documents(extraction_status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================================================
-- FINANCIAL CALCULATIONS
-- =============================================================================

-- Property financial calculations and net sheets
CREATE TABLE net_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_property_id UUID NOT NULL REFERENCES buyer_properties(id) ON DELETE CASCADE,
  
  -- Core financials
  listing_price NUMERIC NOT NULL,
  purchase_price NUMERIC,
  down_payment_percentage NUMERIC DEFAULT 20,
  
  -- Loan details
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  loan_term INTEGER DEFAULT 30,
  
  -- Monthly payments
  principal_interest NUMERIC,
  property_tax_monthly NUMERIC,
  insurance_monthly NUMERIC,
  hoa_fees_monthly NUMERIC,
  total_monthly_payment NUMERIC,
  
  -- Closing costs
  closing_cost_estimate NUMERIC,
  earnest_money NUMERIC,
  cash_to_close NUMERIC,
  
  -- Comparisons
  monthly_savings_vs_rent NUMERIC,
  
  -- Market data
  market_data JSONB DEFAULT '{}',
  
  is_current BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for net_sheets
CREATE INDEX idx_net_sheets_buyer_property_id ON net_sheets(buyer_property_id);
CREATE INDEX idx_net_sheets_buyer_property_current ON net_sheets(buyer_property_id, is_current);

-- =============================================================================
-- CHATBOT SYSTEM
-- =============================================================================

-- Chatbot conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  title TEXT,
  status conversation_status NOT NULL DEFAULT 'active',
  
  -- All conversation metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Individual messages within conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  role message_role NOT NULL,
  content TEXT NOT NULL,
  
  -- AI tracking
  sources JSONB DEFAULT '[]',
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

-- System configuration
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Setting definition
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL,
  description TEXT,
  
  -- Setting properties
  is_system_setting BOOLEAN DEFAULT FALSE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, setting_key)
);

-- Create indexes for system_settings
CREATE INDEX idx_system_settings_organization_id ON system_settings(organization_id);

-- FUB sync logging
CREATE TABLE fub_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Sync classification
  sync_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  fub_entity_id INTEGER,
  
  -- Sync status
  sync_status TEXT NOT NULL,
  sync_direction TEXT NOT NULL,
  
  -- All sync details
  sync_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fub_sync_log
CREATE INDEX idx_fub_sync_log_organization_id ON fub_sync_log(organization_id);
CREATE INDEX idx_fub_sync_log_sync_type ON fub_sync_log(sync_type);
CREATE INDEX idx_fub_sync_log_sync_status ON fub_sync_log(sync_status);
CREATE INDEX idx_fub_sync_log_created_at ON fub_sync_log(created_at);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
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
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Create a function to get the current user's organization_id
CREATE OR REPLACE FUNCTION auth.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (auth.jwt() ->> 'organization_id')::UUID;
END;
$$;

-- Organizations: Users can only access their own organization
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (id = auth.get_user_organization_id());

CREATE POLICY "Users can update their own organization" ON organizations
  FOR UPDATE USING (id = auth.get_user_organization_id());

-- Persons: Users can only access persons in their organization
CREATE POLICY "Users can view persons in their organization" ON persons
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Buyer profiles: Users can only access profiles in their organization
CREATE POLICY "Users can view buyer profiles in their organization" ON buyer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM persons 
      WHERE persons.id = buyer_profiles.person_id 
      AND persons.organization_id = auth.get_user_organization_id()
    )
  );

-- Step templates: Users can only access templates in their organization
CREATE POLICY "Users can view step templates in their organization" ON step_templates
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Properties: Users can only access properties in their organization
CREATE POLICY "Users can view properties in their organization" ON properties
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Property photos: Users can only access photos for properties in their organization
CREATE POLICY "Users can view property photos in their organization" ON property_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_photos.property_id 
      AND properties.organization_id = auth.get_user_organization_id()
    )
  );

-- Buyer properties: Users can only access relationships in their organization
CREATE POLICY "Users can view buyer properties in their organization" ON buyer_properties
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Timelines: Users can only access timelines for relationships in their organization
CREATE POLICY "Users can view timelines in their organization" ON timelines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.id = timelines.buyer_property_id 
      AND buyer_properties.organization_id = auth.get_user_organization_id()
    )
  );

-- Timeline steps: Users can only access steps for timelines in their organization
CREATE POLICY "Users can view timeline steps in their organization" ON timeline_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM timelines 
      JOIN buyer_properties ON buyer_properties.id = timelines.buyer_property_id
      WHERE timelines.id = timeline_steps.timeline_id 
      AND buyer_properties.organization_id = auth.get_user_organization_id()
    )
  );

-- Timeline history: Users can only access history for timelines in their organization
CREATE POLICY "Users can view timeline history in their organization" ON timeline_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM timelines 
      JOIN buyer_properties ON buyer_properties.id = timelines.buyer_property_id
      WHERE timelines.id = timeline_history.timeline_id 
      AND buyer_properties.organization_id = auth.get_user_organization_id()
    )
  );

-- Action items: Users can only access action items in their organization
CREATE POLICY "Users can view action items in their organization" ON action_items
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Gmail integrations: Users can only access integrations in their organization
CREATE POLICY "Users can view gmail integrations in their organization" ON gmail_integrations
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Email messages: Users can only access email messages in their organization
CREATE POLICY "Users can view email messages in their organization" ON email_messages
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Documents: Users can only access documents in their organization
CREATE POLICY "Users can view documents in their organization" ON documents
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Net sheets: Users can only access net sheets for relationships in their organization
CREATE POLICY "Users can view net sheets in their organization" ON net_sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.id = net_sheets.buyer_property_id 
      AND buyer_properties.organization_id = auth.get_user_organization_id()
    )
  );

-- Conversations: Users can only access conversations in their organization
CREATE POLICY "Users can view conversations in their organization" ON conversations
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- Messages: Users can only access messages for conversations in their organization
CREATE POLICY "Users can view messages in their organization" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.organization_id = auth.get_user_organization_id()
    )
  );

-- System settings: Users can only access settings in their organization
CREATE POLICY "Users can view system settings in their organization" ON system_settings
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- FUB sync log: Users can only access sync logs in their organization
CREATE POLICY "Users can view fub sync logs in their organization" ON fub_sync_log
  FOR ALL USING (organization_id = auth.get_user_organization_id());

-- =============================================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- =============================================================================

-- Insert a sample organization
INSERT INTO organizations (name, organization_type, business_email, is_active)
VALUES ('Demo Real Estate Company', 'brokerage', 'admin@demorealty.com', true);

-- Get the organization ID for sample data
-- Note: In production, you would handle this differently
-- This is just for demonstration purposes