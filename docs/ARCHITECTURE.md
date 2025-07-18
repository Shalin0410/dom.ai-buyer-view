# Frontend/Backend Architecture

This document describes the new service-based architecture implemented to separate frontend and backend concerns, making it easier to change data sources and backends in the future.

## Overview

The application now uses a clean service layer architecture that abstracts data access and authentication logic from the React components. This allows for easy switching between different backend providers (currently Supabase, but easily extensible to other databases or APIs).

## Architecture Layers

### 1. Service Layer (`/src/services/`)

The service layer provides a clean abstraction between the frontend and backend:

```
src/services/
├── api/                    # Abstract interfaces and types
│   ├── types.ts           # Common data types and API response structures
│   ├── auth.ts            # Authentication service interface
│   └── data.ts            # Data service interface
├── supabase/              # Supabase-specific implementations
│   ├── auth.ts            # Supabase authentication implementation
│   └── data.ts            # Supabase data access implementation
└── index.ts               # Service factory and exports
```

#### Key Benefits:
- **Provider Agnostic**: Easy to switch from Supabase to any other backend
- **Type Safety**: Consistent TypeScript interfaces across all services
- **Error Handling**: Standardized error handling and response formats
- **Testing**: Easy to mock services for unit testing

### 2. React Hooks (`/src/hooks/`)

Updated hooks that consume the service layer:

- `useAuth.ts` - Authentication state management using AuthService
- `useBuyer.ts` - Buyer data fetching using DataService
- Additional hooks for agents, properties, etc.

### 3. Components (`/src/components/`)

React components now use hooks instead of direct database calls:

- No direct Supabase imports in components
- Clean separation of concerns
- Easier to test and maintain

## Service Interfaces

### AuthService Interface

```typescript
interface AuthService {
  signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>>;
  signOut(): Promise<ApiResponse<null>>;
  getCurrentSession(): Promise<ApiResponse<AuthSession>>;
  getCurrentUser(): Promise<ApiResponse<AuthUser>>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}
```

### DataService Interface

```typescript
interface DataService {
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
  // ... more agent operations

  // Relationship operations
  getBuyersWithAgents(): Promise<ApiResponse<Buyer[]>>;
  getBuyersByAgentId(agentId: string): Promise<ApiResponse<Buyer[]>>;
}
```

## Usage Examples

### Using Services in Components

```typescript
// OLD WAY (Direct Supabase)
import { supabase } from '@/lib/supabaseClient';

const { data, error } = await supabase
  .from('buyers')
  .select('*')
  .eq('email', email);

// NEW WAY (Service Layer)
import { dataService } from '@/services';

const response = await dataService.getBuyerByEmail(email);
if (response.success) {
  const buyer = response.data;
}
```

### Using Updated Hooks

```typescript
// OLD WAY
const { data: buyers, isLoading } = useQuery({
  queryKey: ['buyers'],
  queryFn: async () => {
    const { data, error } = await supabase.from('buyers').select('*');
    if (error) throw error;
    return data;
  }
});

// NEW WAY
import { useBuyers } from '@/hooks/useBuyer';

const { data: buyers, isLoading } = useBuyers();
```

## Switching Backend Providers

To switch from Supabase to a different backend:

1. **Create new implementation**: Add a new folder under `/src/services/` (e.g., `/src/services/firebase/`)
2. **Implement interfaces**: Create classes that implement `AuthService` and `DataService`
3. **Update service factory**: Modify `/src/services/index.ts` to use the new provider
4. **No component changes needed**: All React components continue to work unchanged

Example:

```typescript
// In /src/services/index.ts
const serviceFactory = new ServiceFactory({ 
  provider: 'firebase' // Changed from 'supabase'
});
```

## Error Handling

All services return a consistent `ApiResponse<T>` format:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
```

This makes error handling consistent across the application:

```typescript
const response = await dataService.getBuyer(id);
if (!response.success) {
  console.error('Error:', response.error);
  return;
}
// Use response.data safely
```

## Migration Summary

### Files Updated:
- ✅ `AuthContext.tsx` - Now uses AuthService
- ✅ `AuthCallback.tsx` - Now uses AuthService  
- ✅ `ProfileSwitcher.tsx` - Now uses DataService via hooks
- ✅ `useBuyer.ts` - Now uses DataService
- ✅ `useAuth.ts` - New hook using AuthService

### Files Added:
- ✅ Service interfaces and types
- ✅ Supabase service implementations
- ✅ Service factory for provider management

### Benefits Achieved:
- 🎯 **Easy Backend Switching**: Change provider in one place
- 🛡️ **Type Safety**: Consistent TypeScript interfaces
- 🧪 **Better Testing**: Mock services instead of database calls
- 🔧 **Maintainability**: Clear separation of concerns
- 📚 **Documentation**: Well-documented architecture

## Next Steps

1. **Add more service implementations** as needed (Firebase, REST APIs, etc.)
2. **Implement caching layer** in the service factory if needed
3. **Add service-level logging** for better debugging
4. **Create integration tests** for service implementations
