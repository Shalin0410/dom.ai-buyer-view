// API Types - Define all data structures used by the frontend
export interface Buyer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  agent_id: string | null;
  agent?: Agent | null;
  created_at?: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

// Property types
export type PropertyStatus = 
  | 'researching'
  | 'viewing'
  | 'offer_submitted'
  | 'under_contract'
  | 'in_escrow'
  | 'closed'
  | 'withdrawn';

export type BuyingStage = 
  | 'initial_research'
  | 'active_search'
  | 'offer_negotiation'
  | 'under_contract'
  | 'closing';

export type ActionRequired = 
  | 'schedule_viewing'
  | 'submit_offer'
  | 'review_documents'
  | 'inspection'
  | 'appraisal'
  | 'final_walkthrough'
  | 'none';

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  order: number;
}

export interface PropertyActivity {
  id: string;
  property_id: string;
  type: 'note' | 'viewing' | 'offer' | 'document' | 'milestone';
  title: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export interface Property {
  id: string;
  buyer_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  listing_price: number;
  purchase_price?: number;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'other';
  status: PropertyStatus;
  buying_stage: BuyingStage;
  action_required: ActionRequired;
  mls_number?: string;
  listing_url?: string;
  notes?: string;
  photos: PropertyPhoto[];
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  buyer?: Buyer;
}

export interface PropertyFilter {
  status?: PropertyStatus[];
  buying_stage?: BuyingStage[];
  action_required?: ActionRequired[];
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  property_type?: string[];
  last_activity_days?: number;
}

export interface PropertySummary {
  total_properties: number;
  by_status: Record<PropertyStatus, number>;
  by_stage: Record<BuyingStage, number>;
  requiring_action: number;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
