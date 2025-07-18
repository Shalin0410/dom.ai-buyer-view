# Backend Migration Guide

This guide explains how to migrate from the current Supabase backend to a different backend provider using the new service layer architecture.

## Quick Migration Steps

### 1. Create New Service Implementation

Create a new folder under `/src/services/` for your new provider:

```
src/services/
├── api/                    # Keep these (interfaces)
├── supabase/              # Current implementation
├── your-new-provider/     # New implementation
│   ├── auth.ts
│   └── data.ts
└── index.ts               # Update this
```

### 2. Implement AuthService

```typescript
// /src/services/your-new-provider/auth.ts
import { BaseAuthService } from '../api/auth';
import { ApiResponse, AuthUser, AuthSession } from '../api/types';

export class YourNewAuthService extends BaseAuthService {
  async signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>> {
    try {
      // Implement your auth provider's magic link logic
      const result = await yourAuthProvider.sendMagicLink(email, redirectUrl);
      return this.createResponse(null);
    } catch (error) {
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async signOut(): Promise<ApiResponse<null>> {
    // Implement sign out logic
  }

  async getCurrentSession(): Promise<ApiResponse<AuthSession>> {
    // Implement session retrieval logic
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    // Implement user retrieval logic
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    // Implement auth state change listener
    // Return unsubscribe function
  }
}
```

### 3. Implement DataService

```typescript
// /src/services/your-new-provider/data.ts
import { BaseDataService } from '../api/data';
import { ApiResponse, Buyer, Agent } from '../api/types';

export class YourNewDataService extends BaseDataService {
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    try {
      // Implement your data provider's buyer fetching logic
      const buyers = await yourDataProvider.getBuyers();
      return this.createResponse(buyers);
    } catch (error) {
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getBuyerByEmail(email: string): Promise<ApiResponse<Buyer>> {
    // Implement buyer by email logic
  }

  // Implement all other required methods...
}
```

### 4. Update Service Factory

```typescript
// /src/services/index.ts
import { YourNewAuthService } from './your-new-provider/auth';
import { YourNewDataService } from './your-new-provider/data';

class ServiceFactory {
  // ... existing code ...

  getAuthService(): AuthService {
    if (!this.authService) {
      switch (this.config.provider) {
        case 'supabase':
          this.authService = new SupabaseAuthService();
          break;
        case 'your-new-provider':
          this.authService = new YourNewAuthService();
          break;
        // ... other cases
      }
    }
    return this.authService;
  }

  getDataService(): DataService {
    if (!this.dataService) {
      switch (this.config.provider) {
        case 'supabase':
          this.dataService = new SupabaseDataService();
          break;
        case 'your-new-provider':
          this.dataService = new YourNewDataService();
          break;
        // ... other cases
      }
    }
    return this.dataService;
  }
}

// Change the default provider
const serviceFactory = new ServiceFactory({ 
  provider: 'your-new-provider' // Changed from 'supabase'
});
```

### 5. Update Environment Variables

Create new environment variables for your new provider:

```env
# .env
VITE_YOUR_NEW_PROVIDER_API_KEY=your_api_key
VITE_YOUR_NEW_PROVIDER_URL=your_api_url
# Remove or keep Supabase vars for fallback
```

### 6. Test the Migration

1. **Start with a test environment**
2. **Verify authentication flow works**
3. **Test all data operations**
4. **Check error handling**
5. **Validate type safety**

## Common Backend Providers

### Firebase Migration

```typescript
// Firebase Auth Service Example
import { auth } from 'firebase/auth';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export class FirebaseAuthService extends BaseAuthService {
  async signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>> {
    try {
      const actionCodeSettings = {
        url: redirectUrl || `${window.location.origin}/auth/callback`,
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      
      return this.createResponse(null);
    } catch (error) {
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }
  
  // ... implement other methods
}
```

### REST API Migration

```typescript
// REST API Data Service Example
export class RestApiDataService extends BaseDataService {
  private baseUrl = process.env.VITE_API_BASE_URL;
  
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/buyers`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buyers = await response.json();
      return this.createResponse(buyers);
    } catch (error) {
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }
  
  // ... implement other methods
}
```

## Migration Checklist

### Pre-Migration
- [ ] Backup current database
- [ ] Document current data schema
- [ ] Set up new backend provider
- [ ] Create test environment

### Implementation
- [ ] Create new service implementations
- [ ] Update service factory
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Test data operations
- [ ] Verify error handling

### Post-Migration
- [ ] Update deployment configuration
- [ ] Monitor for errors
- [ ] Update documentation
- [ ] Train team on new provider

### Rollback Plan
- [ ] Keep Supabase services as fallback
- [ ] Document rollback procedure
- [ ] Test rollback in staging

## Troubleshooting

### Common Issues

1. **Type Mismatches**: Ensure your new provider's data types match the `Buyer` and `Agent` interfaces
2. **Authentication Flow**: Different providers have different magic link implementations
3. **Error Handling**: Map provider-specific errors to consistent `ApiResponse` format
4. **Environment Variables**: Update all deployment environments

### Testing Strategy

```typescript
// Example test for new service
describe('YourNewDataService', () => {
  let service: YourNewDataService;
  
  beforeEach(() => {
    service = new YourNewDataService();
  });
  
  it('should fetch buyers successfully', async () => {
    const response = await service.getBuyers();
    expect(response.success).toBe(true);
    expect(response.data).toBeInstanceOf(Array);
  });
  
  it('should handle errors gracefully', async () => {
    // Mock error scenario
    const response = await service.getBuyerById('invalid-id');
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
```

## Benefits of This Architecture

1. **Zero Component Changes**: React components don't need updates
2. **Gradual Migration**: Can migrate services one at a time
3. **Easy Rollback**: Switch back by changing one configuration
4. **Provider Comparison**: Can A/B test different backends
5. **Future-Proof**: Easy to add new providers later

## Support

If you encounter issues during migration:

1. Check the service interfaces in `/src/services/api/`
2. Review existing Supabase implementation for reference
3. Ensure all required methods are implemented
4. Test with small data sets first
5. Use TypeScript compiler to catch interface mismatches
