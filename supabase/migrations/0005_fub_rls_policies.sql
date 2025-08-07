-- ===========================================
-- FUB Integration RLS Policies
-- ===========================================

-- Enable RLS on all FUB tables
ALTER TABLE fub_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_text_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_action_plan_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fub_configuration ENABLE ROW LEVEL SECURITY;

-- ====== FUB TEAMS POLICIES ======
-- Agents can view all teams
CREATE POLICY "Agents can view teams" ON fub_teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Only admins can modify teams
CREATE POLICY "Admins can modify teams" ON fub_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== FUB TEAM MEMBERS POLICIES ======
-- Agents can view team memberships
CREATE POLICY "Agents can view team members" ON fub_team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Team leaders and admins can modify team memberships
CREATE POLICY "Team leaders can modify members" ON fub_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (
        agents.role IN ('Admin', 'Owner', 'Broker') 
        OR agents.is_owner = true
        OR agents.id = agent_id -- Team member can view their own membership
      )
    )
  );

-- ====== FUB PIPELINES POLICIES ======
-- Agents can view pipelines
CREATE POLICY "Agents can view pipelines" ON fub_pipelines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Only admins can modify pipelines
CREATE POLICY "Admins can modify pipelines" ON fub_pipelines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== FUB STAGES POLICIES ======
-- Agents can view stages
CREATE POLICY "Agents can view stages" ON fub_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Only admins can modify stages
CREATE POLICY "Admins can modify stages" ON fub_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== FUB DEALS POLICIES ======
-- Agents can view deals they're assigned to or their team's deals
CREATE POLICY "Agents can view their deals" ON fub_deals
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- Buyers can view their own deals
CREATE POLICY "Buyers can view their deals" ON fub_deals
  FOR SELECT USING (person_id = auth.uid());

-- Agents can create and update deals for their contacts
CREATE POLICY "Agents can manage deals" ON fub_deals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
    OR
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- ====== FUB EVENTS POLICIES ======
-- People can view their own events
CREATE POLICY "People can view their events" ON fub_events
  FOR SELECT USING (person_id = auth.uid());

-- Agents can view events for their contacts
CREATE POLICY "Agents can view contact events" ON fub_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
    OR
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Agents can create events
CREATE POLICY "Agents can create events" ON fub_events
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- ====== FUB NOTES POLICIES ======
-- People can view notes about them (unless private)
CREATE POLICY "People can view their notes" ON fub_notes
  FOR SELECT USING (
    person_id = auth.uid() AND is_private = false
  );

-- Agents can view and manage notes for their contacts
CREATE POLICY "Agents can manage contact notes" ON fub_notes
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- ====== FUB TASKS POLICIES ======
-- Agents can view tasks assigned to them
CREATE POLICY "Agents can view their tasks" ON fub_tasks
  FOR SELECT USING (
    assigned_to IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    created_by IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Agents can create and update tasks
CREATE POLICY "Agents can manage tasks" ON fub_tasks
  FOR ALL USING (
    assigned_to IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    created_by IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- ====== FUB APPOINTMENTS POLICIES ======
-- People can view their appointments
CREATE POLICY "People can view their appointments" ON fub_appointments
  FOR SELECT USING (person_id = auth.uid());

-- Agents can view and manage appointments for their contacts
CREATE POLICY "Agents can manage appointments" ON fub_appointments
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- ====== FUB CALLS POLICIES ======
-- People can view their call logs
CREATE POLICY "People can view their calls" ON fub_calls
  FOR SELECT USING (person_id = auth.uid());

-- Agents can view and create call logs
CREATE POLICY "Agents can manage calls" ON fub_calls
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- ====== FUB TEXT MESSAGES POLICIES ======
-- People can view their text messages
CREATE POLICY "People can view their messages" ON fub_text_messages
  FOR SELECT USING (person_id = auth.uid());

-- Agents can view and create text message logs
CREATE POLICY "Agents can manage text messages" ON fub_text_messages
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- ====== FUB ACTION PLANS POLICIES ======
-- Agents can view action plans
CREATE POLICY "Agents can view action plans" ON fub_action_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Only admins can modify action plans
CREATE POLICY "Admins can modify action plans" ON fub_action_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== FUB ACTION PLAN PEOPLE POLICIES ======
-- People can view their action plan assignments
CREATE POLICY "People can view their action plan assignments" ON fub_action_plan_people
  FOR SELECT USING (person_id = auth.uid());

-- Agents can view and manage action plan assignments for their contacts
CREATE POLICY "Agents can manage action plan assignments" ON fub_action_plan_people
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents a
      JOIN buyers b ON b.assigned_user_id = a.id
      WHERE a.user_id = auth.uid() AND b.id = person_id
    )
  );

-- ====== FUB CUSTOM FIELDS POLICIES ======
-- Agents can view custom fields
CREATE POLICY "Agents can view custom fields" ON fub_custom_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE agents.user_id = auth.uid())
  );

-- Only admins can modify custom fields
CREATE POLICY "Admins can modify custom fields" ON fub_custom_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== FUB SYNC LOG POLICIES ======
-- Only admins can view sync logs
CREATE POLICY "Admins can view sync logs" ON fub_sync_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- System can create sync logs (for automated processes)
CREATE POLICY "System can create sync logs" ON fub_sync_log
  FOR INSERT WITH CHECK (true);

-- ====== FUB WEBHOOK EVENTS POLICIES ======
-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events" ON fub_webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- System can create webhook events (for automated processes)
CREATE POLICY "System can create webhook events" ON fub_webhook_events
  FOR INSERT WITH CHECK (true);

-- ====== FUB CONFIGURATION POLICIES ======
-- Only admins can view and modify configuration
CREATE POLICY "Admins can manage configuration" ON fub_configuration
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.user_id = auth.uid() 
      AND (agents.role IN ('Admin', 'Owner', 'Broker') OR agents.is_owner = true)
    )
  );

-- ====== HELPER FUNCTIONS ======
-- Function to check if user is an agent
CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin/owner
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents 
    WHERE user_id = auth.uid() 
    AND (role IN ('Admin', 'Owner', 'Broker') OR is_owner = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if agent has access to a person
CREATE OR REPLACE FUNCTION public.agent_can_access_person(person_uuid UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents a
    JOIN buyers b ON b.assigned_user_id = a.id
    WHERE a.user_id = auth.uid() AND b.id = person_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;