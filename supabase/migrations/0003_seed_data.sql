-- ===========================================
-- Seed Data
-- ===========================================

-- Clean up existing test data (if any)
TRUNCATE TABLE property_activities, property_photos, buyer_properties, properties, buyers, agents CASCADE;

-- Create test auth users first (these will be the foundation for our buyers)
-- Note: In production, users would sign up through the normal flow
-- Only insert if users don't already exist
DO $$
BEGIN
  -- Insert first test user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'shalinshah1998@gmail.com',
      crypt('TempPass123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Insert second test user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '22222222-2222-2222-2222-222222222222'::uuid) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '22222222-2222-2222-2222-222222222222'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'shalin41098@yahoo.com.sg',
      crypt('TempPass123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Create corresponding auth.identities records
DO $$
BEGIN
  -- Insert first identity
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid AND provider = 'email') THEN
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      '11111111-1111-1111-1111-111111111111'::uuid,
      '{"sub":"11111111-1111-1111-1111-111111111111","email":"shalinshah1998@gmail.com"}',
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Insert second identity
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid AND provider = 'email') THEN
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      '22222222-2222-2222-2222-222222222222',
      '22222222-2222-2222-2222-222222222222'::uuid,
      '{"sub":"22222222-2222-2222-2222-222222222222","email":"shalin41098@yahoo.com.sg"}',
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert test agents (without user_id as it should be set by auth system)
INSERT INTO agents (id, first_name, last_name, email, phone, created_at, updated_at)
VALUES 
  ('e5a1231f-9a70-484c-bca1-def78a0d9c08', 'John', 'Smith', 'john.smith@example.com', '+14155550123', NOW(), NOW()),
  ('f6b23420-9a70-484c-bca1-def78a0d9c09', 'Sarah', 'Johnson', 'sarah.j@example.com', '+14155550124', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test buyers using the auth users we just created
INSERT INTO buyers (id, email, first_name, last_name, agent_id, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'shalinshah1998@gmail.com',
    'Shalin',
    'Shah',
    'e5a1231f-9a70-484c-bca1-def78a0d9c08'::uuid,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'shalin41098@yahoo.com.sg',
    'Emma',
    'Wilson',
    'f6b23420-9a70-484c-bca1-def78a0d9c09'::uuid,
    NOW(),
    NOW()
  )
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
      ),
      (
        'd4e5f6a7-b8c9-0123-4567-890123456789', 
        '321 Elm St', 'Berkeley', 'CA', '94705',
        985000, 950000, 3, 2, 1800, 4500, 2000, 'single_family',
        'viewing', 'offer_negotiation', 'submit_offer', 'BK98765432',
        'https://example.com/listings/bk98765432', 'Family home with potential mismatch'
      )
  ) AS data(id, address, city, state, zip_code, listing_price, purchase_price, bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, status, buying_stage, action_required, mls_number, listing_url, notes)
  LEFT JOIN properties p ON p.id = data.id::uuid
  WHERE p.id IS NULL
  RETURNING id, mls_number
),
-- Create buyer-property relationships using direct UUIDs
buyer_property_data AS (
  SELECT 
    data.property_id::uuid,
    data.buyer_id::uuid,
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
        '11111111-1111-1111-1111-111111111111',
        'under_contract',
        'under_contract',
        'review_documents',
        'Great neighborhood, needs some updates',
        1200000.00
      ),
      (
        'b2c3d4e5-f6a7-8901-2345-678901234567', 
        '11111111-1111-1111-1111-111111111111',
        'researching',
        'initial_research',
        'schedule_viewing',
        'Modern townhouse with roof deck',
        1800000.00
      ),
      (
        'c3d4e5f6-a7b8-9012-3456-789012345678', 
        '22222222-2222-2222-2222-222222222222',
        'in_escrow',
        'closing',
        'final_walkthrough',
        'Condo with great views',
        880000.00
      ),
      (
        'd4e5f6a7-b8c9-0123-4567-890123456789', 
        '11111111-1111-1111-1111-111111111111',
        'viewing',
        'offer_negotiation',
        'submit_offer',
        'Family home with potential mismatch',
        950000.00
      )
  ) AS data(property_id, buyer_id, status, buying_stage, action_required, notes, purchase_price)
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
    bp.status,
    bp.purchase_price,
    bp.buyer_id
  FROM buyer_properties bp
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
