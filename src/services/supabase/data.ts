// Supabase Data Service Implementation
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { BaseDataService } from '../api/data';
import { ApiResponse, Buyer, Agent, Property, PropertyFilter, PropertyActivity, PropertySummary, ActionItem } from '../api/types';

export class SupabaseDataService extends BaseDataService {
  // Buyer operations - now using persons table with role = 'buyer'
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('role', 'buyer')
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
        .from('persons')
        .select('*')
        .eq('id', id)
        .eq('role', 'buyer')
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
        .from('persons')
        .select('*')
        .eq('email', email)
        .eq('role', 'buyer')
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
            .from('persons')
            .select('*')
            .eq('id', buyerData.agent_id)
            .eq('role', 'agent')
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

      return this.createResponse(buyerData);
    } catch (error) {
      console.error('Error in getBuyerByEmail:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async createBuyer(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Buyer>> {
    try {
      const { data, error } = await supabase
        .from('persons')
        .insert({
          ...buyer,
          role: 'buyer'
        })
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
        .from('persons')
        .update(updates)
        .eq('id', id)
        .eq('role', 'buyer')
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
        .from('persons')
        .delete()
        .eq('id', id)
        .eq('role', 'buyer');

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

  // Agent operations - now using persons table with role = 'agent'
  async getAgentById(id: string): Promise<ApiResponse<Agent>> {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('id', id)
        .eq('role', 'agent')
        .single();

      if (error) {
        console.error('getAgentById - Error fetching agent:', error);
        return this.createResponse(null, error.message);
      }

      console.log('getAgentById - Successfully retrieved agent data:', data);
      return this.createResponse(data);
    } catch (error) {
      console.error('getAgentById - Error in main query:', error);
      
      // Fallback: try alternative query
      try {
        const { data, error: retryError } = await supabase
          .from('persons')
          .select('*')
          .eq('id', id)
          .eq('role', 'agent');

        if (retryError) {
          console.error('getAgentById - Error in alternative query:', retryError);
          return this.createResponse(null, retryError.message);
        }
        
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
        .from('persons')
        .select('*')
        .eq('role', 'agent')
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
        .from('persons')
        .insert({
          ...agent,
          role: 'agent'
        })
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
        .from('persons')
        .update(updates)
        .eq('id', id)
        .eq('role', 'agent')
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
        .from('persons')
        .delete()
        .eq('id', id)
        .eq('role', 'agent');

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

  // Relationship operations - now using persons table with joins
  async getBuyersWithAgents(): Promise<ApiResponse<Buyer[]>> {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select(`
          *,
          agent:persons!agent_id(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('role', 'buyer')
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
        .from('persons')
        .select(`
          *,
          agent:persons!agent_id(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('role', 'buyer')
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
          property:properties!buyer_properties_property_id_fkey(
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

      // Exclude researching and withdrawn properties from dashboard
      query = query.not('status', 'in', '(researching,withdrawn)');

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
          query = query.gte('updated_at', cutoffDate.toISOString());
        }
      }

      query = query.order('updated_at', { ascending: false });

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
          .order('order_index', { ascending: true });
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
          listing_price: property.listing_price || property.price || 0,
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
          last_activity_at: buyerProperty.updated_at,
          
          // Related data
          photos: propertyPhotos.map(photo => ({
            id: photo.id,
            property_id: photo.property_id,
            url: photo.url,
            caption: photo.caption,
            is_primary: photo.is_primary,
            order: photo.order_index,
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
        .order('order_index', { ascending: true });

      // Transform to Property interface
      const property: Property = {
        id: propertyData.id,
        // Core property info
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip_code: propertyData.zip_code,
        listing_price: propertyData.listing_price || propertyData.price || 0,
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
        last_activity_at: buyerPropertyData?.updated_at || propertyData.created_at,
        
        // Related data
        photos: (photos || []).map(photo => ({
          id: photo.id,
          property_id: photo.property_id,
          url: photo.url,
          caption: photo.caption,
          is_primary: photo.is_primary,
          order: photo.order_index,
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
        .order('order_index', { ascending: true });

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
          *,
          property:properties!buyer_properties_property_id_fkey (
            *
          )
        `)
        .eq('buyer_id', buyerId || '');

      // Exclude active statuses and withdrawn properties from search
      // Active statuses: viewing, offer_submitted, under_contract, in_escrow, closed
      // Also exclude withdrawn properties
      query = query.not('status', 'in', '(viewing,offer_submitted,under_contract,in_escrow,closed,withdrawn)');

      // If no buyer ID is provided, fall back to getting all available properties
      if (!buyerId) {
        query = supabase
          .from('properties')
          .select('*');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available properties:', error);
        return this.createResponse(null, error.message);
      }

      // Extract properties from the joined result if we're using buyer_properties
      let properties = buyerId 
        ? (data || []).map((item: any) => ({ 
            ...item.property, 
            buyer_status: item.status, 
            buyer_stage: item.buying_stage 
          }))
        : (data || []);

      // Apply filters after fetching
      if (filter && properties.length > 0) {
        properties = properties.filter((property: any) => {
          let matches = true;
          
          if (filter.price_min && (property.listing_price || property.price)) {
            const price = property.listing_price || property.price;
            matches = matches && price >= filter.price_min;
          }
          if (filter.price_max && (property.listing_price || property.price)) {
            const price = property.listing_price || property.price;
            matches = matches && price <= filter.price_max;
          }
          if (filter.bedrooms_min && property.bedrooms) {
            matches = matches && property.bedrooms >= filter.bedrooms_min;
          }
          if (filter.bathrooms_min && property.bathrooms) {
            matches = matches && property.bathrooms >= filter.bathrooms_min;
          }
          if (filter.property_type && filter.property_type.length > 0) {
            matches = matches && filter.property_type.includes(property.property_type);
          }
          
          return matches;
        });
      }

      // Transform to Property interface
      const transformedProperties = properties.map((property: any) => {
        // Handle photos from both JSONB and separate table
        let photos: any[] = [];
        if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
          photos = property.photos.map((photo: any, index: number) => ({
            id: `${property.id}-photo-${index}`,
            property_id: property.id,
            url: photo.url || photo,
            caption: photo.caption || null,
            is_primary: index === 0 || photo.is_primary || false,
            order: photo.order || index,
            created_at: property.created_at,
            updated_at: property.updated_at
          }));
        } else {
          // Add placeholder photo if none exist
          photos = [{
            id: `${property.id}-placeholder`,
            property_id: property.id,
            url: '/placeholder.svg',
            caption: 'Property Image',
            is_primary: true,
            order: 0,
            created_at: property.created_at,
            updated_at: property.updated_at
          }];
        }
        
        return {
        id: property.id,
          buyer_id: buyerId || '',
        address: property.address,
        city: property.city,
        state: property.state,
        zip_code: property.zip_code || '',
          listing_price: property.listing_price || property.price || 0,
        purchase_price: undefined,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          square_feet: property.square_feet || 0,
        lot_size: property.lot_size,
        year_built: property.year_built,
        property_type: property.property_type || 'single_family',
          status: property.buyer_status || 'researching',
          buying_stage: property.buyer_stage || 'initial_research',
          action_required: 'none',
        mls_number: property.mls_number,
        listing_url: property.listing_url,
        notes: undefined,
          last_activity_at: property.updated_at || property.created_at,
        created_at: property.created_at,
        updated_at: property.updated_at || property.created_at,
          photos: photos
        } as Property;
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
      // Get action items from the action_items table for the specific buyer
      const { data: actionItems, error: actionItemsError } = await supabase
        .from('action_items')
        .select(`
          *,
          buyer_property:buyer_properties!action_items_buyer_property_id_fkey (
            *,
            property:properties!buyer_properties_property_id_fkey (
            id,
            address,
            city,
              state,
              zip_code,
              price,
              bedrooms,
              bathrooms,
              square_feet,
              property_type,
              status
            )
          )
        `)
        .eq('person_id', buyerId)
        .eq('is_completed', false)
        .eq('is_irrelevant', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (actionItemsError) {
        console.error('Error fetching action items:', actionItemsError);
        return this.createResponse(null, actionItemsError.message);
      }

      if (!actionItems || actionItems.length === 0) {
        return this.createResponse([]);
      }

      // Transform action_items table data to ActionItem interface
      const transformedActionItems: ActionItem[] = actionItems.map(actionItem => {
        const buyerProperty = actionItem.buyer_property;
        const property = buyerProperty?.property;
        
        return {
          id: actionItem.id,
          property_id: actionItem.property_id,
          buyer_id: buyerId,
          title: actionItem.title,
          description: actionItem.description || '',
          property_address: property ? `${property.address}, ${property.city}, ${property.state}` : '',
          action_required: actionItem.action_type || '',
          status: actionItem.status || 'pending',
          buying_stage: buyerProperty?.buying_stage || '',
          priority: actionItem.priority || 'medium',
          due_date: actionItem.due_date,
          last_activity_at: actionItem.updated_at,
          offer_date: buyerProperty?.offer_date,
          closing_date: buyerProperty?.closing_date
        };
      });

      return this.createResponse(transformedActionItems);
    } catch (error) {
      console.error('Error in getActionItems:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Update action item (mark as completed, update status, etc.)
  async updateActionItem(actionItemId: string, updates: Partial<{
    is_completed: boolean;
    is_irrelevant: boolean;
    status: string;
    completed_date: string;
    completion_notes: string;
    due_date: string;
    priority: string;
  }>): Promise<ApiResponse<ActionItem>> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionItemId)
        .select(`
          *,
          buyer_property:buyer_properties!action_items_buyer_property_id_fkey (
            *,
            property:properties!buyer_properties_property_id_fkey (
              id,
              address,
              city,
              state,
              zip_code,
              price,
              bedrooms,
              bathrooms,
              square_feet,
              property_type,
              status
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error updating action item:', error);
        return this.createResponse(null, error.message);
      }

      if (!data) {
        return this.createResponse(null, 'Action item not found');
      }

      // Transform to ActionItem interface
      const buyerProperty = data.buyer_property;
      const property = buyerProperty?.property;
      
      const transformedActionItem: ActionItem = {
        id: data.id,
        property_id: data.property_id,
        buyer_id: data.person_id,
        title: data.title,
        description: data.description || '',
        property_address: property ? `${property.address}, ${property.city}, ${property.state}` : '',
        action_required: data.action_type || '',
        status: data.status || 'pending',
        buying_stage: buyerProperty?.buying_stage || '',
        priority: data.priority || 'medium',
        due_date: data.due_date,
        last_activity_at: data.updated_at,
        offer_date: buyerProperty?.offer_date,
        closing_date: buyerProperty?.closing_date
      };

      return this.createResponse(transformedActionItem);
    } catch (error) {
      console.error('Error in updateActionItem:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Create a new action item
  async createActionItem(actionItem: Omit<ActionItem, 'id' | 'last_activity_at'>): Promise<ApiResponse<ActionItem>> {
    try {
      // Get buyer's organization_id
      const { data: buyerData, error: buyerError } = await supabase
        .from('persons')
        .select('organization_id')
        .eq('id', actionItem.buyer_id)
        .eq('role', 'buyer')
        .single();

      if (buyerError) {
        console.error('Error getting buyer organization:', buyerError);
        return this.createResponse(null, buyerError.message);
      }
      // Get or create buyer_property relationship if property_id is provided
      let buyerPropertyId = null;
      if (actionItem.property_id) {
        const { data: buyerPropertyData, error: buyerPropertyError } = await supabase
          .from('buyer_properties')
          .select('id')
          .eq('buyer_id', actionItem.buyer_id)
          .eq('property_id', actionItem.property_id)
          .maybeSingle();

        if (buyerPropertyError) {
          console.error('Error getting buyer property:', buyerPropertyError);
          return this.createResponse(null, buyerPropertyError.message);
        }

        if (!buyerPropertyData) {
          // Create buyer_property relationship
          const { data: newBuyerProperty, error: createBuyerPropertyError } = await supabase
            .from('buyer_properties')
            .insert({
              buyer_id: actionItem.buyer_id,
              property_id: actionItem.property_id,
              status: 'researching',
              buying_stage: 'initial_research',
              action_required: 'none',
              last_activity_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createBuyerPropertyError) {
            console.error('Error creating buyer property:', createBuyerPropertyError);
            return this.createResponse(null, createBuyerPropertyError.message);
          }

          buyerPropertyId = newBuyerProperty.id;
        } else {
          buyerPropertyId = buyerPropertyData.id;
        }
      }

      // Insert the action item
      const { data, error } = await supabase
        .from('action_items')
        .insert({
          person_id: actionItem.buyer_id,
          property_id: actionItem.property_id,
          buyer_property_id: buyerPropertyId,
          title: actionItem.title,
          description: actionItem.description,
          action_type: actionItem.action_required,
          status: actionItem.status || 'pending',
          priority: actionItem.priority || 'medium',
          due_date: actionItem.due_date,
          phase: actionItem.buying_stage === 'initial_research' || actionItem.buying_stage === 'active_search' ? 'pre_escrow' : 'escrow',
          item_order: 999, // Custom items go to the end
          custom_task: actionItem.title, // Mark as custom task
          organization_id: buyerData.organization_id,
          is_completed: false,
          is_irrelevant: false
        })
        .select(`
          *,
          buyer_property:buyer_properties!action_items_buyer_property_id_fkey (
            *,
            property:properties!buyer_properties_property_id_fkey (
              id,
              address,
              city,
              state,
              zip_code,
              price,
              bedrooms,
              bathrooms,
              square_feet,
              property_type,
              status
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error creating action item:', error);
        return this.createResponse(null, error.message);
      }

      // Transform to ActionItem interface
      const buyerProperty = data.buyer_property;
      const property = buyerProperty?.property;
      
      const transformedActionItem: ActionItem = {
        id: data.id,
        property_id: data.property_id,
        buyer_id: data.person_id,
        title: data.title,
        description: data.description || '',
        property_address: property ? `${property.address}, ${property.city}, ${property.state}` : '',
        action_required: data.action_type || '',
        status: data.status || 'pending',
        buying_stage: buyerProperty?.buying_stage || '',
        priority: data.priority || 'medium',
        due_date: data.due_date,
        last_activity_at: data.updated_at,
        offer_date: buyerProperty?.offer_date,
        closing_date: buyerProperty?.closing_date
      };

      return this.createResponse(transformedActionItem);
    } catch (error) {
      console.error('Error in createActionItem:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }
}
