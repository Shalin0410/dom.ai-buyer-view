-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
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
  mls_number TEXT,
  listing_url TEXT,
  notes TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_photos table
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'viewing', 'offer', 'document', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_buyer_id ON properties(buyer_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_buying_stage ON properties(buying_stage);
CREATE INDEX IF NOT EXISTS idx_properties_last_activity ON properties(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_order ON property_photos(property_id, "order");
CREATE INDEX IF NOT EXISTS idx_property_activities_property_id ON property_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_property_activities_created_at ON property_activities(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_photos_updated_at BEFORE UPDATE ON property_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties
CREATE POLICY "Buyers can view their own properties" ON properties
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can insert their own properties" ON properties
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their own properties" ON properties
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can delete their own properties" ON properties
  FOR DELETE USING (buyer_id = auth.uid());

-- Create RLS policies for property_photos
CREATE POLICY "Buyers can view photos of their properties" ON property_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_photos.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert photos for their properties" ON property_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_photos.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update photos of their properties" ON property_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_photos.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can delete photos of their properties" ON property_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_photos.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

-- Create RLS policies for property_activities
CREATE POLICY "Buyers can view activities of their properties" ON property_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_activities.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert activities for their properties" ON property_activities
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_activities.property_id 
      AND properties.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update their own activities" ON property_activities
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Buyers can delete their own activities" ON property_activities
  FOR DELETE USING (created_by = auth.uid());
