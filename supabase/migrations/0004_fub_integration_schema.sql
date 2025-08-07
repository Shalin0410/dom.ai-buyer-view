-- ===========================================
-- FUB (Follow Up Boss) Integration Schema
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. ENHANCE EXISTING TABLES FOR FUB
-- ===========================================

-- Enhance agents table for FUB users integration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS fub_user_id INTEGER UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Agent' CHECK (role IN ('Agent', 'Broker', 'Lender', 'Admin', 'Owner'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS team_leader_of INTEGER[];
ALTER TABLE agents ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'America/New_York';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_synced_with_fub TIMESTAMP WITH TIME ZONE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS fub_sync_enabled BOOLEAN DEFAULT FALSE;

-- Enhance buyers table for FUB people integration
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS fub_person_id INTEGER UNIQUE;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS suffix TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS source TEXT; -- Lead source
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS address JSONB; -- Full address object
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS emails JSONB; -- Array of email objects
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS phones JSONB; -- Array of phone objects
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS social_profiles JSONB; -- Social media profiles
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS lead_stage TEXT DEFAULT 'new';
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'active';
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES agents(id);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS next_touch_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS last_synced_with_fub TIMESTAMP WITH TIME ZONE;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS fub_sync_enabled BOOLEAN DEFAULT FALSE;

-- Enhance properties table for FUB property integration
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fub_property_id INTEGER UNIQUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS external_id TEXT; -- MLS or other external ID
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_sub_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_agent_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_agent_phone TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_agent_email TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_office TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hoa_fee DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_tax DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS coordinates JSONB; -- {lat, lng}
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features JSONB; -- Array of features
ALTER TABLE properties ADD COLUMN IF NOT EXISTS schools JSONB; -- School information
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood_info JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_synced_with_fub TIMESTAMP WITH TIME ZONE;

-- ===========================================
-- 2. NEW TABLES FOR FUB INTEGRATION
-- ===========================================

-- FUB Teams table
CREATE TABLE IF NOT EXISTS fub_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_team_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Team Members junction table
CREATE TABLE IF NOT EXISTS fub_team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES fub_teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, agent_id)
);

-- FUB Pipelines table
CREATE TABLE IF NOT EXISTS fub_pipelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_pipeline_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Stages table
CREATE TABLE IF NOT EXISTS fub_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_stage_id INTEGER UNIQUE NOT NULL,
  pipeline_id UUID REFERENCES fub_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Deals table (enhances buyer_properties)
