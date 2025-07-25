-- Add sample properties for buyers
-- First, let's find the first buyer in the system
DO $$
DECLARE
  buyer_record RECORD;
  property_id1 UUID;
  property_id2 UUID;
  property_id3 UUID;
BEGIN
  -- Get the first buyer (you can change the condition as needed)
  SELECT id INTO buyer_record FROM buyers LIMIT 1;
  
  IF buyer_record.id IS NULL THEN
    RAISE EXCEPTION 'No buyers found in the database. Please add a buyer first.';
  END IF;
  
  RAISE NOTICE 'Adding properties for buyer ID: %', buyer_record.id;
  
  -- Property 1: Modern Family Home
  INSERT INTO properties (
    id, address, city, state, zip, 
    price, bedrooms, baths, sqft, 
    year_built, property_type, mls_number, created_at, image_url
  ) VALUES (
    gen_random_uuid(), '123 Main St', 'San Francisco', 'CA', '94105',
    1250000, 3, 2, 1800,
    1995, 'single_family', 'SF12345', NOW(), 
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  ) RETURNING id INTO property_id1;
  
  -- Link property to buyer
  INSERT INTO buyer_properties (
    id, buyer_id, property_id, status,
    created_at, last_activity_at
  ) VALUES (
    gen_random_uuid(), buyer_record.id, property_id1, 'saved',
    NOW(), NOW()
  );
  
  -- Property 2: Modern Condo
  INSERT INTO properties (
    id, address, city, state, zip, 
    price, bedrooms, baths, sqft, 
    year_built, property_type, mls_number, created_at, image_url
  ) VALUES (
    gen_random_uuid(), '456 Oak Ave', 'Seattle', 'WA', '98101',
    850000, 2, 2, 1200,
    2010, 'condo', 'SEA67890', NOW(),
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  ) RETURNING id INTO property_id2;
  
  -- Link property to buyer
  INSERT INTO buyer_properties (
    id, buyer_id, property_id, status,
    created_at, last_activity_at
  ) VALUES (
    gen_random_uuid(), buyer_record.id, property_id2, 'loved',
    NOW(), NOW()
  );
  
  -- Property 3: Spacious Townhouse
  INSERT INTO properties (
    id, address, city, state, zip, 
    price, bedrooms, baths, sqft, 
    year_built, property_type, mls_number, created_at, image_url
  ) VALUES (
    gen_random_uuid(), '789 Pine St', 'Austin', 'TX', '73301',
    650000, 4, 3, 2400,
    2005, 'townhouse', 'AUS45678', NOW(),
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  ) RETURNING id INTO property_id3;
  
  -- Link property to buyer
  INSERT INTO buyer_properties (
    id, buyer_id, property_id, status,
    created_at, last_activity_at
  ) VALUES (
    gen_random_uuid(), buyer_record.id, property_id3, 'saved',
    NOW(), NOW()
  );
  
  RAISE NOTICE 'Successfully added 3 properties for buyer ID: %', buyer_record.id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error adding properties: %', SQLERRM;
END $$;
