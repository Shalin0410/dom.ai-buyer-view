-- Create comprehensive buyer-property relationship system
-- This migration adds many-to-many relationships and enhanced property tracking

-- 1. Add missing columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'single_family' 
  CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family', 'other'));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add property-level status to track overall availability
ALTER TABLE properties ADD COLUMN IF NOT EXISTS overall_status TEXT DEFAULT 'available' 
  CHECK (overall_status IN ('available', 'under_contract', 'in_escrow', 'sold', 'withdrawn'));

-- 2. Create buyer_properties join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS buyer_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Buyer-specific tracking fields
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN (
    'interested',           -- Just added to list
    'viewing_scheduled',    -- Tour scheduled
    'viewed',              -- Has seen property
    'offer_submitted',     -- Made an offer
    'under_contract',      -- Offer accepted
    'in_escrow',          -- In escrow process
    'closed',             -- Purchase completed
    'withdrawn'           -- No longer interested
  )),
  
  buying_stage TEXT NOT NULL DEFAULT 'initial_research' CHECK (buying_stage IN (
    'initial_research',    -- Just browsing
    'active_search',      -- Actively looking
    'offer_negotiation',  -- Making offers
    'under_contract',     -- Deal in progress
    'closing'            -- Finalizing purchase
  )),
  
  action_required TEXT NOT NULL DEFAULT 'none' CHECK (action_required IN (
    'schedule_viewing',
    'submit_offer', 
    'review_documents',
    'inspection',
    'appraisal',
    'final_walkthrough',
    'none'
  )),
  
  -- Buyer-specific data
  notes TEXT,                                    -- Buyer's private notes
  purchase_price DECIMAL(12,2),                -- Their offer/purchase price
  offer_date TIMESTAMP WITH TIME ZONE,         -- When offer was made
  closing_date TIMESTAMP WITH TIME ZONE,       -- Expected/actual closing
  
  -- Tracking
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one relationship per buyer-property pair
  UNIQUE(buyer_id, property_id)
);

-- 3. Create property_activities table for timeline tracking
CREATE TABLE IF NOT EXISTS property_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_property_id UUID NOT NULL REFERENCES buyer_properties(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'note',        -- General note
    'viewing',     -- Scheduled/completed viewing
    'offer',       -- Offer related activity
    'document',    -- Document received/signed
    'milestone'    -- Important milestone reached
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES buyers(id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buyer_properties_buyer_id ON buyer_properties(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_property_id ON buyer_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_status ON buyer_properties(status);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_last_activity ON buyer_properties(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_property_activities_buyer_property_id ON property_activities(buyer_property_id);
CREATE INDEX IF NOT EXISTS idx_property_activities_created_at ON property_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_overall_status ON properties(overall_status);

-- 5. Create triggers to update property overall_status based on buyer_properties
CREATE OR REPLACE FUNCTION update_property_overall_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any buyer has this property in escrow or under contract
  IF EXISTS (
    SELECT 1 FROM buyer_properties 
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) 
    AND status IN ('in_escrow', 'closed')
  ) THEN
    UPDATE properties 
    SET overall_status = 'in_escrow' 
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  ELSIF EXISTS (
    SELECT 1 FROM buyer_properties 
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) 
    AND status = 'under_contract'
  ) THEN
    UPDATE properties 
    SET overall_status = 'under_contract' 
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  ELSE
    UPDATE properties 
    SET overall_status = 'available' 
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_property_status ON buyer_properties;
CREATE TRIGGER trigger_update_property_status
  AFTER INSERT OR UPDATE OR DELETE ON buyer_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_property_overall_status();

-- 6. Create function to update last_activity_at when activities are added
CREATE OR REPLACE FUNCTION update_buyer_property_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE buyer_properties 
  SET last_activity_at = NOW() 
  WHERE id = NEW.buyer_property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activity updates
DROP TRIGGER IF EXISTS trigger_update_activity_timestamp ON property_activities;
CREATE TRIGGER trigger_update_activity_timestamp
  AFTER INSERT ON property_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_property_activity();

-- 7. Enable RLS on new tables
ALTER TABLE buyer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_activities ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for buyer_properties
CREATE POLICY "Buyers can view their own property relationships" ON buyer_properties
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can insert their own property relationships" ON buyer_properties
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their own property relationships" ON buyer_properties
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can delete their own property relationships" ON buyer_properties
  FOR DELETE USING (buyer_id = auth.uid());

-- 9. Create RLS policies for property_activities
CREATE POLICY "Buyers can view activities for their properties" ON property_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.id = property_activities.buyer_property_id 
      AND buyer_properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert activities for their properties" ON property_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.id = property_activities.buyer_property_id 
      AND buyer_properties.buyer_id = auth.uid()
    )
  );

-- 10. Update properties RLS to hide escrowed properties from other buyers
DROP POLICY IF EXISTS "Properties are viewable by all authenticated users" ON properties;
CREATE POLICY "Properties are viewable based on availability" ON properties
  FOR SELECT USING (
    -- Show all available properties to everyone
    overall_status = 'available' 
    OR 
    -- Show escrowed/under contract properties only to buyers who have them
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.property_id = properties.id 
      AND buyer_properties.buyer_id = auth.uid()
    )
  );

-- Success message
SELECT 'Successfully created buyer-property relationship system with escrow visibility controls' as message;
