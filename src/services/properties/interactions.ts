// src/services/properties/interactions.ts
import { supabase } from '@/lib/supabaseClient';

export type PropertyAction = 'pass' | 'save' | 'love' | 'schedule_tour';

export interface PropertyInteraction {
  buyerId: string;
  propertyId: string;
  action: PropertyAction;
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

    // Map actions to database status values
    const statusMapping = {
      'pass': 'withdrawn', // Mark as passed/not interested (keeps record)
      'save': 'researching', // Keep as researching but add to saved
      'love': 'viewing', // Mark as interested/viewing
      'schedule_tour': 'viewing' // Mark as tour scheduled
    };

    // For all actions, we update or insert the buyer_properties record
    const newStatus = statusMapping[action];
    const notes = getActionNotes(action);

    // First, try to update existing record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('buyer_properties')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('property_id', propertyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing record:', fetchError);
      return false;
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('buyer_properties')
        .update({
          status: newStatus,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating buyer_properties:', updateError);
        return false;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('buyer_properties')
        .insert({
          buyer_id: buyerId,
          property_id: propertyId,
          status: newStatus,
          notes: notes
        });

      if (insertError) {
        console.error('Error inserting buyer_properties:', insertError);
        return false;
      }
    }

    console.log(`Property ${action} completed successfully`);
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