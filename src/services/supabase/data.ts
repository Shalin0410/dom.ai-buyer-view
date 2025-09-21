// Supabase Data Service Implementation
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { BaseDataService } from '../api/data';
import { ApiResponse, Buyer, Agent, Property, PropertyFilter, PropertyActivity, PropertySummary, ActionItem } from '../api/types';

export class SupabaseDataService extends BaseDataService {
  // Helper method to determine which client to use
  private getClient() {
    // Check if we have a mock session - if so, use admin client to bypass RLS
    const mockSession = localStorage.getItem('mockAuthSession');
    if (mockSession) {
      return supabaseAdmin;
    }
    return supabase;
  }

  // Buyer operations - now using persons table with primary_role = 'buyer'
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select(`
          *,
          buyer_profiles(*),
          assigned_agent:persons!assigned_agent_id(*)
        `)
        .eq('primary_role', 'buyer')
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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select(`
          *,
          buyer_profiles(*),
          assigned_agent:persons!assigned_agent_id(*)
        `)
        .eq('id', id)
        .eq('primary_role', 'buyer')
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
      // First, get the buyer data with profile and agent information
      const client = this.getClient();

      const { data: buyerData, error: buyerError } = await client
        .from('persons')
        .select(`
          *,
          buyer_profiles(
            id,
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
            bathrooms,
            bedrooms,
            ideal_move_in_date,
            urgency_level,
            created_at,
            updated_at
          ),
          assigned_agent:persons!assigned_agent_id(*)
        `)
        .eq('email', email)
        .eq('primary_role', 'buyer')
        .single();

      if (buyerError) {
        if (buyerError.code === 'PGRST116') {
          // No rows returned - buyer not found
          return this.createResponse(null, 'Buyer not found');
        }
        console.error('Error fetching buyer by email:', buyerError);
        return this.createResponse(null, buyerError.message);
      }

      // Agent data is already included in the query via assigned_agent relationship
      if (buyerData.assigned_agent) {
        const agent: Agent = {
          id: buyerData.assigned_agent.id,
          first_name: buyerData.assigned_agent.first_name || 'Unknown',
          last_name: buyerData.assigned_agent.last_name || 'Agent',
          email: buyerData.assigned_agent.email || '',
          phone: buyerData.assigned_agent.phone || null,
          created_at: buyerData.assigned_agent.created_at,
          updated_at: buyerData.assigned_agent.updated_at
        };

        return this.createResponse({
          ...buyerData,
          agent_id: buyerData.assigned_agent_id, // Add agent_id for useAgent hook
          agent
        });
      }

