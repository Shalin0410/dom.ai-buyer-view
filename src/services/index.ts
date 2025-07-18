// Service Factory - Single point of access for all services
import { AuthService } from './api/auth';
import { DataService } from './api/data';
import { SupabaseAuthService } from './supabase/auth';
import { SupabaseDataService } from './supabase/data';

// Service configuration
export interface ServiceConfig {
  provider: 'supabase' | 'custom';
  // Add other configuration options as needed
}

// Service factory class
class ServiceFactory {
  private authService: AuthService | null = null;
  private dataService: DataService | null = null;
  private config: ServiceConfig;

  constructor(config: ServiceConfig = { provider: 'supabase' }) {
    this.config = config;
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      switch (this.config.provider) {
        case 'supabase':
          this.authService = new SupabaseAuthService();
          break;
        case 'custom':
          // Future: implement custom auth service
          throw new Error('Custom auth service not implemented yet');
        default:
          throw new Error(`Unknown auth provider: ${this.config.provider}`);
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
        case 'custom':
          // Future: implement custom data service
          throw new Error('Custom data service not implemented yet');
          break;
        default:
          throw new Error(`Unknown data provider: ${this.config.provider}`);
      }
    }
    return this.dataService;
  }

  // Method to change provider (useful for testing or switching backends)
  setProvider(provider: ServiceConfig['provider']) {
    this.config.provider = provider;
    // Reset services to force re-initialization with new provider
    this.authService = null;
    this.dataService = null;
  }
}

// Create and export singleton instance
const serviceFactory = new ServiceFactory();

// Export individual services for easy access
export const authService = serviceFactory.getAuthService();
export const dataService = serviceFactory.getDataService();

// Export factory for advanced usage
export { serviceFactory };

// Export types for consumers
export type { AuthService, DataService };
export * from './api/types';
