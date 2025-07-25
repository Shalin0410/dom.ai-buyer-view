-- ===========================================
-- Seed Data
-- ===========================================

-- Clean up existing test data (if any)
TRUNCATE TABLE property_activities, property_photos, buyer_properties, properties, buyers, agents CASCADE;

-- Insert test agents (without user_id as it should be set by auth system)
INSERT INTO agents (id, first_name, last_name, email, phone, created_at, updated_at)
VALUES 
  ('e5a1231f-9a70-484c-bca1-def78a0d9c08', 'John', 'Smith', 'john.smith@example.com', '+14155550123', NOW(), NOW()),
  ('f6b23420-9a70-484c-bca1-def78a0d9c09', 'Sarah', 'Johnson', 'sarah.j@example.com', '+14155550124', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test buyers - Only insert if corresponding user exists in auth.users
-- First, ensure the agents exist
WITH agent_check AS (
  SELECT id FROM agents WHERE id IN (
    'e5a1231f-9a70-484c-bca1-def78a0d9c08'::uuid, 
    'f6b23420-9a70-484c-bca1-def78a0d9c09'::uuid
  )
),
-- Get existing users from auth.users
existing_users AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email IN ('shalinshah1998@gmail.com', 'shalin41098@yahoo.com.sg')
)
INSERT INTO buyers (id, email, first_name, last_name, agent_id, created_at, updated_at)
SELECT 
  eu.id,
  data.email,
  data.first_name,
  data.last_name,
  data.agent_id,
  NOW(),
  NOW()
FROM (
  VALUES 
    ('shalinshah1998@gmail.com', 'Shalin', 'Shah', 'e5a1231f-9a70-484c-bca1-def78a0d9c08'::uuid),
    ('shalin41098@yahoo.com.sg', 'Emma', 'Wilson', 'f6b23420-9a70-484c-bca1-def78a0d9c09'::uuid)
) AS data(email, first_name, last_name, agent_id)
JOIN existing_users eu ON eu.email = data.email
LEFT JOIN buyers b ON b.id = eu.id
WHERE b.id IS NULL
ON CONFLICT (id) 
DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  agent_id = EXCLUDED.agent_id,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Insert sample properties
WITH inserted_properties AS (
  INSERT INTO properties (
    id, address, city, state, zip_code, 
    listing_price, purchase_price, bedrooms, bathrooms, 
    square_feet, lot_size, year_built, property_type, 
    status, buying_stage, action_required, mls_number, 
    listing_url, notes, last_activity_at, created_at, updated_at
  )
  SELECT 
    data.id::uuid,
    data.address, data.city, data.state, data.zip_code,
    data.listing_price, data.purchase_price, data.bedrooms, data.bathrooms,
    data.square_feet, data.lot_size, data.year_built, data.property_type,
    data.status, data.buying_stage, data.action_required, data.mls_number,
    data.listing_url, data.notes, NOW(), NOW(), NOW()
  FROM (
    VALUES 
      (
        'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
        '123 Main St', 'San Francisco', 'CA', '94105',
        1250000, 1200000, 3, 2.5, 2200, 5000, 1995, 'single_family',
        'under_contract', 'under_contract', 'review_documents', 'SF12345678',
        'https://example.com/listings/sf12345678', 'Great neighborhood, needs some updates'
      ),
      (
        'b2c3d4e5-f6a7-8901-2345-678901234567', 
        '456 Oak Ave', 'San Francisco', 'CA', '94110',
        1850000, 1800000, 4, 3, 2800, 6500, 2010, 'townhouse',
        'researching', 'initial_research', 'schedule_viewing', 'SF87654321',
        'https://example.com/listings/sf87654321', 'Modern townhouse with roof deck'
      ),
      (
        'c3d4e5f6-a7b8-9012-3456-789012345678', 
        '789 Pine St', 'Oakland', 'CA', '94612',
        895000, 880000, 2, 1, 1200, 3000, 1985, 'condo',
        'in_escrow', 'closing', 'final_walkthrough', 'OK12345678',
        'https://example.com/listings/ok12345678', 'Condo with great views'
      )
  ) AS data(id, address, city, state, zip_code, listing_price, purchase_price, bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, status, buying_stage, action_required, mls_number, listing_url, notes)
  LEFT JOIN properties p ON p.id = data.id::uuid
  WHERE p.id IS NULL
  RETURNING id, mls_number
),
-- Create buyer-property relationships
buyer_property_data AS (
  SELECT 
    data.property_id::uuid,
    b.id as buyer_id,
    data.status::property_status,
    data.buying_stage::property_buying_stage,
    data.action_required::property_action_required,
    data.notes,
    data.purchase_price::numeric,
    CASE WHEN data.purchase_price IS NOT NULL THEN NOW() - INTERVAL '10 days' ELSE NULL END as offer_date,
    CASE WHEN data.status = 'in_escrow' THEN NOW() + INTERVAL '30 days' ELSE NULL END as closing_date,
    NOW() as added_at,
    NOW() as last_activity_at
  FROM (
    VALUES 
      (
        'a1b2c3d4-e5f6-7890-1234-567890abcdef', 
        'shalinshah1998@gmail.com',
        'under_contract',
        'under_contract',
        'review_documents',
        'Great neighborhood, needs some updates',
        1200000.00
      ),
      (
        'b2c3d4e5-f6a7-8901-2345-678901234567', 
        'shalinshah1998@gmail.com',
        'researching',
        'initial_research',
        'schedule_viewing',
        'Modern townhouse with roof deck',
        1800000.00
      ),
      (
        'c3d4e5f6-a7b8-9012-3456-789012345678', 
        'shalin41098@yahoo.com.sg',
        'in_escrow',
        'closing',
        'final_walkthrough',
        'Condo with great views',
        880000.00
      )
  ) AS data(property_id, buyer_email, status, buying_stage, action_required, notes, purchase_price)
  JOIN buyers b ON b.email = data.buyer_email
)
INSERT INTO buyer_properties (
  property_id,
  buyer_id,
  status,
  buying_stage,
  action_required,
  notes,
  purchase_price,
  offer_date,
  closing_date,
  added_at,
  last_activity_at
)
SELECT 
  property_id,
  buyer_id,
  status::property_status,
  buying_stage::property_buying_stage,
  action_required::property_action_required,
  notes,
  purchase_price,
  offer_date,
  closing_date,
  added_at,
  last_activity_at
