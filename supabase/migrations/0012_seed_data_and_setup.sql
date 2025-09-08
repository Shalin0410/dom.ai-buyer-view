-- =============================================================================
-- SEED DATA AND ADDITIONAL SETUP - REAL ESTATE PLATFORM
-- =============================================================================
-- 
-- This migration adds seed data and completes the database setup
-- 
-- EXECUTION ORDER:
-- 1. Run 0011_complete_database_schema.sql (creates tables)
-- 2. Run database-triggers.sql (sets up triggers and logging)
-- 3. Run this file (inserts seed data with triggers active)
-- 
-- BENEFITS: Triggers will validate and log all seed data operations,
-- auto-create related records, and provide complete audit trail
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE SAMPLE ORGANIZATION
-- =============================================================================

-- Insert a sample real estate organization
INSERT INTO organizations (
  id,
  name,
  organization_type,
  business_address,
  business_phone,
  business_email,
  website,
  timezone,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Sunset Real Estate Group',
  'brokerage',
  '{"street": "123 Sunset Blvd", "city": "Los Angeles", "state": "CA", "zip": "90210"}',
  '+1-310-555-0123',
  'info@sunsetrealestate.com',
  'https://sunsetrealestate.com',
  'America/Los_Angeles',
  true
);

-- =============================================================================
-- STEP 2: CREATE SAMPLE PERSONS (AGENTS AND BUYERS)
-- =============================================================================

-- Insert sample agents
INSERT INTO persons (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  roles,
  primary_role,
  license_number,
  license_state,
  license_expiry,
  is_active
) VALUES 
-- Agent 1: Sarah Johnson
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'Sarah',
  'Johnson',
  'sarah.johnson@sunsetrealestate.com',
  '+1-310-555-0124',
  ARRAY['agent'],
  'agent',
  'CA12345678',
  'CA',
  '2025-12-31',
  true
),
-- Agent 2: Michael Chen
(
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  'Michael',
  'Chen',
  'michael.chen@sunsetrealestate.com',
  '+1-310-555-0125',
  ARRAY['agent'],
  'agent',
  'CA87654321',
  'CA',
  '2025-12-31',
  true
);

-- Insert sample buyers
INSERT INTO persons (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  roles,
  primary_role,
  assigned_agent_id,
  is_active
) VALUES 
-- Buyer 1: Jennifer Smith
(
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  'Jennifer',
  'Smith',
  'jennifer.smith@email.com',
  '+1-310-555-0126',
  ARRAY['buyer'],
  'buyer',
  '550e8400-e29b-41d4-a716-446655440002',
  true
),
-- Buyer 2: David Rodriguez
(
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  'David',
  'Rodriguez',
  'david.rodriguez@email.com',
  '+1-310-555-0127',
  ARRAY['buyer'],
  'buyer',
  '550e8400-e29b-41d4-a716-446655440002',
  true
),
-- Buyer 3: Lisa Thompson
(
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440001',
  'Lisa',
  'Thompson',
  'lisa.thompson@email.com',
  '+1-310-555-0128',
  ARRAY['buyer'],
  'buyer',
  '550e8400-e29b-41d4-a716-446655440003',
  true
);

-- =============================================================================
-- STEP 3: CREATE BUYER PROFILES
-- =============================================================================