      return this.createResponse({
        ...buyerData,
        agent_id: buyerData.assigned_agent_id // Include agent_id even if null
      });
    } catch (error) {
      console.error('Error in getBuyerByEmail:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async createBuyer(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Buyer>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .insert({
          ...buyer,
          roles: ['buyer'],
          primary_role: 'buyer'
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
      const client = this.getClient();

      console.log('🔍 updateBuyer called with:', { id, updates });

      // First check if the record exists
      const { data: existingRecord, error: checkError } = await client
        .from('persons')
        .select('id, first_name, last_name, primary_role')
        .eq('id', id)
        .single();

      console.log('🔍 Existing record check:', { existingRecord, checkError });

      if (checkError || !existingRecord) {
        console.error('Record not found for update:', { id, checkError });
        return this.createResponse(null, `Record not found for id: ${id}`);
      }

      const { data, error } = await client
        .from('persons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      console.log('🔍 Update result:', { data, error });

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

  async updateBuyerProfile(personId: string, profileData: any): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();

      // First check if a buyer profile exists for this person
      const { data: existingProfile, error: checkError } = await client
        .from('buyer_profiles')
        .select('id')
        .eq('person_id', personId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "no rows returned"
        console.error('Error checking existing buyer profile:', checkError);
        return this.createResponse(null, checkError.message);
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await client
          .from('buyer_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('person_id', personId)
          .select()
          .single();

        if (error) {
          console.error('Error updating buyer profile:', error);
          return this.createResponse(null, error.message);
        }
        result = data;
      } else {
        // Create new profile
        const { data, error } = await client
          .from('buyer_profiles')
          .insert({
            person_id: personId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating buyer profile:', error);
          return this.createResponse(null, error.message);
        }
        result = data;
      }

      return this.createResponse(result);
    } catch (error) {
      console.error('Error in updateBuyerProfile:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateBuyerComplete(id: string, personUpdates: any, profileUpdates: any): Promise<ApiResponse<Buyer>> {
    try {
      console.log('🔍 updateBuyerComplete called with:', { id, personUpdates, profileUpdates });

      // Update the person record only if there are changes
      if (Object.keys(personUpdates).length > 0) {
        const personResult = await this.updateBuyer(id, personUpdates);
        if (!personResult.success) {
          return personResult;
        }
      }

      // Update or create the buyer profile only if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        const profileResult = await this.updateBuyerProfile(id, profileUpdates);
        if (!profileResult.success) {
          return this.createResponse(null, profileResult.error);
        }
      }

      // Return the updated buyer with profile data
      return await this.getBuyerById(id);
    } catch (error) {
      console.error('Error in updateBuyerComplete:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async deleteBuyer(id: string): Promise<ApiResponse<null>> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from('persons')
        .delete()
        .eq('id', id)
        .eq('primary_role', 'buyer');

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

  // Agent operations - now using persons table with primary_role = 'agent'
  async getAgentById(id: string): Promise<ApiResponse<Agent>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select('*')
        .eq('id', id)
        .eq('primary_role', 'agent')
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
        const { data, error: retryError } = await client
          .from('persons')
          .select('*')
          .eq('id', id)
          .eq('primary_role', 'agent');

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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select('*')
        .eq('primary_role', 'agent')
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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .insert({
          ...agent,
          roles: ['agent'],
          primary_role: 'agent'
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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .update(updates)
        .eq('id', id)
        .eq('primary_role', 'agent')
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
      const client = this.getClient();
      const { error } = await client
        .from('persons')
        .delete()
        .eq('id', id)
        .eq('primary_role', 'agent');

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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select(`
          *,
          buyer_profiles(*),
          assigned_agent:persons!assigned_agent_id(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('primary_role', 'buyer')
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
      const client = this.getClient();
      const { data, error } = await client
        .from('persons')
        .select(`
          *,
          buyer_profiles(*),
          assigned_agent:persons!assigned_agent_id(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('primary_role', 'buyer')
        .eq('assigned_agent_id', agentId)
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

  // Property operations - DASHBOARD: Show properties with active timelines
  async getProperties(buyerId?: string, filter?: PropertyFilter): Promise<ApiResponse<Property[]>> {
    try {
      const client = this.getClient();
      let query = client
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
          ),
          timelines!buyer_property_id(
            id,
            current_phase,
            current_fub_stage,
            stage_last_updated,
            is_active
          )
        `);

      // Filter by buyer if specified
      if (buyerId) {
        query = query.eq('buyer_id', buyerId);
      }

      // DASHBOARD: Show properties that have been "loved" or have viewing scheduled
      // These should have timelines created
      query = query.in('interest_level', ['loved', 'viewing_scheduled', 'under_contract', 'pending'])
             .eq('is_active', true);

      // Apply filters based on buyer_properties data
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          query = query.in('property.status', filter.status);
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
        const { data: photosData } = await client
          .from('property_photos')
          .select('*')
          .in('property_id', propertyIds)
          .order('display_order', { ascending: true });
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
            order: photo.display_order,
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
      const client = this.getClient();

      // First get the property data
      const { data: propertyData, error: propertyError } = await client
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) {
        console.error('Error fetching property by ID:', propertyError);
        return this.createResponse(null, propertyError.message);
      }

      // Get buyer-property relationship with buyer and agent information
      console.log('🔍 Fetching buyer-property data for property ID:', id);
      const { data: buyerPropertyData, error: buyerPropertyError } = await client
        .from('buyer_properties')
        .select(`
          *,
          buyer:persons!buyer_properties_buyer_id_fkey(
            id,
            first_name,
            last_name,
            email,
            assigned_agent_id,
            agent:persons!persons_assigned_agent_id_fkey(
              id,
              first_name,
              last_name,
              email,
              phone,
              created_at,
              updated_at
            )
          )
        `)
        .eq('property_id', id)
        .maybeSingle();

      console.log('🔍 Buyer-property query result:', buyerPropertyData);
      console.log('🔍 Buyer-property query error:', buyerPropertyError);

      if (buyerPropertyData?.buyer?.assigned_agent) {
        console.log('🔍 Found agent raw data:', buyerPropertyData.buyer.assigned_agent);
        console.log('🔍 Agent email from raw data:', buyerPropertyData.buyer.assigned_agent.email);
        console.log('🔍 Agent object keys:', Object.keys(buyerPropertyData.buyer.assigned_agent));
      } else {
        console.log('🔍 No agent found for this property');
        if (buyerPropertyData?.buyer) {
          console.log('🔍 But buyer exists:', buyerPropertyData.buyer);
          console.log('🔍 Buyer assigned_agent_id:', buyerPropertyData.buyer.assigned_agent_id);
        }
      }

      // Fetch photos
      const { data: photos } = await client
        .from('property_photos')
        .select('*')
        .eq('property_id', id)
        .order('display_order', { ascending: true });

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
          order: photo.display_order,
          created_at: photo.created_at,
          updated_at: photo.updated_at
        })),

        // Buyer and agent information
        buyer: buyerPropertyData?.buyer ? {
          id: buyerPropertyData.buyer.id,
          first_name: buyerPropertyData.buyer.first_name,
          last_name: buyerPropertyData.buyer.last_name,
          email: buyerPropertyData.buyer.email,
          agent_id: buyerPropertyData.buyer.assigned_agent_id,
          agent: buyerPropertyData.buyer.agent ? {
            id: buyerPropertyData.buyer.agent.id,
            first_name: buyerPropertyData.buyer.agent.first_name,
            last_name: buyerPropertyData.buyer.agent.last_name,
            email: buyerPropertyData.buyer.agent.email,
            phone: buyerPropertyData.buyer.agent.phone,
            created_at: buyerPropertyData.buyer.agent.created_at,
            updated_at: buyerPropertyData.buyer.agent.updated_at
          } : null
        } : undefined
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
      const client = this.getClient();
      const now = new Date().toISOString();
      const propertyData = {
        ...property,
        last_activity_at: now
      };

      const { data, error } = await client
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
      const client = this.getClient();
      const updateData = {
        ...updates,
        last_activity_at: new Date().toISOString()
      };
      
      // Remove photos from updates as they're handled separately
      delete updateData.photos;

      const { data, error } = await client
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
      const { data: photos } = await client
        .from('property_photos')
        .select('*')
        .eq('property_id', id)
        .order('display_order', { ascending: true });

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
      const client = this.getClient();
      const { error } = await client
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
      const client = this.getClient();
      
      // First get the buyer_property_id for this property
      const { data: buyerPropertyData, error: buyerPropertyError } = await client
        .from('buyer_properties')
        .select(`
          id,
          interest_level,
          updated_at,
          buyer_id,
          buyer:persons!buyer_properties_buyer_id_fkey (
            id, first_name, last_name
          )
        `)
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

      const activities: PropertyActivity[] = [];

      // 1. Add buyer property status changes as milestones
      if (buyerPropertyData.interest_level !== 'interested') {
        activities.push({
          id: `bp_milestone_${buyerPropertyData.id}`,
          property_id: propertyId,
          type: 'milestone',
          title: `Property ${buyerPropertyData.interest_level.replace('_', ' ')}`,
          description: `Buyer ${buyerPropertyData.interest_level === 'loved' ? 'loved this property' : 
                        buyerPropertyData.interest_level === 'viewing_scheduled' ? 'scheduled a viewing' :
                        buyerPropertyData.interest_level === 'under_contract' ? 'is under contract' :
                        buyerPropertyData.interest_level === 'pending' ? 'sale is pending' : 
                        'updated status'}`,
          created_at: buyerPropertyData.updated_at,
          created_by: buyerPropertyData.buyer_id
        });
      }

      // 2. Get timeline history for this buyer-property relationship
      const { data: timelineHistory } = await client
        .from('timeline_history')
        .select(`
          id,
          step_name,
          status,
          notes,
          completed_at,
          created_by,
          timeline:timelines!timeline_history_timeline_id_fkey (
            buyer_property_id
          )
        `)
        .eq('timeline.buyer_property_id', buyerPropertyData.id)
        .order('completed_at', { ascending: false });

      // Add timeline activities
      (timelineHistory || []).forEach(history => {
        if (history.completed_at) {
          activities.push({
            id: `timeline_${history.id}`,
            property_id: propertyId,
            type: 'milestone',
            title: history.step_name,
            description: history.notes || `${history.step_name} ${history.status}`,
            created_at: history.completed_at,
            created_by: history.created_by
          });
        }
      });

      // 3. Get action items related to this property
      const { data: actionItems } = await client
        .from('action_items')
        .select('*')
        .eq('buyer_id', buyerPropertyData.buyer_id)
        .ilike('title', `%property%`)
        .order('created_at', { ascending: false });

      // Add action item activities
      (actionItems || []).forEach(item => {
        activities.push({
          id: `action_${item.id}`,
          property_id: propertyId,
          type: item.status === 'completed' ? 'milestone' : 'note',
          title: item.title,
          description: item.description,
          created_at: item.created_at,
          created_by: item.assigned_to || buyerPropertyData.buyer_id
        });
      });

      // 4. Get documents related to this property
      const { data: documents } = await client
        .from('documents')
        .select('*')
        .eq('buyer_id', buyerPropertyData.buyer_id)
        .order('created_at', { ascending: false });

      // Add document activities  
      (documents || []).forEach(doc => {
        activities.push({
          id: `doc_${doc.id}`,
          property_id: propertyId,
          type: 'document',
          title: `Document: ${doc.document_name}`,
          description: `${doc.document_type} - ${doc.status}`,
          created_at: doc.created_at,
          created_by: doc.uploaded_by || buyerPropertyData.buyer_id
        });
      });

      // Note: Buyer property notes are stored in timeline_notes in the timelines table

      // Sort all activities by created_at (most recent first)
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return this.createResponse(activities);
    } catch (error) {
      console.error('Error in getPropertyActivities:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async addPropertyActivity(activity: Omit<PropertyActivity, 'id' | 'created_at'>): Promise<ApiResponse<PropertyActivity>> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();
      
      // First get the buyer_property_id for this property
      const { data: buyerPropertyData, error: buyerPropertyError } = await client
        .from('buyer_properties')
        .select('id, buyer_id')
        .eq('property_id', activity.property_id)
        .maybeSingle();

      if (buyerPropertyError) {
        console.error('Error fetching buyer property for new activity:', buyerPropertyError);
        return this.createResponse(null, buyerPropertyError.message);
      }

      if (!buyerPropertyData) {
        return this.createResponse(null, 'No buyer-property relationship found for this property');
      }

      let insertedData: any;
      let activityId: string;

      // Route the activity to the appropriate table based on type
      switch (activity.type) {
        case 'note':
          // Store as action item
          const { data: actionItemData, error: actionItemError } = await client
            .from('action_items')
            .insert({
              buyer_id: buyerPropertyData.buyer_id,
              title: activity.title,
              description: activity.description,
              status: 'pending',
              priority: 'medium',
              due_date: null,
              assigned_to: activity.created_by,
              created_at: now
            })
            .select()
            .single();
          
          if (actionItemError) {
            console.error('Error creating action item:', actionItemError);
            return this.createResponse(null, actionItemError.message);
          }
          
          insertedData = actionItemData;
          activityId = `action_${insertedData.id}`;
          break;

        case 'document':
          // Store as document
          const { data: documentData, error: documentError } = await client
            .from('documents')
            .insert({
              buyer_id: buyerPropertyData.buyer_id,
              document_name: activity.title,
              document_type: 'general',
              status: 'active',
              uploaded_by: activity.created_by,
              created_at: now,
              metadata: activity.description ? { description: activity.description } : null
            })
            .select()
            .single();
          
          if (documentError) {
            console.error('Error creating document:', documentError);
            return this.createResponse(null, documentError.message);
          }
          
          insertedData = documentData;
          activityId = `doc_${insertedData.id}`;
          break;

        case 'milestone':
          // Store as timeline history or action item depending on context
          const { data: milestoneData, error: milestoneError } = await client
            .from('action_items')
            .insert({
              buyer_id: buyerPropertyData.buyer_id,
              title: activity.title,
              description: activity.description,
              status: 'completed',
              priority: 'high',
              due_date: now,
              assigned_to: activity.created_by,
              created_at: now
            })
            .select()
            .single();
          
          if (milestoneError) {
            console.error('Error creating milestone:', milestoneError);
            return this.createResponse(null, milestoneError.message);
          }
          
          insertedData = milestoneData;
          activityId = `action_${insertedData.id}`;
          break;

        case 'viewing':
        case 'offer':
        default:
          // Store as action item with appropriate status
          const { data: defaultData, error: defaultError } = await client
            .from('action_items')
            .insert({
              buyer_id: buyerPropertyData.buyer_id,
              title: activity.title,
              description: activity.description,
              status: activity.type === 'viewing' ? 'in_progress' : 'pending',
              priority: activity.type === 'offer' ? 'high' : 'medium',
              due_date: null,
              assigned_to: activity.created_by,
              created_at: now
            })
            .select()
            .single();
          
          if (defaultError) {
            console.error('Error creating activity:', defaultError);
            return this.createResponse(null, defaultError.message);
          }
          
          insertedData = defaultData;
          activityId = `action_${insertedData.id}`;
          break;
      }

      // Update property's last_activity_at
      await client
        .from('properties')
        .update({ last_activity_at: now })
        .eq('id', activity.property_id);

      // Return the activity in PropertyActivity format
      const responseActivity: PropertyActivity = {
        id: activityId,
        property_id: activity.property_id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        created_at: now,
        created_by: activity.created_by
      };

      return this.createResponse(responseActivity);
    } catch (error) {
      console.error('Error in addPropertyActivity:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getPropertySummary(buyerId: string): Promise<ApiResponse<PropertySummary>> {
    try {
      const client = this.getClient();
      const { data: buyerProperties, error } = await client
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
      const client = this.getClient();
      if (!buyerId) {
        return this.createResponse(null, 'Buyer ID is required for search tab');
      }

      // SEARCH TAB: Show properties recommended to this buyer that they haven't acted on yet
      // Only show buyer_properties where:
      // 1. is_active = true (not passed)
      // 2. interest_level = 'interested' (not loved or viewing scheduled)
      // 3. property.status = 'active' (still available)
      let query = client
        .from('buyer_properties')
        .select(`
          *,
          property:properties!buyer_properties_property_id_fkey (
            *
          )
        `)
        .eq('buyer_id', buyerId)
        .eq('is_active', true)
        .eq('interest_level', 'interested')
        .eq('property.status', 'active');

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

  async addPropertyToBuyer(buyerId: string, propertyId: string, options?: {
    initialStage?: 'interested' | 'loved' | 'viewing_scheduled' | 'under_contract' | 'pending';
    timelinePhase?: 'pre_escrow' | 'escrow' | 'post_escrow';
    fubStage?: 'lead' | 'hot_prospect' | 'nurture' | 'active_client' | 'pending' | 'closed';
  }): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();
      
      // Set defaults based on stage
      const initialStage = options?.initialStage || 'interested';
      const timelinePhase = options?.timelinePhase || (
        initialStage === 'under_contract' ? 'escrow' : 
        initialStage === 'pending' ? 'escrow' : 'pre_escrow'
      );
      const fubStage = options?.fubStage || (
        initialStage === 'under_contract' ? 'pending' :
        initialStage === 'pending' ? 'pending' : 'active_client'
      );

      // Check if the buyer is already tracking this property
      const { data: existing, error: existingError } = await client
        .from('buyer_properties')
        .select('id, interest_level')
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing tracking:', existingError);
        return this.createResponse(null, existingError.message);
      }

      if (existing) {
        // Update existing property if agent is adding at a more advanced stage
        if (this.shouldUpdateStage(existing.interest_level, initialStage)) {
          const { data: updated, error: updateError } = await client
            .from('buyer_properties')
            .update({
              interest_level: initialStage,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating property stage:', updateError);
            return this.createResponse(null, updateError.message);
          }

          // Create timeline if needed for advanced stages
          if (initialStage !== 'interested') {
            await this.createTimelineForStage(existing.id, initialStage, timelinePhase, fubStage);
          }

          return this.createResponse({
            ...updated,
            message: `Property stage updated to ${initialStage}`
          });
        }

        return this.createResponse(
          { id: existing.id, message: 'You are already tracking this property' },
          null
        );
      }

      // Get buyer's organization_id
      const { data: buyer } = await client
        .from('persons')
        .select('organization_id')
        .eq('id', buyerId)
        .single();

      // Add new property to buyer's tracked properties
      const { data, error } = await client
        .from('buyer_properties')
        .insert({
          organization_id: buyer?.organization_id,
          buyer_id: buyerId,
          property_id: propertyId,
          interest_level: initialStage,
          is_active: true,
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding property to buyer:', error);
        return this.createResponse(null, error.message);
      }

      // Create timeline if starting at advanced stage
      if (initialStage !== 'interested') {
        await this.createTimelineForStage(data.id, initialStage, timelinePhase, fubStage);
      }

      return this.createResponse({
        ...data,
        message: `Property added at ${initialStage} stage`
      });
    } catch (error) {
      console.error('Error in addPropertyToBuyer:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async updateBuyerProperty(buyerId: string, propertyId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();
      // First, verify the buyer has access to this property
      const { data: existing, error: accessError } = await client
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
      const { data, error } = await client
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
        await client
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

        await client
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
      // Get action items from the action_items table for the buyer
      const client = this.getClient();
      const { data: actionItems, error: actionItemsError } = await client
        .from('action_items')
        .select(`
          *,
          buyer_property:buyer_properties!buyer_property_id(
            *,
            property:properties!property_id(
              id,
              address,
              city,
              state,
              zip_code,
              listing_price,
              bedrooms,
              bathrooms,
              square_feet,
              property_type,
              status
            )
          )
        `)
        .eq('assigned_buyer_id', buyerId)
        .in('status', ['pending', 'completed'])
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
          property_id: buyerProperty?.property_id || null,
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
    status: string;
    completed_date: string;
    completion_notes: string;
    due_date: string;
    priority: string;
  }>): Promise<ApiResponse<ActionItem>> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from('action_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionItemId)
        .select(`
          *,
          buyer_property:buyer_properties!buyer_property_id(
            *,
            property:properties!property_id(
              id,
              address,
              city,
              state,
              zip_code,
              listing_price,
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
        property_id: buyerProperty?.property_id || null,
        buyer_id: data.assigned_buyer_id,
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
      const client = this.getClient();

      // Get buyer's organization_id
      const { data: buyerData, error: buyerError } = await client
        .from('persons')
        .select('organization_id')
        .eq('id', actionItem.buyer_id)
        .eq('primary_role', 'buyer')
        .single();

      if (buyerError) {
        console.error('Error getting buyer organization:', buyerError);
        return this.createResponse(null, buyerError.message);
      }
      // Get or create buyer_property relationship if property_id is provided
      let buyerPropertyId = null;
      if (actionItem.property_id) {
        const { data: buyerPropertyData, error: buyerPropertyError } = await client
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
          const { data: newBuyerProperty, error: createBuyerPropertyError } = await client
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
      const { data, error } = await client
        .from('action_items')
        .insert({
          organization_id: buyerData.organization_id,
          assigned_buyer_id: actionItem.buyer_id,
          buyer_property_id: buyerPropertyId,
          action_type: actionItem.action_required,
          title: actionItem.title,
          description: actionItem.description,
          priority: actionItem.priority || 'medium',
          status: actionItem.status || 'pending',
          due_date: actionItem.due_date,
          item_order: 999
        })
        .select(`
          *,
          buyer_property:buyer_properties!buyer_property_id(
            *,
            property:properties!property_id(
              id,
              address,
              city,
              state,
              zip_code,
              listing_price,
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
        property_id: buyerProperty?.property_id || null,
        buyer_id: data.assigned_buyer_id,
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

  // Property workflow action methods
  async loveProperty(buyerId: string, propertyId: string): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();
      
      // Update buyer_property interest_level to 'loved'
      // This will trigger the database trigger to create a timeline
      const { data, error } = await client
        .from('buyer_properties')
        .update({
          interest_level: 'loved',
          last_activity_at: new Date().toISOString()
        })
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .select('*')
        .single();

      if (error) {
        console.error('Error loving property:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data, null);
    } catch (error) {
      console.error('Error in loveProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async passProperty(buyerId: string, propertyId: string): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();
      
      // Update buyer_property to set is_active = false (removes from search)
      const { data, error } = await client
        .from('buyer_properties')
        .update({
          interest_level: 'passed',
          is_active: false,
          last_activity_at: new Date().toISOString()
        })
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .select('*')
        .single();

      if (error) {
        console.error('Error passing property:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data, null);
    } catch (error) {
      console.error('Error in passProperty:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async scheduleViewing(buyerId: string, propertyId: string): Promise<ApiResponse<any>> {
    try {
      const client = this.getClient();
      
      // Update buyer_property interest_level to 'viewing_scheduled'
      // This will trigger the database trigger to create a timeline
      const { data, error } = await client
        .from('buyer_properties')
        .update({
          interest_level: 'viewing_scheduled',
          last_activity_at: new Date().toISOString()
        })
        .eq('buyer_id', buyerId)
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .select('*')
        .single();

      if (error) {
        console.error('Error scheduling viewing:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data, null);
    } catch (error) {
      console.error('Error in scheduleViewing:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  // Helper methods for multi-stage property addition
  private shouldUpdateStage(currentStage: string, newStage: string): boolean {
    const stageOrder = {
      'interested': 1,
      'loved': 2, 
      'viewing_scheduled': 3,
      'under_contract': 4,
      'pending': 5
    };
    
    const currentLevel = stageOrder[currentStage as keyof typeof stageOrder] || 1;
    const newLevel = stageOrder[newStage as keyof typeof stageOrder] || 1;
    
    return newLevel > currentLevel;
  }

  private async createTimelineForStage(
    buyerPropertyId: string, 
    stage: string, 
    timelinePhase: string, 
    fubStage: string
  ) {
    const client = this.getClient();
    
    // Check if timeline already exists
    const { data: existingTimeline } = await client
      .from('timelines')
      .select('id')
      .eq('buyer_property_id', buyerPropertyId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingTimeline) {
      // Update existing timeline
      await client
        .from('timelines')
        .update({
          current_phase: timelinePhase,
          current_fub_stage: fubStage,
          stage_last_updated: new Date().toISOString()
        })
        .eq('id', existingTimeline.id);
    } else {
      // Create new timeline
      await client
        .from('timelines')
        .insert({
          buyer_property_id: buyerPropertyId,
          current_phase: timelinePhase,
          current_fub_stage: fubStage,
          timeline_name: this.getTimelineNameForStage(stage),
          timeline_notes: `Timeline created for property at ${stage} stage`,
          is_active: true
        });
    }
  }

  private getTimelineNameForStage(stage: string): string {
    const names = {
      'loved': 'Property Loved Timeline',
      'viewing_scheduled': 'Viewing Scheduled Timeline',
      'under_contract': 'Under Contract Timeline',
      'pending': 'Pending Sale Timeline'
    };
    return names[stage as keyof typeof names] || 'Property Timeline';
  }
}