CREATE TABLE IF NOT EXISTS fub_deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_deal_id INTEGER UNIQUE NOT NULL,
  buyer_property_id UUID REFERENCES buyer_properties(id) ON DELETE CASCADE,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES fub_pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES fub_stages(id) ON DELETE SET NULL,
  deal_type TEXT CHECK (deal_type IN ('buyer', 'seller', 'rental')),
  deal_value DECIMAL(12,2),
  commission_rate DECIMAL(5,4),
  estimated_commission DECIMAL(12,2),
  expected_close_date DATE,
  actual_close_date DATE,
  deal_status TEXT DEFAULT 'active' CHECK (deal_status IN ('active', 'closed', 'cancelled')),
  deal_custom_fields JSONB, -- Custom fields from FUB
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Events/Activities table (enhances property_activities)
CREATE TABLE IF NOT EXISTS fub_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_event_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES fub_deals(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- inquiry, property_view, registration, etc.
  event_subtype TEXT,
  title TEXT NOT NULL,
  description TEXT,
  event_data JSONB, -- Additional event-specific data
  happened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Notes table
CREATE TABLE IF NOT EXISTS fub_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_note_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES fub_deals(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  note_type TEXT DEFAULT 'general',
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Tasks table
CREATE TABLE IF NOT EXISTS fub_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_task_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES fub_deals(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  task_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Appointments table
CREATE TABLE IF NOT EXISTS fub_appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_appointment_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES fub_deals(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  appointment_type_id INTEGER,
  appointment_outcome_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Calls table
CREATE TABLE IF NOT EXISTS fub_calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_call_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  phone_number TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  duration INTEGER, -- in seconds
  status TEXT, -- completed, missed, etc.
  recording_url TEXT,
  notes TEXT,
  called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Text Messages table
CREATE TABLE IF NOT EXISTS fub_text_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_message_id INTEGER UNIQUE NOT NULL,
  person_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  phone_number TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  message_body TEXT,
  status TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Action Plans table
CREATE TABLE IF NOT EXISTS fub_action_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_action_plan_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Action Plan People junction table (who is assigned to which action plan)
CREATE TABLE IF NOT EXISTS fub_action_plan_people (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_assignment_id INTEGER UNIQUE NOT NULL,
  action_plan_id UUID REFERENCES fub_action_plans(id) ON DELETE CASCADE,
  person_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Custom Fields table
CREATE TABLE IF NOT EXISTS fub_custom_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fub_field_id INTEGER UNIQUE NOT NULL,
  entity_type TEXT NOT NULL, -- 'person', 'deal', etc.
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'dropdown', etc.
  field_options JSONB, -- For dropdown options
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. SYNC AND WEBHOOK TABLES
-- ===========================================

-- FUB Sync Log table for tracking sync operations
CREATE TABLE IF NOT EXISTS fub_sync_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'person', 'deal', 'event', etc.
  entity_id TEXT NOT NULL, -- Local UUID or FUB ID
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  direction TEXT NOT NULL CHECK (direction IN ('to_fub', 'from_fub')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retry')),
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- FUB Webhook Events table for handling incoming webhooks
CREATE TABLE IF NOT EXISTS fub_webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FUB Configuration table
CREATE TABLE IF NOT EXISTS fub_configuration (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key TEXT, -- Encrypted FUB API key
  webhook_url TEXT,
  webhook_secret TEXT,
  sync_enabled BOOLEAN DEFAULT FALSE,
  sync_frequency_minutes INTEGER DEFAULT 15,
  default_pipeline_id UUID REFERENCES fub_pipelines(id),
  default_stage_id UUID REFERENCES fub_stages(id),
  last_full_sync TIMESTAMP WITH TIME ZONE,
  sync_settings JSONB, -- Additional sync configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 4. INDEXES FOR PERFORMANCE
-- ===========================================

-- FUB-specific indexes
CREATE INDEX IF NOT EXISTS idx_agents_fub_user_id ON agents(fub_user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_fub_person_id ON buyers(fub_person_id);
CREATE INDEX IF NOT EXISTS idx_properties_fub_property_id ON properties(fub_property_id);
CREATE INDEX IF NOT EXISTS idx_fub_deals_person_id ON fub_deals(person_id);
CREATE INDEX IF NOT EXISTS idx_fub_deals_property_id ON fub_deals(property_id);
CREATE INDEX IF NOT EXISTS idx_fub_deals_agent_id ON fub_deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_fub_deals_stage_id ON fub_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_fub_events_person_id ON fub_events(person_id);
CREATE INDEX IF NOT EXISTS idx_fub_events_property_id ON fub_events(property_id);
CREATE INDEX IF NOT EXISTS idx_fub_events_happened_at ON fub_events(happened_at);
CREATE INDEX IF NOT EXISTS idx_fub_notes_person_id ON fub_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_fub_tasks_assigned_to ON fub_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fub_tasks_due_date ON fub_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_fub_appointments_agent_id ON fub_appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_fub_appointments_start_time ON fub_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_fub_sync_log_entity ON fub_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fub_sync_log_status ON fub_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_fub_webhook_events_processed ON fub_webhook_events(processed);

-- ===========================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ===========================================

-- Create triggers for new tables
CREATE TRIGGER update_fub_teams_updated_at 
  BEFORE UPDATE ON fub_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_pipelines_updated_at 
  BEFORE UPDATE ON fub_pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_stages_updated_at 
  BEFORE UPDATE ON fub_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_deals_updated_at 
  BEFORE UPDATE ON fub_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_notes_updated_at 
  BEFORE UPDATE ON fub_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_tasks_updated_at 
  BEFORE UPDATE ON fub_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_appointments_updated_at 
  BEFORE UPDATE ON fub_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_action_plans_updated_at 
  BEFORE UPDATE ON fub_action_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_action_plan_people_updated_at 
  BEFORE UPDATE ON fub_action_plan_people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_custom_fields_updated_at 
  BEFORE UPDATE ON fub_custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fub_configuration_updated_at 
  BEFORE UPDATE ON fub_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();