-- Insert buyer profiles with financial information
INSERT INTO buyer_profiles (
  person_id,
  price_min,
  price_max,
  budget_approved,
  pre_approval_amount,
  pre_approval_expiry,
  down_payment_amount,
  buyer_needs,
  preferred_areas,
  property_type_preferences,
  must_have_features,
  nice_to_have_features,
  ideal_move_in_date,
  urgency_level
) VALUES 
-- Jennifer Smith's profile
(
  '550e8400-e29b-41d4-a716-446655440004',
  800000,
  1200000,
  true,
  1100000,
  '2024-12-31',
  200000,
  'Looking for a family home with good schools and outdoor space',
  ARRAY['Beverly Hills', 'West Hollywood', 'Hollywood Hills'],
  ARRAY['single_family', 'townhouse'],
  ARRAY['3+ bedrooms', '2+ bathrooms', 'good school district', 'outdoor space'],
  ARRAY['pool', 'garage', 'mountain view', 'modern kitchen'],
  '2024-06-01',
  'medium'
),
-- David Rodriguez's profile
(
  '550e8400-e29b-41d4-a716-446655440005',
  600000,
  900000,
  true,
  850000,
  '2024-12-31',
  150000,
  'First-time homebuyer looking for a starter home',
  ARRAY['Culver City', 'Mar Vista', 'Venice'],
  ARRAY['single_family', 'condo'],
  ARRAY['2+ bedrooms', '1+ bathroom', 'safe neighborhood', 'commute friendly'],
  ARRAY['updated kitchen', 'outdoor space', 'parking', 'near restaurants'],
  '2024-08-01',
  'high'
),
-- Lisa Thompson's profile
(
  '550e8400-e29b-41d4-a716-446655440006',
  1000000,
  1500000,
  true,
  1400000,
  '2024-12-31',
  300000,
  'Looking for a luxury property with modern amenities',
  ARRAY['Brentwood', 'Pacific Palisades', 'Malibu'],
  ARRAY['single_family', 'luxury_condo'],
  ARRAY['4+ bedrooms', '3+ bathrooms', 'ocean view', 'high-end finishes'],
  ARRAY['smart home features', 'wine cellar', 'home theater', 'gym'],
  '2024-09-01',
  'low'
);

-- =============================================================================
-- STEP 4: CREATE SAMPLE PROPERTIES
-- =============================================================================

-- Insert sample properties
INSERT INTO properties (
  id,
  organization_id,
  listing_agent_id,
  address,
  city,
  state,
  zip_code,
  coordinates,
  listing_price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  year_built,
  lot_size,
  status,
  mls_number,
  listing_url,
  description,
  days_on_market,
  features,
  schools,
  neighborhood_info,
  has_active_interest
) VALUES 
-- Property 1: Beverly Hills Family Home
(
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '1234 Beverly Drive',
  'Beverly Hills',
  'CA',
  '90210',
  '{"lat": 34.0736, "lng": -118.4004}',
  1100000,
  4,
  3.5,
  3200,
  'single_family',
  1985,
  8000,
  'active',
  'MLS123456',
  'https://example.com/property1',
  'Beautiful family home in prime Beverly Hills location. Recently updated with modern amenities while maintaining classic charm.',
  15,
  '{"pool": true, "garage": "2-car", "fireplace": true, "hardwood_floors": true}',
  '{"elementary": "Hawthorne School", "middle": "Beverly Vista", "high": "Beverly Hills High"}',
  '{"crime_rate": "low", "walkability": "high", "restaurants": "excellent"}',
  true
),
-- Property 2: Culver City Starter Home
(
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '5678 Culver Boulevard',
  'Culver City',
  'CA',
  '90230',
  '{"lat": 34.0211, "lng": -118.3965}',
  750000,
  3,
  2,
  1800,
  'single_family',
  1990,
  5000,
  'active',
  'MLS789012',
  'https://example.com/property2',
  'Charming starter home in family-friendly Culver City. Great location near schools and shopping.',
  8,
  '{"garage": "1-car", "fireplace": true, "backyard": true, "updated_kitchen": true}',
  '{"elementary": "El Marino", "middle": "Culver City Middle", "high": "Culver City High"}',
  '{"crime_rate": "low", "walkability": "medium", "schools": "excellent"}',
  true
),
-- Property 3: Brentwood Luxury Home
(
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440003',
  '9012 Brentwood Circle',
  'Los Angeles',
  'CA',
  '90049',
  '{"lat": 34.0522, "lng": -118.4737}',
  1400000,
  5,
  4.5,
  4500,
  'single_family',
  2005,
  12000,
  'active',
  'MLS345678',
  'https://example.com/property3',
  'Stunning luxury home in prestigious Brentwood neighborhood. Features high-end finishes and resort-style amenities.',
  22,
  '{"pool": true, "garage": "3-car", "smart_home": true, "wine_cellar": true, "home_theater": true}',
  '{"elementary": "Brentwood School", "middle": "Paul Revere", "high": "Palisades Charter"}',
  '{"crime_rate": "very_low", "walkability": "medium", "luxury_rating": "very_high"}',
  true
);

-- =============================================================================
-- STEP 5: CREATE PROPERTY PHOTOS
-- =============================================================================

