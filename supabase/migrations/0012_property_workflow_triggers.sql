-- Property Workflow Management Triggers
-- This migration creates triggers to automatically manage property workflow states

-- Function to handle timeline creation when buyer shows interest
CREATE OR REPLACE FUNCTION create_timeline_on_interest_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If interest_level changed to 'loved' or 'viewing_scheduled', create timeline
    IF (OLD.interest_level IS DISTINCT FROM NEW.interest_level) AND 
       (NEW.interest_level IN ('loved', 'viewing_scheduled')) THEN
        
        -- Check if timeline already exists for this buyer_property
        IF NOT EXISTS (
            SELECT 1 FROM timelines 
            WHERE buyer_property_id = NEW.id AND is_active = true
        ) THEN
            -- Create new timeline
            INSERT INTO timelines (
                buyer_property_id,
                current_phase,
                current_fub_stage,
                timeline_name,
                timeline_notes,
                is_active
            ) VALUES (
                NEW.id,
                'pre_escrow',
                'active_client',
                CASE 
                    WHEN NEW.interest_level = 'loved' THEN 'Property Loved Timeline'
                    WHEN NEW.interest_level = 'viewing_scheduled' THEN 'Viewing Scheduled Timeline'
                    ELSE 'Property Timeline'
                END,
                'Timeline automatically created when buyer showed interest',
                true
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on buyer_properties table
DROP TRIGGER IF EXISTS trigger_create_timeline_on_interest_change ON buyer_properties;
CREATE TRIGGER trigger_create_timeline_on_interest_change
    AFTER UPDATE ON buyer_properties
    FOR EACH ROW
    EXECUTE FUNCTION create_timeline_on_interest_change();

-- Function to update property activity timestamps
CREATE OR REPLACE FUNCTION update_property_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at when buyer_properties changes
    UPDATE properties 
    SET last_activity_at = NOW()
    WHERE id = NEW.property_id;
    
    -- Update buyer_properties last_activity_at
    NEW.last_activity_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for property activity updates
DROP TRIGGER IF EXISTS trigger_update_property_activity ON buyer_properties;
CREATE TRIGGER trigger_update_property_activity
    BEFORE UPDATE ON buyer_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_property_activity();

-- Add comments for documentation
COMMENT ON FUNCTION create_timeline_on_interest_change() IS 'Automatically creates timeline when buyer loves property or schedules viewing';
COMMENT ON FUNCTION update_property_activity() IS 'Updates activity timestamps when buyer-property relationship changes';