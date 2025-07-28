// Data Service Interface
import { ApiResponse, PaginatedResponse, Buyer, Agent, Property, PropertyFilter, PropertyActivity, PropertySummary, ApiError } from './types';

export interface DataService {
  // Buyer operations
  getBuyers(): Promise<ApiResponse<Buyer[]>>;
  getBuyerById(id: string): Promise<ApiResponse<Buyer>>;
  getBuyerByEmail(email: string): Promise<ApiResponse<Buyer>>;
  createBuyer(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Buyer>>;
  updateBuyer(id: string, updates: Partial<Buyer>): Promise<ApiResponse<Buyer>>;
  deleteBuyer(id: string): Promise<ApiResponse<null>>;

  // Agent operations
  getAgents(): Promise<ApiResponse<Agent[]>>;
  getAgentById(id: string): Promise<ApiResponse<Agent>>;
  createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Agent>>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<ApiResponse<Agent>>;
  deleteAgent(id: string): Promise<ApiResponse<null>>;

  // Relationship operations
  getBuyersWithAgents(): Promise<ApiResponse<Buyer[]>>;
  getBuyersByAgentId(agentId: string): Promise<ApiResponse<Buyer[]>>;

  // Property operations
  getProperties(buyerId?: string, filter?: PropertyFilter): Promise<ApiResponse<Property[]>>;
  getAvailableProperties(filter?: PropertyFilter, buyerId?: string): Promise<ApiResponse<Property[]>>;
  getPropertyById(id: string): Promise<ApiResponse<Property>>;
  createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'last_activity_at' | 'photos'>): Promise<ApiResponse<Property>>;
  updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>>;
  deleteProperty(id: string): Promise<ApiResponse<null>>;
  getPropertyActivities(propertyId: string): Promise<ApiResponse<PropertyActivity[]>>;
  addPropertyActivity(activity: Omit<PropertyActivity, 'id' | 'created_at'>): Promise<ApiResponse<PropertyActivity>>;
  getPropertySummary(buyerId: string): Promise<ApiResponse<PropertySummary>>;
  
  // Buyer-Property relationship operations
  addPropertyToBuyer(buyerId: string, propertyId: string): Promise<ApiResponse<any>>;
  updateBuyerProperty(buyerId: string, propertyId: string, updates: any): Promise<ApiResponse<any>>;
}

// Abstract base class for data service implementations
export abstract class BaseDataService implements DataService {
  // Buyer operations
  abstract getBuyers(): Promise<ApiResponse<Buyer[]>>;
  abstract getBuyerById(id: string): Promise<ApiResponse<Buyer>>;
  abstract getBuyerByEmail(email: string): Promise<ApiResponse<Buyer>>;
  abstract createBuyer(buyer: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Buyer>>;
  abstract updateBuyer(id: string, updates: Partial<Buyer>): Promise<ApiResponse<Buyer>>;
  abstract deleteBuyer(id: string): Promise<ApiResponse<null>>;

  // Agent operations
  abstract getAgents(): Promise<ApiResponse<Agent[]>>;
  abstract getAgentById(id: string): Promise<ApiResponse<Agent>>;
  abstract createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Agent>>;
  abstract updateAgent(id: string, updates: Partial<Agent>): Promise<ApiResponse<Agent>>;
  abstract deleteAgent(id: string): Promise<ApiResponse<null>>;

  // Relationship operations
  abstract getBuyersWithAgents(): Promise<ApiResponse<Buyer[]>>;
  abstract getBuyersByAgentId(agentId: string): Promise<ApiResponse<Buyer[]>>;

  // Property operations
  abstract getProperties(buyerId?: string, filter?: PropertyFilter): Promise<ApiResponse<Property[]>>;
  abstract getAvailableProperties(filter?: PropertyFilter, buyerId?: string): Promise<ApiResponse<Property[]>>;
  abstract getPropertyById(id: string): Promise<ApiResponse<Property>>;
  abstract createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'last_activity_at' | 'photos'>): Promise<ApiResponse<Property>>;
  abstract updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>>;
  abstract deleteProperty(id: string): Promise<ApiResponse<null>>;
  abstract getPropertyActivities(propertyId: string): Promise<ApiResponse<PropertyActivity[]>>;
  abstract addPropertyActivity(activity: Omit<PropertyActivity, 'id' | 'created_at'>): Promise<ApiResponse<PropertyActivity>>;
  abstract getPropertySummary(buyerId: string): Promise<ApiResponse<PropertySummary>>;
  
  // Buyer-Property relationship operations
  abstract addPropertyToBuyer(buyerId: string, propertyId: string): Promise<ApiResponse<any>>;
  abstract updateBuyerProperty(buyerId: string, propertyId: string, updates: any): Promise<ApiResponse<any>>;

  protected handleError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    return new ApiError(
      error?.message || 'An unexpected error occurred',
      error?.status || 500,
      error?.code || 'UNKNOWN_ERROR'
    );
  }

  protected createResponse<T>(data: T | null, error: string | null = null): ApiResponse<T> {
    return {
      data,
      error,
      success: error === null
    };
  }
}