-- Insert sample property photos
INSERT INTO property_photos (
  property_id,
  url,
  caption,
  is_primary,
  display_order
) VALUES 
-- Property 1 photos
('550e8400-e29b-41d4-a716-446655440007', 'https://example.com/photos/property1_1.jpg', 'Front exterior view', true, 1),
('550e8400-e29b-41d4-a716-446655440007', 'https://example.com/photos/property1_2.jpg', 'Living room with fireplace', false, 2),
('550e8400-e29b-41d4-a716-446655440007', 'https://example.com/photos/property1_3.jpg', 'Kitchen with granite countertops', false, 3),
('550e8400-e29b-41d4-a716-446655440007', 'https://example.com/photos/property1_4.jpg', 'Backyard with pool', false, 4),

-- Property 2 photos
('550e8400-e29b-41d4-a716-446655440008', 'https://example.com/photos/property2_1.jpg', 'Front exterior view', true, 1),
('550e8400-e29b-41d4-a716-446655440008', 'https://example.com/photos/property2_2.jpg', 'Updated kitchen', false, 2),
('550e8400-e29b-41d4-a716-446655440008', 'https://example.com/photos/property2_3.jpg', 'Spacious backyard', false, 3),

-- Property 3 photos
('550e8400-e29b-41d4-a716-446655440009', 'https://example.com/photos/property3_1.jpg', 'Front exterior view', true, 1),
('550e8400-e29b-41d4-a716-446655440009', 'https://example.com/photos/property3_2.jpg', 'Grand entryway', false, 2),
('550e8400-e29b-41d4-a716-446655440009', 'https://example.com/photos/property3_3.jpg', 'Chef\'s kitchen', false, 3),
('550e8400-e29b-41d4-a716-446655440009', 'https://example.com/photos/property3_4.jpg', 'Master suite', false, 4),
('550e8400-e29b-41d4-a716-446655440009', 'https://example.com/photos/property3_5.jpg', 'Resort-style pool area', false, 5);

-- =============================================================================
-- STEP 6: CREATE BUYER-PROPERTY RELATIONSHIPS
-- =============================================================================

-- Insert buyer-property relationships
INSERT INTO buyer_properties (
  id,
  organization_id,
  buyer_id,
  property_id,
  relationship_type,
  interest_level,
  is_active
) VALUES 
-- Jennifer Smith interested in Beverly Hills home
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440007',
  'home_buyer',
  'high',
  true
),
-- David Rodriguez interested in Culver City home
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440008',
  'home_buyer',
  'high',
  true
),
-- Lisa Thompson interested in Brentwood home
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440009',
  'home_buyer',
  'medium',
  true
);

-- =============================================================================
-- STEP 7: CREATE TIMELINES AND STEPS
-- =============================================================================

-- Insert timelines for buyer-property relationships
INSERT INTO timelines (
  id,
  buyer_property_id,
  current_phase,
  current_fub_stage,
  is_active
) VALUES 
-- Jennifer Smith's timeline
(
  '550e8400-e29b-41d4-a716-446655440013',
  '550e8400-e29b-41d4-a716-446655440010',
  'pre_escrow',
  'active_client',
  true
),
-- David Rodriguez's timeline
(
  '550e8400-e29b-41d4-a716-446655440014',
  '550e8400-e29b-41d4-a716-446655440011',
  'pre_escrow',
  'hot_prospect',
  true
),
-- Lisa Thompson's timeline
(
  '550e8400-e29b-41d4-a716-446655440015',
  '550e8400-e29b-41d4-a716-446655440012',
  'pre_escrow',
  'nurture',
  true
);

-- Insert timeline steps for Jennifer Smith (most advanced)
INSERT INTO timeline_steps (
  timeline_id,
  step_type,
  step_order,
  is_completed,
  completed_date,
  notes
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  1,
  true,
  '2024-01-15',
  'Initial consultation completed. Jennifer is looking for a family home with good schools.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  2,
  true,
  '2024-01-20',
  'Financial preparation completed. Jennifer has pre-approval for $1.1M with 20% down.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  3,
  true,
  '2024-01-22',
  'Property search setup completed. Created MLS search for Beverly Hills area, 3+ beds, 2+ baths.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  4,
  false,
  NULL,
  'Property tours scheduled for this weekend. Jennifer will view 3 properties including the Beverly Drive home.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  5,
  false,
  NULL,
  'Offer strategy discussion scheduled for after property tours.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'pre_escrow',
  6,
  false,
  NULL,
  'Offer preparation and submission pending property tour feedback.'
);

