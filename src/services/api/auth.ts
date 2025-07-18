// Authentication Service Interface
import { ApiResponse, AuthUser, AuthSession, ApiError } from './types';

export interface AuthService {
  // Authentication methods
  signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>>;
  signOut(): Promise<ApiResponse<null>>;
  getCurrentSession(): Promise<ApiResponse<AuthSession>>;
  getCurrentUser(): Promise<ApiResponse<AuthUser>>;
  
  // Session management
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

// Abstract base class for authentication implementations
export abstract class BaseAuthService implements AuthService {
  abstract signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>>;
  abstract signOut(): Promise<ApiResponse<null>>;
  abstract getCurrentSession(): Promise<ApiResponse<AuthSession>>;
  abstract getCurrentUser(): Promise<ApiResponse<AuthUser>>;
  abstract onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;

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