FROM buyer_property_data
ON CONFLICT (buyer_id, property_id) 
DO UPDATE SET
  status = EXCLUDED.status,
  buying_stage = EXCLUDED.buying_stage,
  action_required = EXCLUDED.action_required,
  notes = EXCLUDED.notes,
  purchase_price = EXCLUDED.purchase_price,
  offer_date = EXCLUDED.offer_date,
  closing_date = EXCLUDED.closing_date,
  last_activity_at = EXCLUDED.last_activity_at;

-- Insert property photos
INSERT INTO property_photos (property_id, url, caption, is_primary, "order", created_at, updated_at)
VALUES 
  -- Photos for first property
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 'Front view', true, 1, NOW(), NOW()),
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 'Living room', false, 2, NOW(), NOW()),
  
  -- Photos for second property
  ('b2c3d4e5-f6a7-8901-2345-678901234567', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 'Exterior', true, 1, NOW(), NOW()),
  ('b2c3d4e5-f6a7-8901-2345-678901234567', 'https://images.unsplash.com/photo-1583608205776-bb35b1d3d5b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 'Kitchen', false, 2, NOW(), NOW()),
  
  -- Photos for third property
  ('c3d4e5f6-a7b8-9012-3456-789012345678', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', 'Condo exterior', true, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample activities for buyer-property relationships
WITH bp_ids AS (
  SELECT 
    bp.id,
    p.status,
    p.purchase_price,
    bp.buyer_id
  FROM buyer_properties bp
  JOIN properties p ON bp.property_id = p.id
)
INSERT INTO property_activities (buyer_property_id, type, title, description, created_by, created_at)
SELECT 
  id,
  CASE 
    WHEN status = 'in_escrow' THEN 'milestone'
    WHEN status = 'under_contract' THEN 'offer'
    ELSE 'note'
  END,
  CASE 
    WHEN status = 'in_escrow' THEN 'Entered Escrow'
    WHEN status = 'under_contract' THEN 'Offer Accepted'
    ELSE 'Property Added'
  END,
  CASE 
    WHEN status = 'in_escrow' THEN 'Escrow opened with 30-day closing period.'
    WHEN status = 'under_contract' THEN 'Offer of $' || purchase_price || ' was accepted.'
    ELSE 'Added to watch list.'
  END,
  buyer_id,
  NOW() - (random() * INTERVAL '30 days')
FROM bp_ids
ON CONFLICT DO NOTHING;

-- Output success message
SELECT 'Successfully seeded database with test data' as message;