-- Insert timeline steps for David Rodriguez
INSERT INTO timeline_steps (
  timeline_id,
  step_type,
  step_order,
  is_completed,
  completed_date,
  notes
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440014',
  'pre_escrow',
  1,
  true,
  '2024-01-10',
  'Initial consultation completed. David is a first-time homebuyer looking for a starter home.'
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'pre_escrow',
  2,
  true,
  '2024-01-18',
  'Financial preparation completed. David has pre-approval for $850K with 20% down.'
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'pre_escrow',
  3,
  false,
  NULL,
  'Property search setup in progress. Focusing on Culver City, Mar Vista, and Venice areas.'
);

-- Insert timeline steps for Lisa Thompson
INSERT INTO timeline_steps (
  timeline_id,
  step_type,
  step_order,
  is_completed,
  completed_date,
  notes
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440015',
  'pre_escrow',
  1,
  true,
  '2024-01-05',
  'Initial consultation completed. Lisa is looking for a luxury property with modern amenities.'
),
(
  '550e8400-e29b-41d4-a716-446655440015',
  'pre_escrow',
  2,
  false,
  NULL,
  'Financial preparation in progress. Lisa is gathering additional financial documents.'
);

-- =============================================================================
-- STEP 8: CREATE ACTION ITEMS
-- =============================================================================

-- Insert action items for agents and buyers
INSERT INTO action_items (
  id,
  organization_id,
  assigned_agent_id,
  buyer_property_id,
  action_type,
  title,
  description,
  priority,
  status,
  due_date,
  created_by
) VALUES 
-- Agent tasks for Jennifer Smith
(
  '550e8400-e29b-41d4-a716-446655440016',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440010',
  'schedule_attend_showings',
  'Schedule Property Tours for Jennifer',
  'Schedule property tours for Jennifer Smith this weekend. She is interested in the Beverly Drive home and 2 other properties.',
  'high',
  'in_progress',
  '2024-01-27',
  '550e8400-e29b-41d4-a716-446655440002'
),
(
  '550e8400-e29b-41d4-a716-446655440017',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440010',
  'discuss_offer_strategy',
  'Discuss Offer Strategy with Jennifer',
  'After property tours, discuss offer strategy and prepare offer documents for the Beverly Drive home.',
  'medium',
  'pending',
  '2024-01-28',
  '550e8400-e29b-41d4-a716-446655440002'
),

-- Agent tasks for David Rodriguez
(
  '550e8400-e29b-41d4-a716-446655440018',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440011',
  'set_up_property_search',
  'Complete Property Search Setup for David',
  'Finish setting up MLS search criteria for David Rodriguez. Focus on Culver City, Mar Vista, and Venice areas.',
  'medium',
  'in_progress',
  '2024-01-25',
  '550e8400-e29b-41d4-a716-446655440002'
),

-- Buyer tasks
(
  '550e8400-e29b-41d4-a716-446655440019',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  '550e8400-e29b-41d4-a716-446655440010',
  'attend_property_showings',
  'Attend Property Tours',
  'Attend scheduled property tours this weekend. View the Beverly Drive home and 2 other properties.',
  'high',
  'pending',
  '2024-01-27',
  '550e8400-e29b-41d4-a716-446655440002'
),
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  '550e8400-e29b-41d4-a716-446655440011',
  'research_neighborhoods',
  'Research Culver City Neighborhoods',
  'Research Culver City, Mar Vista, and Venice neighborhoods. Look into schools, crime rates, and amenities.',
  'medium',
  'pending',
  '2024-01-30',
  '550e8400-e29b-41d4-a716-446655440002'
);

-- =============================================================================
-- STEP 9: CREATE SAMPLE CONVERSATIONS AND MESSAGES
-- =============================================================================

