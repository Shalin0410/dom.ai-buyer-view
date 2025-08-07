// Supabase Data Service Implementation
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { BaseDataService } from '../api/data';
import { ApiResponse, Buyer, Agent, Property, PropertyFilter, PropertyActivity, PropertySummary, ActionItem } from '../api/types';

export class SupabaseDataService extends BaseDataService {
  // Buyer operations
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching buyers:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data || []);
    } catch (error) {
      console.error('Error in getBuyers:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getBuyerById(id: string): Promise<ApiResponse<Buyer>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching buyer by ID:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in getBuyerById:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getBuyerByEmail(email: string): Promise<ApiResponse<Buyer>> {
    try {
      // First, get the buyer data
      const { data: buyerData, error: buyerError } = await supabase
        .from('buyers')
        .select('*')
        .eq('email', email)
        .single();

      if (buyerError) {
        if (buyerError.code === 'PGRST116') {
          // No rows returned - buyer not found
          return this.createResponse(null, 'Buyer not found');
        }
        console.error('Error fetching buyer by email:', buyerError);
        return this.createResponse(null, buyerError.message);
      }

      // If there's an agent_id, fetch the agent data
      if (buyerData.agent_id) {
        try {
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('id', buyerData.agent_id)
            .maybeSingle(); // Use maybeSingle instead of single to handle no rows case

          if (agentError) {
            console.warn('Error fetching agent data:', agentError);
            // Continue with buyer data even if agent fetch fails
          } else if (agentData) {
            // Map the agent data to match the Agent interface
            const agent: Agent = {
              id: agentData.id,
              first_name: agentData.first_name || 'Unknown',
              last_name: agentData.last_name || 'Agent',
              email: agentData.email || '',
              phone: agentData.phone || null,
              created_at: agentData.created_at,
              updated_at: agentData.updated_at
            };
            
            // Combine buyer and agent data
            return this.createResponse({
              ...buyerData,
              agent
            });
          }
        } catch (error) {
          console.error('Unexpected error fetching agent:', error);
          // Continue with buyer data even if agent fetch fails
        }
      }

      // Return buyer data with null agent if no agent_id or agent fetch failed
      const buyer: Buyer = {
        ...buyerData,
        agent: null
      };
      
      return this.createResponse(buyer);
    } catch (error) {
      console.error('Error in getBuyerByEmail:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async createBuyer(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Buyer>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .insert(buyer)
        .select()
        .single();

      if (error) {
        console.error('Error creating buyer:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in createBuyer:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateBuyer(id: string, updates: Partial<Buyer>): Promise<ApiResponse<Buyer>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating buyer:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in updateBuyer:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async deleteBuyer(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting buyer:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(null);
    } catch (error) {
      console.error('Error in deleteBuyer:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Agent operations
  async getAgentById(id: string): Promise<ApiResponse<Agent | null>> {
    console.log('getAgentById - Fetching agent with ID:', id);
    
    if (!id) {
      console.error('getAgentById - No ID provided');
      return this.createResponse(null, 'Agent ID is required');
    }

    try {
      console.log('getAgentById - Executing database function get_agent_by_id...');
      
      // Use the database function which enforces RLS
      const { data, error } = await supabase
        .rpc('get_agent_by_id', { agent_id: id });

      console.log('getAgentById - Database function response:', {
        data,
        error,
        hasData: !!data
      });

      if (error) {
        console.error('getAgentById - Error from database function:', error);
        return this.createResponse(null, error.message);
      }

      if (!data) {
        console.warn('getAgentById - No agent found with ID:', id);
        return this.createResponse(null, 'Agent not found or not authorized');
      }

      // If we got here, we have valid agent data
      console.log('getAgentById - Successfully retrieved agent data:', data);
      return this.createResponse(data);

      if (error) {
        console.error('getAgentById - Error fetching agent:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return this.createResponse(null, error.message);
      }

      // If no data is returned, the agent doesn't exist
      if (!data) {
        console.warn('getAgentById - No agent found with ID:', id);
        return this.createResponse(null, 'Agent not found');
      }

      console.log('getAgentById - Successfully retrieved agent data:', data);
      return this.createResponse(data);
    } catch (error) {
      console.error('getAgentById - Unexpected error:', error);
      // If we get here, it might be because multiple rows were returned
      // Let's try a different approach
      try {
        console.log('getAgentById - Trying alternative query with limit 1...');
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .limit(1);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          console.warn('getAgentById - No agent found with ID (alternative query):', id);
          return this.createResponse(null, 'Agent not found');
        }

        console.log('getAgentById - Successfully retrieved agent data (alternative query):', data[0]);
        return this.createResponse(data[0]);
      } catch (retryError) {
        console.error('getAgentById - Error in alternative query:', retryError);
        const apiError = this.handleError(retryError);
        return this.createResponse(null, apiError.message);
      }
    }
  }

  async getAgents(): Promise<ApiResponse<Agent[]>> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data || []);
    } catch (error) {
      console.error('Error in getAgents:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Agent>> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single();

      if (error) {
        console.error('Error creating agent:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in createAgent:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<ApiResponse<Agent>> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating agent:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in updateAgent:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async deleteAgent(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting agent:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(null);
    } catch (error) {
      console.error('Error in deleteAgent:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Relationship operations
  async getBuyersWithAgents(): Promise<ApiResponse<Buyer[]>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select(`
          *,
          agent:agents(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching buyers with agents:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data || []);
    } catch (error) {
      console.error('Error in getBuyersWithAgents:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getBuyersByAgentId(agentId: string): Promise<ApiResponse<Buyer[]>> {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select(`
          *,
          agent:agents(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching buyers by agent ID:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data || []);
    } catch (error) {
      console.error('Error in getBuyersByAgentId:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Property operations
  async getProperties(buyerId?: string, filter?: PropertyFilter): Promise<ApiResponse<Property[]>> {
    try {
      let query = supabase
        .from('buyer_properties')
        .select(`
          *,
          property:properties(
            id,
            address,
            city,
            state,
            zip_code,
            listing_price,
            bedrooms,
            bathrooms,
            square_feet,
            lot_size,
            year_built,
            property_type,
            mls_number,
            listing_url,
            created_at,
            updated_at
          )
        `);

      // Filter by buyer if specified
      if (buyerId) {
        query = query.eq('buyer_id', buyerId);
      }

      // Apply filters based on buyer_properties data
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          query = query.in('status', filter.status);
        }
        if (filter.buying_stage && filter.buying_stage.length > 0) {
          query = query.in('buying_stage', filter.buying_stage);
        }
        if (filter.action_required && filter.action_required.length > 0) {
          query = query.in('action_required', filter.action_required);
        }
        if (filter.price_min) {
          query = query.gte('property.listing_price', filter.price_min);
        }
        if (filter.price_max) {
          query = query.lte('property.listing_price', filter.price_max);
        }
        if (filter.bedrooms_min) {
          query = query.gte('property.bedrooms', filter.bedrooms_min);
        }
        if (filter.bathrooms_min) {
          query = query.gte('property.bathrooms', filter.bathrooms_min);
        }
        if (filter.property_type && filter.property_type.length > 0) {
          query = query.in('property.property_type', filter.property_type);
        }
        if (filter.last_activity_days) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - filter.last_activity_days);
          query = query.gte('last_activity_at', cutoffDate.toISOString());
        }
      }

      query = query.order('last_activity_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        return this.createResponse(null, error.message);
      }

      // Fetch photos for all properties
      const propertyIds = (data || []).map(item => item.property.id);
      let photos: any[] = [];
      if (propertyIds.length > 0) {
        const { data: photosData } = await supabase
          .from('property_photos')
          .select('*')
          .in('property_id', propertyIds)
          .order('order', { ascending: true });
        photos = photosData || [];
      }

      // Transform data to match expected Property interface
      const transformedProperties = (data || []).map(buyerProperty => {
        const property = buyerProperty.property;
        const propertyPhotos = photos.filter(photo => photo.property_id === property.id);

        return {
          id: property.id,
          // Core property info
          address: property.address,
          city: property.city,
          state: property.state,
          zip_code: property.zip_code,
          listing_price: property.listing_price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_feet: property.square_feet,
          lot_size: property.lot_size,
          year_built: property.year_built,
          property_type: property.property_type,
          mls_number: property.mls_number,
          listing_url: property.listing_url,
          created_at: property.created_at,
          updated_at: property.updated_at,
          
          // Buyer-specific info
          buyer_id: buyerProperty.buyer_id,
          status: buyerProperty.status,
          buying_stage: buyerProperty.buying_stage,
          action_required: buyerProperty.action_required,
          notes: buyerProperty.notes,
          purchase_price: buyerProperty.purchase_price,
          offer_date: buyerProperty.offer_date,
          closing_date: buyerProperty.closing_date,
          last_activity_at: buyerProperty.last_activity_at,
          
          // Related data
          photos: propertyPhotos.map(photo => ({
            id: photo.id,
            property_id: photo.property_id,
            url: photo.url,
            caption: photo.caption,
            is_primary: photo.is_primary,
            order: photo.order,
            created_at: photo.created_at,
            updated_at: photo.updated_at
          }))
        };
      });

      return this.createResponse(transformedProperties);
    } catch (error) {
      console.error('Error in getProperties:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    try {
      // First get the property data
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) {
        console.error('Error fetching property by ID:', propertyError);
        return this.createResponse(null, propertyError.message);
      }

      // Get buyer-property relationship if it exists
      const { data: buyerPropertyData } = await supabase
        .from('buyer_properties')
        .select('*')
        .eq('property_id', id)
        .maybeSingle();

      // Fetch photos
      const { data: photos } = await supabase
        .from('property_photos')
        .select('*')
        .eq('property_id', id)
        .order('order', { ascending: true });

      // Transform to Property interface
      const property: Property = {
        id: propertyData.id,
        // Core property info
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip_code: propertyData.zip_code,
        listing_price: propertyData.listing_price,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        square_feet: propertyData.square_feet,
        lot_size: propertyData.lot_size,
        year_built: propertyData.year_built,
        property_type: propertyData.property_type,
        mls_number: propertyData.mls_number,
        listing_url: propertyData.listing_url,
        created_at: propertyData.created_at,
        updated_at: propertyData.updated_at,
        
        // Buyer-specific info (from buyer_properties or defaults)
        buyer_id: buyerPropertyData?.buyer_id,
        status: buyerPropertyData?.status || 'researching',
        buying_stage: buyerPropertyData?.buying_stage || 'initial_research',
        action_required: buyerPropertyData?.action_required || 'none',
        notes: buyerPropertyData?.notes,
        purchase_price: buyerPropertyData?.purchase_price,
        offer_date: buyerPropertyData?.offer_date,
        closing_date: buyerPropertyData?.closing_date,
        last_activity_at: buyerPropertyData?.last_activity_at || propertyData.created_at,
        
        // Related data
        photos: (photos || []).map(photo => ({
          id: photo.id,
          property_id: photo.property_id,
          url: photo.url,
          caption: photo.caption,
          is_primary: photo.is_primary,
          order: photo.order,
          created_at: photo.created_at,
          updated_at: photo.updated_at
        }))
      };

      return this.createResponse(property);
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'last_activity_at' | 'photos'>): Promise<ApiResponse<Property>> {
    try {
      const now = new Date().toISOString();
      const propertyData = {
        ...property,
        last_activity_at: now
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        console.error('Error creating property:', error);
        return this.createResponse(null, error.message);
      }

      const propertyWithPhotos = {
        ...data,
        photos: []
      };

      return this.createResponse(propertyWithPhotos);
    } catch (error) {
      console.error('Error in createProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>> {
    try {
      const updateData = {
        ...updates,
        last_activity_at: new Date().toISOString()
      };
      
      // Remove photos from updates as they're handled separately
      delete updateData.photos;

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        return this.createResponse(null, error.message);
      }

      // Fetch photos
      const { data: photos } = await supabase
        .from('property_photos')
        .select('*')
        .eq('property_id', id)
        .order('order', { ascending: true });

      const propertyWithPhotos = {
        ...data,
        photos: photos || []
      };

      return this.createResponse(propertyWithPhotos);
    } catch (error) {
      console.error('Error in updateProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async deleteProperty(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting property:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(null);
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getPropertyActivities(propertyId: string): Promise<ApiResponse<PropertyActivity[]>> {
    try {
      // First get the buyer_property_id for this property
      const { data: buyerPropertyData, error: buyerPropertyError } = await supabase
        .from('buyer_properties')
        .select('id')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (buyerPropertyError) {
        console.error('Error fetching buyer property for activities:', buyerPropertyError);
        return this.createResponse(null, buyerPropertyError.message);
      }

      if (!buyerPropertyData) {
        // No buyer-property relationship exists, return empty array
        return this.createResponse([]);
      }

      // Now get activities for this buyer_property_id
      const { data, error } = await supabase
        .from('property_activities')
        .select('*')
        .eq('buyer_property_id', buyerPropertyData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching property activities:', error);
        return this.createResponse(null, error.message);
      }

      // Transform to match PropertyActivity interface
      const activities = (data || []).map(activity => ({
        id: activity.id,
        property_id: propertyId, // Add the property_id for the interface
        type: activity.type,
        title: activity.title,
        description: activity.description,
        created_at: activity.created_at,
        created_by: activity.created_by
      }));

      return this.createResponse(activities);
    } catch (error) {
      console.error('Error in getPropertyActivities:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async addPropertyActivity(activity: Omit<PropertyActivity, 'id' | 'created_at'>): Promise<ApiResponse<PropertyActivity>> {
    try {
      const { data, error } = await supabase
        .from('property_activities')
        .insert(activity)
        .select()
        .single();

      if (error) {
        console.error('Error adding property activity:', error);
        return this.createResponse(null, error.message);
      }

      // Update property's last_activity_at
      await supabase
        .from('properties')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', activity.property_id);

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in addPropertyActivity:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getPropertySummary(buyerId: string): Promise<ApiResponse<PropertySummary>> {
    try {
      const { data: buyerProperties, error } = await supabase
        .from('buyer_properties')
        .select('status, buying_stage, action_required')
        .eq('buyer_id', buyerId);

      if (error) {
        console.error('Error fetching property summary:', error);
        return this.createResponse(null, error.message);
      }

      const summary: PropertySummary = {
        total_properties: buyerProperties?.length || 0,
        by_status: {
          researching: 0,
          viewing: 0,
          offer_submitted: 0,
          under_contract: 0,
          in_escrow: 0,
          closed: 0,
          withdrawn: 0
        },
        by_stage: {
          initial_research: 0,
          active_search: 0,
          offer_negotiation: 0,
          under_contract: 0,
          closing: 0
        },
        requiring_action: 0
      };

      buyerProperties?.forEach(bp => {
        // Map buyer_properties status to PropertyStatus
        const mappedStatus = bp.status === 'interested' ? 'researching' : bp.status;
        if (summary.by_status[mappedStatus as keyof typeof summary.by_status] !== undefined) {
          summary.by_status[mappedStatus as keyof typeof summary.by_status]++;
        }
        
        summary.by_stage[bp.buying_stage]++;
        if (bp.action_required !== 'none') {
          summary.requiring_action++;
        }
      });

      return this.createResponse(summary);
    } catch (error) {
      console.error('Error in getPropertySummary:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // New methods for buyer-property relationships
  async getAvailableProperties(filter?: PropertyFilter, buyerId?: string): Promise<ApiResponse<Property[]>> {
    try {
      // Start with a query to get properties assigned to the buyer
      let query = supabase
        .from('buyer_properties')
        .select(`
          property:properties (
            *
          )
        `)
        .eq('buyer_id', buyerId || '');

      // If no buyer ID is provided, fall back to the old behavior (for backward compatibility)
      if (!buyerId) {
        query = supabase
          .from('properties')
          .select('*')
          .eq('status', 'available');
      }

      // Apply filters
      if (filter) {
        if (filter.price_min) {
          query = query.gte('listing_price', filter.price_min);
        }
        if (filter.price_max) {
          query = query.lte('listing_price', filter.price_max);
        }
        if (filter.bedrooms_min) {
          query = query.gte('bedrooms', filter.bedrooms_min);
        }
        if (filter.bathrooms_min) {
          query = query.gte('bathrooms', filter.bathrooms_min);
        }
        if (filter.property_type && filter.property_type.length > 0) {
          query = query.in('property_type', filter.property_type);
        }
      }

      // Use 'added_at' for buyer_properties and 'created_at' for properties
      const orderByColumn = buyerId ? 'added_at' : 'created_at';
      query = query.order(orderByColumn, { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available properties:', error);
        return this.createResponse(null, error.message);
      }

      // Extract properties from the joined result if we're using buyer_properties
      const properties = buyerId 
        ? (data || []).map((item: any) => item.property)
        : (data || []);

      // Fetch photos for all properties
      const propertyIds = properties.map((property: any) => property.id);
      let photos: any[] = [];
      if (propertyIds.length > 0) {
        const { data: photosData } = await supabase
          .from('property_photos')
          .select('*')
          .in('property_id', propertyIds)
          .order('order', { ascending: true });
        photos = photosData || [];
      }

      // Transform to Property interface
      const transformedProperties = properties.map((property: any) => {
        const propertyPhotos = photos.filter(photo => photo.property_id === property.id);
        
        return {
        id: property.id,
        buyer_id: '', // No buyer relationship yet
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code || '',
        listing_price: property.listing_price,
        purchase_price: undefined,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_feet: property.square_feet,
        lot_size: property.lot_size,
        year_built: property.year_built,
        property_type: property.property_type || 'single_family',
        status: 'researching' as const,
        buying_stage: 'initial_research' as const,
        action_required: 'none' as const,
        mls_number: property.mls_number,
        listing_url: property.listing_url,
        notes: undefined,
        last_activity_at: property.created_at,
        created_at: property.created_at,
        updated_at: property.updated_at || property.created_at,
        photos: propertyPhotos.map(photo => ({
          id: photo.id,
          property_id: photo.property_id,
          url: photo.url,
          caption: photo.caption,
          is_primary: photo.is_primary,
          order: photo.order,
          created_at: photo.created_at,
          updated_at: photo.updated_at
        }))
        }
      });

      return this.createResponse(transformedProperties);
    } catch (error) {
      console.error('Error in getAvailableProperties:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async addPropertyToBuyer(buyerId: string, propertyId: string): Promise<ApiResponse<any>> {
    try {
      // First, check if the property is available (not in escrow by someone else)
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('overall_status')
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('Error checking property status:', propertyError);
        return this.createResponse(null, propertyError.message);
      }

      // If property is in escrow or under contract by someone else, don't allow tracking
      if (property.overall_status === 'in_escrow' || property.overall_status === 'under_contract') {
        return this.createResponse(
          null, 
          'This property is no longer available for tracking as it is already in escrow or under contract.'
        );
      }

      // Check if the buyer is already tracking this property
      const { data: existing, error: existingError } = await supabase
        .from('buyer_properties')
        .select('id')
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing tracking:', existingError);
        return this.createResponse(null, existingError.message);
      }

      if (existing) {
        return this.createResponse(
          { id: existing.id, message: 'You are already tracking this property' },
          null
        );
      }

      // Add the property to buyer's tracked properties
      const { data, error } = await supabase
        .from('buyer_properties')
        .insert({
          buyer_id: buyerId,
          property_id: propertyId,
          status: 'researching',
          buying_stage: 'initial_research',
          action_required: 'schedule_viewing',
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding property to buyer:', error);
        return this.createResponse(null, error.message);
      }

      // Add an activity log entry
      await supabase
        .from('property_activities')
        .insert({
          buyer_property_id: data.id,
          activity_type: 'property_added',
          title: 'Property Added to Tracked List',
          description: 'You started tracking this property.'
        });

      return this.createResponse({
        ...data,
        message: 'Property added to your tracked properties'
      });
    } catch (error) {
      console.error('Error in addPropertyToBuyer:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateBuyerProperty(buyerId: string, propertyId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      // First, verify the buyer has access to this property
      const { data: existing, error: accessError } = await supabase
        .from('buyer_properties')
        .select('id, status')
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .single();

      if (accessError || !existing) {
        console.error('Error or no access to property:', accessError);
        return this.createResponse(
          null, 
          accessError?.message || 'You do not have access to update this property.'
        );
      }

      // Prepare the update data
      const updateData: any = {
        ...updates,
        last_activity_at: new Date().toISOString()
      };

      // Update the buyer_property relationship
      const { data, error } = await supabase
        .from('buyer_properties')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating buyer property:', error);
        return this.createResponse(null, error.message);
      }

      // If status was updated to in_escrow, update the property's overall_status
      if (updates.status === 'in_escrow') {
        await supabase
          .from('properties')
          .update({ overall_status: 'in_escrow' })
          .eq('id', propertyId);
      }

      // Add an activity log entry if status or important fields changed
      if (updates.status || updates.buying_stage || updates.action_required) {
        let activityType = 'status_updated';
        let activityTitle = 'Status Updated';
        let activityDescription = `Status changed to ${updates.status || 'unknown'}`;

        if (updates.status === 'in_escrow') {
          activityType = 'entered_escrow';
          activityTitle = 'Entered Escrow';
          activityDescription = 'Property entered escrow';
        } else if (updates.status === 'under_contract') {
          activityType = 'under_contract';
          activityTitle = 'Under Contract';
          activityDescription = 'Offer accepted, under contract';
        } else if (updates.status === 'closed') {
          activityType = 'closed';
          activityTitle = 'Purchase Closed';
          activityDescription = 'Property purchase completed';
        }

        await supabase
          .from('property_activities')
          .insert({
            buyer_property_id: existing.id,
            activity_type: activityType,
            title: activityTitle,
            description: activityDescription
          });
      }

      return this.createResponse({
        ...data,
        message: 'Property updated successfully'
      });
    } catch (error) {
      console.error('Error in updateBuyerProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getActionItems(buyerId: string): Promise<ApiResponse<ActionItem[]>> {
    try {
      // Get all buyer properties that require action
      const { data, error } = await supabase
        .from('buyer_properties')
        .select(`
          id,
          buyer_id,
          property_id,
          status,
          buying_stage,
          action_required,
          notes,
          offer_date,
          closing_date,
          last_activity_at,
          property:properties(
            id,
            address,
            city,
            state
          )
        `)
        .eq('buyer_id', buyerId)
        .neq('action_required', 'none')
        .order('last_activity_at', { ascending: false });

      if (error) {
        console.error('Error fetching action items:', error);
        return this.createResponse(null, error.message);
      }

      // Transform the data into ActionItem format
      const actionItems: ActionItem[] = (data || []).map(item => {
        const property = item.property;
        
        // Generate title based on action required
        const getActionTitle = (buyingStage: string, actionRequired: string, status: string) => {
          // Primary logic: base title on buying stage for proper correlation
          switch (buyingStage) {
            case 'initial_research':
              switch (actionRequired) {
                case 'schedule_viewing': return 'Schedule Property Viewing';
                default: return 'Research Property Details';
              }
            case 'active_search':
              switch (actionRequired) {
                case 'schedule_viewing': return 'Schedule Property Viewing';
                case 'submit_offer': return 'Prepare Offer Strategy';
                default: return 'Continue Property Search';
              }
            case 'offer_negotiation':
              switch (actionRequired) {
                case 'submit_offer': return 'Submit Offer';
                case 'review_documents': return 'Review Offer Terms';
                default: return 'Negotiate Offer Terms';
              }
            case 'under_contract':
              switch (actionRequired) {
                case 'review_documents': return 'Review Contract Documents';
                case 'inspection': return 'Schedule Home Inspection';
                case 'appraisal': return 'Coordinate Appraisal';
                default: return 'Manage Contract Process';
              }
            case 'closing':
              switch (actionRequired) {
                case 'final_walkthrough': return 'Final Walkthrough';
                case 'review_documents': return 'Review Closing Documents';
                default: return 'Prepare for Closing';
              }
            default:
              // Fallback to action-based titles
              switch (actionRequired) {
                case 'schedule_viewing': return 'Schedule Property Viewing';
                case 'submit_offer': return 'Submit Offer';
                case 'review_documents': return 'Review Documents';
                case 'inspection': return 'Schedule Home Inspection';
                case 'appraisal': return 'Schedule Appraisal';
                case 'final_walkthrough': return 'Complete Final Walkthrough';
                default: return 'Property Action Required';
              }
          }
        };

        // Calculate priority based on stage and dates with logical correlation
        const getPriority = (stage: string, status: string, offerDate?: string, closingDate?: string) => {
          // Urgent if closing is soon
          if (closingDate) {
            const daysToClosing = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysToClosing <= 7) return 'urgent';
            if (daysToClosing <= 14) return 'high';
          }
          
          // Priority based on buying stage correlation
          switch (stage) {
            case 'closing':
              return 'urgent'; // Always urgent when approaching closing
            case 'under_contract':
              return 'high'; // High priority during contract phase
            case 'offer_negotiation':
              return 'high'; // High priority for offers
            case 'active_search':
              return 'medium'; // Medium for active searching
            case 'initial_research':
              return 'low'; // Low for research phase
            default:
              // Fallback to status-based priority
              if (status === 'under_contract' || status === 'in_escrow') return 'high';
              if (status === 'offer_submitted') return 'medium';
              return 'medium';
          }
        };

        // Calculate due date based on action and status
        const getDueDate = (action: string, status: string, offerDate?: string, closingDate?: string) => {
          const now = new Date();
          
          if (closingDate) {
            // If we have a closing date, base due dates on that
            const closingDateObj = new Date(closingDate);
            switch (action) {
              case 'inspection':
                // Inspection typically 5-10 days after offer
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
              case 'appraisal':
                // Appraisal typically 2-3 weeks before closing
                return new Date(closingDateObj.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
              case 'final_walkthrough':
                // Final walkthrough typically 1-2 days before closing
                return new Date(closingDateObj.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
              case 'review_documents':
                // Document review should be done soon
                return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
            }
          }
          
          // Default due dates based on action type
          switch (action) {
            case 'schedule_viewing':
              return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days
            case 'submit_offer':
              return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day
            case 'review_documents':
              return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
            default:
              return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
          }
        };

        return {
          id: item.id,
          property_id: item.property_id,
          buyer_id: item.buyer_id,
          title: getActionTitle(item.buying_stage, item.action_required, item.status),
          description: `${property.address}, ${property.city}, ${property.state}`,
          property_address: `${property.address}, ${property.city}, ${property.state}`,
          action_required: item.action_required,
          status: item.status,
          buying_stage: item.buying_stage,
          priority: getPriority(item.buying_stage, item.status, item.offer_date, item.closing_date),
          due_date: getDueDate(item.action_required, item.status, item.offer_date, item.closing_date),
          last_activity_at: item.last_activity_at,
          offer_date: item.offer_date,
          closing_date: item.closing_date
        };
      });

      return this.createResponse(actionItems);
    } catch (error) {
      console.error('Error in getActionItems:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }
}
