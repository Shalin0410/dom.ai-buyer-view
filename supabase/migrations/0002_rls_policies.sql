-- ===========================================
-- Row Level Security (RLS) Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_activities ENABLE ROW LEVEL SECURITY;

-- ====== AGENTS TABLE POLICIES ======
-- Allow public to view agent profiles
CREATE POLICY "Allow public select on agents" ON agents
  FOR SELECT USING (true);

-- Allow agents to update their own profile
CREATE POLICY "Agents can update their own profile" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

-- ====== BUYERS TABLE POLICIES ======
-- Allow public to check if email exists
CREATE POLICY "Allow public select on email" ON buyers
  FOR SELECT USING (true);

-- Buyers can view their own profile
CREATE POLICY "Buyers can view their own profile" ON buyers
  FOR SELECT USING (auth.uid() = id);

-- Buyers can update their own profile
CREATE POLICY "Buyers can update their own profile" ON buyers
  FOR UPDATE USING (auth.uid() = id);

-- ====== PROPERTIES TABLE POLICIES ======
-- Buyers can view properties they own
CREATE POLICY "Buyers can view their own properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.property_id = properties.id 
      AND buyer_properties.buyer_id = auth.uid()
    )
  );

-- Buyers can insert properties
CREATE POLICY "Buyers can insert properties" ON properties
  FOR INSERT WITH CHECK (true);

-- Buyers can update their own properties
CREATE POLICY "Buyers can update their own properties" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM buyer_properties 
      WHERE buyer_properties.property_id = properties.id 
      AND buyer_properties.buyer_id = auth.uid()
    )
  );

-- ====== BUYER_PROPERTIES TABLE POLICIES ======
-- Buyers can view their own property relationships
CREATE POLICY "Buyers can view their property relationships" ON buyer_properties
  FOR SELECT USING (buyer_id = auth.uid());

-- Buyers can create property relationships
CREATE POLICY "Buyers can create property relationships" ON buyer_properties
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Buyers can update their own property relationships
CREATE POLICY "Buyers can update their property relationships" ON buyer_properties
  FOR UPDATE USING (buyer_id = auth.uid());

-- Buyers can delete their own property relationships
CREATE POLICY "Buyers can delete their property relationships" ON buyer_properties
  FOR DELETE USING (buyer_id = auth.uid());

-- ====== PROPERTY_PHOTOS TABLE POLICIES ======
-- Buyers can view photos of their properties
CREATE POLICY "Buyers can view photos of their properties" ON property_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_properties bp
      JOIN properties p ON bp.property_id = p.id
      WHERE p.id = property_photos.property_id
      AND bp.buyer_id = auth.uid()
    )
  );

-- ====== PROPERTY_ACTIVITIES TABLE POLICIES ======
-- Buyers can view activities for their properties
CREATE POLICY "Buyers can view their property activities" ON property_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_properties bp
      WHERE bp.id = property_activities.buyer_property_id
      AND bp.buyer_id = auth.uid()
    )
  );

-- Buyers can create activities for their properties
CREATE POLICY "Buyers can create property activities" ON property_activities
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Buyers can update their own activities
CREATE POLICY "Buyers can update their activities" ON property_activities
  FOR UPDATE USING (created_by = auth.uid());

-- Buyers can delete their own activities
CREATE POLICY "Buyers can delete their activities" ON property_activities
  FOR DELETE USING (created_by = auth.uid());

-- ====== HELPER FUNCTIONS ======
-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.is_role(role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = role_name OR raw_user_meta_data->>'user_role' = role_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