-- Insert sample chatbot conversations
INSERT INTO conversations (
  id,
  organization_id,
  user_id,
  title,
  status,
  metadata
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440004',
  'First-time homebuyer questions',
  'active',
  '{"user_type": "buyer", "experience_level": "first_time", "preferences": ["family_home", "good_schools"]}'
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440005',
  'Mortgage and financing help',
  'active',
  '{"user_type": "buyer", "experience_level": "first_time", "topics": ["mortgage", "financing", "closing_costs"]}'
);

-- Insert sample messages
INSERT INTO messages (
  conversation_id,
  role,
  content,
  sources,
  tokens_used
) VALUES 
-- Conversation 1 messages
(
  '550e8400-e29b-41d4-a716-446655440021',
  'user',
  'Hi, I\'m a first-time homebuyer and I have some questions about the process.',
  '[]',
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  'assistant',
  'Hello! Welcome to the homebuying journey. I\'d be happy to help answer your questions about the process. As a first-time homebuyer, you\'ll want to understand the key steps involved.\n\n**Here\'s an overview of the homebuying process:**\n\n1. **Initial Consultation** - Meet with your agent to discuss needs and budget\n2. **Financial Preparation** - Get pre-approved and gather documents\n3. **Property Search** - Work with your agent to find suitable properties\n4. **Property Tours** - Visit properties that interest you\n5. **Offer Strategy** - Develop and submit offers\n6. **Escrow Process** - Handle inspections, loan approval, and closing\n\nWhat specific questions do you have about any of these steps?',
  '[{"title": "Homebuying Process Guide", "url": "https://example.com/guides/homebuying-process", "sourceType": "online"}]',
  150
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  'user',
  'How long does the whole process typically take?',
  '[]',
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  'assistant',
  'Great question! The timeline can vary significantly depending on several factors:\n\n**Typical Timeline Breakdown:**\n\n- **Pre-escrow phase**: 2-6 months (finding properties, making offers)\n- **Escrow period**: 30-45 days (once under contract)\n- **Total process**: 3-8 months on average\n\n**Factors that can speed up or slow down the process:**\n\n- **Market conditions**: Hot markets may require faster decisions\n- **Property type**: New construction vs. existing homes\n- **Financing**: Cash buyers can close faster than those needing loans\n- **Contingencies**: More contingencies can extend escrow\n- **Property condition**: Homes needing repairs may have longer escrows\n\nFor first-time buyers, I typically recommend budgeting 4-6 months for the entire process to avoid feeling rushed.',
  '[{"title": "Homebuying Timeline Guide", "url": "https://example.com/guides/timeline", "sourceType": "online"}]',
  180
),

-- Conversation 2 messages
(
  '550e8400-e29b-41d4-a716-446655440022',
  'user',
  'I need help understanding mortgage options and closing costs.',
  '[]',
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  'assistant',
  'I\'d be happy to help explain mortgage options and closing costs! This is a crucial part of the homebuying process.\n\n**Common Mortgage Types:**\n\n1. **Conventional Loans** - 20% down payment, competitive rates\n2. **FHA Loans** - 3.5% down payment, good for first-time buyers\n3. **VA Loans** - 0% down payment for veterans\n4. **USDA Loans** - 0% down payment for rural properties\n\n**Typical Closing Costs (2-5% of home price):**\n\n- **Loan origination fees**: 0.5-1% of loan amount\n- **Appraisal fees**: $300-500\n- **Title insurance**: $1,000-2,000\n- **Escrow fees**: $500-1,500\n- **Property taxes**: Pro-rated amount\n- **Homeowners insurance**: First year premium\n\nWould you like me to explain any of these options in more detail, or do you have questions about specific mortgage programs?',
  '[{"title": "Mortgage Guide", "url": "https://example.com/guides/mortgages", "sourceType": "online"}, {"title": "Closing Costs Calculator", "url": "https://example.com/tools/closing-costs", "sourceType": "online"}]',
  200
);

-- =============================================================================
-- STEP 10: CREATE SYSTEM SETTINGS
-- =============================================================================

