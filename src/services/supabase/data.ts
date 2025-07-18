// Supabase Data Service Implementation
import { supabase } from '@/lib/supabaseClient';
import { BaseDataService } from '../api/data';
import { ApiResponse, Buyer, Agent } from '../api/types';

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
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - buyer not found
          return this.createResponse(null, 'Buyer not found');
        }
        console.error('Error fetching buyer by email:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
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

  async getAgentById(id: string): Promise<ApiResponse<Agent>> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching agent by ID:', error);
        return this.createResponse(null, error.message);
      }

      return this.createResponse(data);
    } catch (error) {
      console.error('Error in getAgentById:', error);
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
}
