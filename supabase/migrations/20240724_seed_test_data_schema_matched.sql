-- First, insert test buyers if they don't exist
WITH inserted_buyers AS (
  INSERT INTO buyers (id, email, first_name, last_name, created_at)
  VALUES 
    ('03c1e014-e067-4f61-b5a0-945b3adb80f4', 'shalinshah1998@gmail.com', 'Shalin', 'Shah', NOW()),
    ('740f14cc-d813-4db0-9866-d7bba6291bc4', 'shalin41098@yahoo.com.sg', 'Emma', 'Wilson', NOW())
  ON CONFLICT (id) DO NOTHING
  RETURNING id, email
),

-- Insert sample properties
inserted_properties AS (
  INSERT INTO properties (
    mls_number, address, city, state, price, bedrooms, baths, sqft, image_url, created_at
  )
  VALUES 
    ('SF12345678', '123 Main St', 'San Francisco', 'CA', 1250000, 3, 2, 2200, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', NOW()),
    ('SF87654321', '456 Oak Ave', 'San Francisco', 'CA', 1850000, 4, 3, 2800, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', NOW()),
    ('OK12345678', '789 Pine St', 'Oakland', 'CA', 895000, 2, 1, 1200, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', NOW())
  ON CONFLICT (mls_number) DO NOTHING
  RETURNING id, mls_number
)

-- Final SELECT to return a success message
SELECT 'Successfully seeded database with test data' as message;
