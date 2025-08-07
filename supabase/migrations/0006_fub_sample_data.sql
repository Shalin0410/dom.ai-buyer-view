-- ===========================================
-- FUB Integration Sample Data
-- ===========================================

-- Insert sample teams
INSERT INTO fub_teams (fub_team_id, name, description) VALUES 
  (1, 'Sales Team', 'Primary sales team for residential properties'),
  (2, 'Luxury Division', 'High-end luxury property specialists'),
  (3, 'Commercial Team', 'Commercial real estate division')
ON CONFLICT (fub_team_id) DO NOTHING;

-- Insert sample pipelines
INSERT INTO fub_pipelines (fub_pipeline_id, name, description) VALUES 
  (1, 'Buyer Pipeline', 'Standard buyer process from lead to close'),
  (2, 'Seller Pipeline', 'Listing and selling process'),
  (3, 'Rental Pipeline', 'Rental property management process')
ON CONFLICT (fub_pipeline_id) DO NOTHING;

-- Insert sample stages for buyer pipeline
INSERT INTO fub_stages (fub_stage_id, pipeline_id, name, description, position, color) VALUES 
  (1, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'New Lead', 'Initial contact made', 1, '#3B82F6'),
  (2, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'Qualified', 'Lead has been qualified', 2, '#10B981'),
  (3, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'Showing Properties', 'Actively viewing properties', 3, '#F59E0B'),
  (4, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'Offer Submitted', 'Offer has been submitted', 4, '#8B5CF6'),
  (5, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'Under Contract', 'Property is under contract', 5, '#EF4444'),
  (6, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), 'Closed', 'Transaction completed', 6, '#059669')
ON CONFLICT (fub_stage_id) DO NOTHING;

