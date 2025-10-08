// src/services/properties/interactions.ts
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export type PropertyAction = 'pass' | 'save' | 'love' | 'schedule_tour';

export interface PropertyInteraction {
  buyerId: string;
  propertyId: string;
  action: PropertyAction;
}

/**
 * Helper method to determine which client to use
 */
function getClient() {
  // Check if we have a mock session - if so, use admin client to bypass RLS
  const mockSession = localStorage.getItem('mockAuthSession');
  if (mockSession) {
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Handle property interaction by updating buyer_properties table
 */
export async function handlePropertyInteraction({ 
  buyerId, 
  propertyId, 
  action 
}: PropertyInteraction): Promise<boolean> {
  try {
    console.log('Handling property interaction:', { buyerId, propertyId, action });

    // Map actions to interest_level values (based on AGENT_WORKFLOW_REQUIREMENTS.md)
    const interestLevelMapping = {
      'pass': 'passed',
      'save': 'interested', // Keep as interested but saved
      'love': 'loved', // This will trigger timeline creation via database trigger
      'schedule_tour': 'viewing_scheduled' // This will trigger timeline creation via database trigger
    };

    // Map actions to is_active values
    const isActiveMapping = {
      'pass': false, // Passed properties are no longer active
      'save': true,
      'love': true,
      'schedule_tour': true
    };

    const newInterestLevel = interestLevelMapping[action];
    const isActive = isActiveMapping[action];

    // First, try to update existing record
    const client = getClient();
    const { data: existingRecord, error: fetchError } = await client
      .from('buyer_properties')
      .select('id, interest_level')
      .eq('buyer_id', buyerId)
      .eq('property_id', propertyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing record:', fetchError);
      return false;
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await client
        .from('buyer_properties')
        .update({
          interest_level: newInterestLevel,
          is_active: isActive,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating buyer_properties:', updateError);
        return false;
      }
    } else {
      // Insert new record - get organization_id from buyer
      const { data: buyerData, error: buyerError } = await client
        .from('persons')
        .select('organization_id')
        .eq('id', buyerId)
        .single();

      if (buyerError) {
        console.error('Error fetching buyer organization:', buyerError);
        return false;
      }

      const { error: insertError } = await client
        .from('buyer_properties')
        .insert({
          organization_id: buyerData.organization_id,
          buyer_id: buyerId,
          property_id: propertyId,
          relationship_type: 'home_buyer',
          interest_level: newInterestLevel,
          is_active: isActive
        });

      if (insertError) {
        console.error('Error inserting buyer_properties:', insertError);
        return false;
      }
    }

    console.log(`Property ${action} completed successfully - interest_level: ${newInterestLevel}`);
    return true;

  } catch (error) {
    console.error('Error in handlePropertyInteraction:', error);
    return false;
  }
}

/**
 * Get notes based on action type
 */
function getActionNotes(action: PropertyAction): string {
  const notesMapping = {
    'pass': 'Buyer passed on this property - not interested',
    'save': 'Buyer saved this property for later review',
    'love': 'Buyer loves this property and wants to explore further',
    'schedule_tour': 'Buyer scheduled a tour for this property'
  };
  
  return notesMapping[action] || '';
}

/**
 * Get properties for dashboard based on their interaction status
 */
export async function getBuyerInteractionProperties(buyerId: string) {
  try {
    const { data, error } = await supabase
      .from('buyer_properties')
      .select(`
        id,
        status,
        notes,
        added_at,
        updated_at,
        properties (
          id,
          address,
          city,
          state,
          listing_price,
          bedrooms,
          bathrooms,
          square_feet,
          photos,
          property_type
        )
      `)
      .eq('buyer_id', buyerId)
      .in('status', ['researching', 'viewing'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching buyer interaction properties:', error);
      return { saved: [], loved: [], tourScheduled: [] };
    }

    // Categorize properties based on status and notes
    const saved = data?.filter(item => 
      item.status === 'researching' && item.notes?.includes('saved')
    ) || [];

    const loved = data?.filter(item => 
      item.status === 'viewing' && item.notes?.includes('loves')
    ) || [];

    const tourScheduled = data?.filter(item => 
      item.notes?.includes('scheduled a tour')
    ) || [];

    return { saved, loved, tourScheduled };

  } catch (error) {
    console.error('Error in getBuyerInteractionProperties:', error);
    return { saved: [], loved: [], tourScheduled: [] };
  }
}