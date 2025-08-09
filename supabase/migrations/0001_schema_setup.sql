-- ===========================================
-- Database Schema Setup
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    CREATE TYPE property_status AS ENUM (
      'researching', 'viewing', 'offer_submitted', 'under_contract', 'in_escrow', 'closed', 'withdrawn'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_buying_stage') THEN
    CREATE TYPE property_buying_stage AS ENUM (
      'initial_research', 'active_search', 'offer_negotiation', 'under_contract', 'closing'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_action_required') THEN
    CREATE TYPE property_action_required AS ENUM (
      'schedule_viewing', 'submit_offer', 'review_documents', 'inspection', 'appraisal', 'final_walkthrough', 'none'
    );
  END IF;
END $$;

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buyers table
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  listing_price DECIMAL(12,2) NOT NULL,
  purchase_price DECIMAL(12,2),
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL,
  square_feet INTEGER,
  lot_size DECIMAL(10,2),
  year_built INTEGER,
  property_type TEXT NOT NULL CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family', 'other')),
  status TEXT NOT NULL CHECK (status IN ('researching', 'viewing', 'offer_submitted', 'under_contract', 'in_escrow', 'closed', 'withdrawn')),
  buying_stage TEXT NOT NULL CHECK (buying_stage IN ('initial_research', 'active_search', 'offer_negotiation', 'under_contract', 'closing')),
  action_required TEXT NOT NULL DEFAULT 'none' CHECK (action_required IN ('schedule_viewing', 'submit_offer', 'review_documents', 'inspection', 'appraisal', 'final_walkthrough', 'none')),
  mls_number TEXT UNIQUE,
  listing_url TEXT,
  notes TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required columns exist even if "properties" table pre-existed with a different shape
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties') THEN
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS zip_code TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_price DECIMAL(12,2)';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2)';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1)';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_feet INTEGER';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size DECIMAL(10,2)';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS buying_stage TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS action_required TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS mls_number TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_url TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS notes TEXT';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ';
  END IF;
END $$;

-- Create buyer_properties join table
CREATE TABLE IF NOT EXISTS buyer_properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status property_status NOT NULL DEFAULT 'researching',
  buying_stage property_buying_stage NOT NULL DEFAULT 'initial_research',
  action_required property_action_required NOT NULL DEFAULT 'none',
  notes TEXT,
  purchase_price DECIMAL(12,2),
  offer_date TIMESTAMP WITH TIME ZONE,
  closing_date TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, property_id)
);

-- Create property_photos table
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_activities table
CREATE TABLE IF NOT EXISTS property_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_property_id UUID NOT NULL REFERENCES buyer_properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'viewing', 'offer', 'document', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_buyer_id ON properties((1)) WHERE false;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'buying_stage'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_properties_buying_stage ON properties(buying_stage);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'last_activity_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_properties_last_activity ON properties(last_activity_at);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_order ON property_photos(property_id, "order");
CREATE INDEX IF NOT EXISTS idx_buyer_properties_buyer_id ON buyer_properties(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_property_id ON buyer_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_status ON buyer_properties(status);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_last_activity ON buyer_properties(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_property_activities_buyer_property_id ON property_activities(buyer_property_id);
CREATE INDEX IF NOT EXISTS idx_property_activities_created_at ON property_activities(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_agents_updated_at'
  ) THEN
    CREATE TRIGGER update_agents_updated_at 
      BEFORE UPDATE ON agents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_buyers_updated_at'
  ) THEN
    CREATE TRIGGER update_buyers_updated_at 
      BEFORE UPDATE ON buyers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at 
      BEFORE UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_property_photos_updated_at'
  ) THEN
    CREATE TRIGGER update_property_photos_updated_at 
      BEFORE UPDATE ON property_photos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