-- Insert sample stages for seller pipeline
INSERT INTO fub_stages (fub_stage_id, pipeline_id, name, description, position, color) VALUES 
  (7, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Initial Consultation', 'First meeting with seller', 1, '#3B82F6'),
  (8, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Market Analysis', 'Conducting CMA', 2, '#10B981'),
  (9, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Listing Prep', 'Preparing property for listing', 3, '#F59E0B'),
  (10, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Active Listing', 'Property is on market', 4, '#8B5CF6'),
  (11, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Under Contract', 'Offer accepted', 5, '#EF4444'),
  (12, (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 2), 'Sold', 'Transaction completed', 6, '#059669')
ON CONFLICT (fub_stage_id) DO NOTHING;

-- Insert sample action plans
INSERT INTO fub_action_plans (fub_action_plan_id, name, description) VALUES 
  (1, 'New Buyer Lead', 'Standard follow-up sequence for new buyer leads'),
  (2, 'New Seller Lead', 'Standard follow-up sequence for new seller leads'),
  (3, 'Property Inquiry', 'Follow-up for property-specific inquiries'),
  (4, 'Open House Follow-up', 'Follow-up sequence for open house attendees'),
  (5, 'Past Client Nurture', 'Stay in touch with past clients')
ON CONFLICT (fub_action_plan_id) DO NOTHING;

-- Insert sample custom fields
INSERT INTO fub_custom_fields (fub_field_id, entity_type, field_name, field_type, field_options, is_required) VALUES 
  (1, 'person', 'Budget Range', 'dropdown', '["Under $200k", "$200k-$400k", "$400k-$600k", "$600k-$800k", "$800k-$1M", "Over $1M"]', false),
  (2, 'person', 'Preferred Areas', 'text', null, false),
  (3, 'person', 'Move Timeline', 'dropdown', '["Immediately", "1-3 months", "3-6 months", "6-12 months", "12+ months"]', false),
  (4, 'person', 'Current Housing Status', 'dropdown', '["Renting", "Own (need to sell)", "Own (keeping as investment)", "Living with family"]', false),
  (5, 'deal', 'Financing Type', 'dropdown', '["Conventional", "FHA", "VA", "Cash", "Jumbo", "Other"]', false),
  (6, 'deal', 'Lender Name', 'text', null, false),
  (7, 'deal', 'Loan Officer', 'text', null, false)
ON CONFLICT (fub_field_id) DO NOTHING;

-- Insert FUB configuration (single row)
INSERT INTO fub_configuration (
  sync_enabled, 
  sync_frequency_minutes, 
  default_pipeline_id, 
  default_stage_id,
  sync_settings
) VALUES (
  false, -- Initially disabled until API key is configured
  15, -- Sync every 15 minutes
  (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1), -- Default to buyer pipeline
  (SELECT id FROM fub_stages WHERE fub_stage_id = 1), -- Default to new lead stage
  jsonb_build_object(
    'sync_people', true,
    'sync_deals', true,
    'sync_events', true,
    'sync_tasks', true,
    'sync_appointments', true,
    'auto_assign_action_plans', true,
    'default_lead_source', 'Website',
    'webhook_events', array['person.created', 'person.updated', 'deal.created', 'deal.updated', 'event.created']
  )
) ON CONFLICT DO NOTHING;

-- Enhanced sample buyer data with FUB fields
DO $$
DECLARE
  first_agent_id UUID;
  second_agent_id UUID;
  first_buyer_id UUID;
  second_buyer_id UUID;
BEGIN
  -- Get agent IDs
  SELECT id INTO first_agent_id FROM agents ORDER BY created_at LIMIT 1;
  SELECT id INTO second_agent_id FROM agents ORDER BY created_at OFFSET 1 LIMIT 1;
  
  -- Update existing buyers with FUB data if they exist
  UPDATE buyers SET 
    fub_person_id = 1001,
    source = 'Website',
    source_url = 'https://example.com/contact',
    emails = jsonb_build_array(
      jsonb_build_object('value', email, 'type', 'primary', 'isPrimary', true)
    ),
    phones = jsonb_build_array(
      jsonb_build_object('value', phone, 'type', 'mobile', 'isPrimary', true)
    ),
    tags = array['First Time Buyer', 'Website Lead'],
    lead_stage = 'qualified',
    lead_status = 'active',
    assigned_user_id = first_agent_id,
    address = jsonb_build_object(
      'street', '123 Sample St',
      'city', 'Los Angeles',
      'state', 'CA',
      'zip', '90210',
      'country', 'USA'
    )
  WHERE email LIKE '%@example.com' AND fub_person_id IS NULL
  RETURNING id INTO first_buyer_id;

  -- Create sample deals if we have buyers
  IF first_buyer_id IS NOT NULL THEN
    INSERT INTO fub_deals (
      fub_deal_id,
      person_id,
      property_id,
      agent_id,
      pipeline_id,
      stage_id,
      deal_type,
      deal_value,
      commission_rate,
      estimated_commission,
      expected_close_date,
      deal_status
    ) VALUES (
      2001,
      first_buyer_id,
      (SELECT id FROM properties LIMIT 1),
      first_agent_id,
      (SELECT id FROM fub_pipelines WHERE fub_pipeline_id = 1),
      (SELECT id FROM fub_stages WHERE fub_stage_id = 3), -- Showing Properties
      'buyer',
      850000.00,
      0.0275, -- 2.75%
      23375.00,
      CURRENT_DATE + INTERVAL '45 days',
      'active'
    ) ON CONFLICT (fub_deal_id) DO NOTHING;

    -- Create sample events
    INSERT INTO fub_events (
      fub_event_id,
      person_id,
      property_id,
      agent_id,
      event_type,
      event_subtype,
      title,
      description,
      event_data,
      happened_at
    ) VALUES 
      (
        3001,
        first_buyer_id,
        (SELECT id FROM properties LIMIT 1),
        first_agent_id,
        'property_inquiry',
        'listing_view',
        'Property Inquiry',
        'Viewed listing details and requested more information',
        jsonb_build_object(
          'property_url', 'https://example.com/property/123',
          'source', 'website',
          'user_agent', 'Mozilla/5.0...'
        ),
        NOW() - INTERVAL '2 days'
      ),
      (
        3002,
        first_buyer_id,
        null,
        first_agent_id,
        'registration',
        'website_signup',
        'Website Registration',
        'Signed up for property alerts',
        jsonb_build_object(
          'source', 'website',
          'referrer', 'https://google.com'
        ),
        NOW() - INTERVAL '5 days'
      )
    ON CONFLICT (fub_event_id) DO NOTHING;

    -- Create sample notes
    INSERT INTO fub_notes (
      fub_note_id,
      person_id,
      agent_id,
      subject,
      body,
      note_type
    ) VALUES 
      (
        4001,
        first_buyer_id,
        first_agent_id,
        'Initial consultation call',
        'Spoke with client about their home buying needs. They are looking for a 3-4 bedroom home in good school district. Budget up to $850k. Pre-approved with ABC Mortgage.',
        'consultation'
      ),
      (
        4002,
        first_buyer_id,
        first_agent_id,
        'Property showing scheduled',
        'Scheduled showing for Saturday 2pm at 123 Main St. Client is very interested in this property.',
        'showing'
      )
    ON CONFLICT (fub_note_id) DO NOTHING;

    -- Create sample tasks
    INSERT INTO fub_tasks (
      fub_task_id,
      person_id,
      assigned_to,
      created_by,
      title,
      description,
      due_date,
      priority,
      task_type,
      status
    ) VALUES 
      (
        5001,
        first_buyer_id,
        first_agent_id,
        first_agent_id,
        'Follow up after property showing',
        'Call client to get feedback on the property showing and discuss next steps',
        CURRENT_DATE + INTERVAL '1 day',
        'high',
        'follow_up',
        'pending'
      ),
      (
        5002,
        first_buyer_id,
        first_agent_id,
        first_agent_id,
        'Send comparable properties',
        'Email client with 3-4 comparable properties in their target area',
        CURRENT_DATE + INTERVAL '2 days',
        'normal',
        'marketing',
        'pending'
      )
    ON CONFLICT (fub_task_id) DO NOTHING;

    -- Create sample appointment
    INSERT INTO fub_appointments (
      fub_appointment_id,
      person_id,
      agent_id,
      title,
      description,
      location,
      start_time,
      end_time,
      status
    ) VALUES (
      6001,
      first_buyer_id,
      first_agent_id,
      'Property Showing - 123 Main St',
      'Show the 4-bedroom colonial at 123 Main St',
      '123 Main St, Los Angeles, CA',
      CURRENT_DATE + INTERVAL '2 days' + TIME '14:00:00',
      CURRENT_DATE + INTERVAL '2 days' + TIME '15:00:00',
      'scheduled'
    ) ON CONFLICT (fub_appointment_id) DO NOTHING;

    -- Assign action plan
    INSERT INTO fub_action_plan_people (
      fub_assignment_id,
      action_plan_id,
      person_id,
      agent_id,
      status
    ) VALUES (
      7001,
      (SELECT id FROM fub_action_plans WHERE fub_action_plan_id = 1),
      first_buyer_id,
      first_agent_id,
      'active'
    ) ON CONFLICT (fub_assignment_id) DO NOTHING;
  END IF;
END $$;