-- Insert default system settings
INSERT INTO system_settings (
  organization_id,
  setting_key,
  setting_value,
  setting_type,
  description,
  is_system_setting
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'email_notifications_enabled',
  'true',
  'boolean',
  'Whether email notifications are enabled for the organization',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'timeline_automation_enabled',
  'true',
  'boolean',
  'Whether timeline automation is enabled for the organization',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'fub_sync_enabled',
  'false',
  'boolean',
  'Whether FUB CRM synchronization is enabled',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'default_timeline_duration_days',
  '30',
  'number',
  'Default timeline duration in days for new transactions',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'property_cleanup_days',
  '20',
  'number',
  'Number of days after last activity before properties are marked for cleanup',
  true
);

-- =============================================================================
-- STEP 11: CREATE SAMPLE NET SHEETS
-- =============================================================================

-- Insert sample net sheets for financial transparency
INSERT INTO net_sheets (
  buyer_property_id,
  listing_price,
  purchase_price,
  down_payment_percentage,
  loan_amount,
  interest_rate,
  loan_term,
  principal_interest,
  property_tax_monthly,
  insurance_monthly,
  hoa_fees_monthly,
  total_monthly_payment,
  closing_cost_estimate,
  earnest_money,
  cash_to_close,
  monthly_savings_vs_rent,
  is_current
) VALUES 
-- Jennifer Smith's net sheet for Beverly Hills home
(
  '550e8400-e29b-41d4-a716-446655440010',
  1100000,
  1100000,
  20,
  880000,
  6.5,
  30,
  5562.50,
  916.67,
  183.33,
  0,
  6662.50,
  22000,
  22000,
  220000,
  1500,
  true
),
-- David Rodriguez's net sheet for Culver City home
(
  '550e8400-e29b-41d4-a716-446655440011',
  750000,
  750000,
  20,
  600000,
  6.5,
  30,
  3791.67,
  625.00,
  125.00,
  0,
  4541.67,
  15000,
  15000,
  150000,
  1000,
  true
);

-- =============================================================================
-- STEP 12: CREATE SAMPLE DOCUMENTS
-- =============================================================================

-- Insert sample documents
INSERT INTO documents (
  organization_id,
  buyer_property_id,
  title,
  document_type,
  file_name,
  file_size,
  mime_type,
  storage_path,
  extraction_status,
  processed_data,
  access_level,
  uploaded_by
) VALUES 
-- Jennifer Smith's documents
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'Pre-Approval Letter',
  'financial',
  'jennifer_smith_preapproval.pdf',
  245760,
  'application/pdf',
  '/documents/jennifer_smith/preapproval.pdf',
  'completed',
  '{"extracted_text": "Pre-approval for $1,100,000...", "key_terms": ["pre-approval", "1.1M", "20% down"], "risk_assessment": "low"}',
  'buyer_visible',
  '550e8400-e29b-41d4-a716-446655440002'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'Proof of Funds',
  'financial',
  'jennifer_smith_proof_of_funds.pdf',
  189440,
  'application/pdf',
  '/documents/jennifer_smith/proof_of_funds.pdf',
  'completed',
  '{"extracted_text": "Bank statement showing $250,000...", "key_terms": ["bank statement", "250K", "available funds"], "risk_assessment": "low"}',
  'agent_only',
  '550e8400-e29b-41d4-a716-446655440002'
),

-- David Rodriguez's documents
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440011',
  'Pre-Approval Letter',
  'financial',
  'david_rodriguez_preapproval.pdf',
  198656,
  'application/pdf',
  '/documents/david_rodriguez/preapproval.pdf',
  'completed',
  '{"extracted_text": "Pre-approval for $850,000...", "key_terms": ["pre-approval", "850K", "20% down"], "risk_assessment": "low"}',
  'buyer_visible',
  '550e8400-e29b-41d4-a716-446655440002'
);

-- =============================================================================
-- SEED DATA COMPLETE
-- =============================================================================

-- This migration has added comprehensive sample data including:
-- - Sample organization (Sunset Real Estate Group)
-- - Sample agents (Sarah Johnson, Michael Chen)
-- - Sample buyers (Jennifer Smith, David Rodriguez, Lisa Thompson)
-- - Sample properties (Beverly Hills, Culver City, Brentwood homes)
-- - Sample buyer-property relationships and timelines
-- - Sample action items and tasks
-- - Sample chatbot conversations and messages
-- - Sample documents and net sheets
-- - Default system settings

-- The database is now populated with realistic data for testing and development
-- All relationships are properly established and follow the business logic
