// Supabase Authentication Service Implementation
import { supabase } from '@/lib/supabaseClient';
import { BaseAuthService } from '../api/auth';
import { ApiResponse, AuthUser, AuthSession } from '../api/types';

export class SupabaseAuthService extends BaseAuthService {
  async signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>> {
    try {
      console.log('Simple login for email:', email);
      
      // Check if the buyer exists in our database using the persons table
      const { data: buyerData, error: buyerError } = await supabase
        .from('persons')
        .select('id, first_name, last_name, email, role, agent_id')
        .eq('email', email)
        .eq('role', 'buyer')
        .single();

      // If buyer doesn't exist, return error
      if (buyerError || !buyerData) {
        console.log('No buyer found for email:', email);
        return this.createResponse(null, 'Your email is not registered in our system. Please contact your real estate agent to get access to the platform.');
      }

      console.log('Buyer found:', buyerData);

      // Store the buyer data in localStorage for the mock session
      const mockUser: AuthUser = {
        id: buyerData.id,
        email: buyerData.email,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString()
      };

      // Store in localStorage to simulate a session
      localStorage.setItem('mockAuthUser', JSON.stringify(mockUser));
      localStorage.setItem('mockAuthSession', JSON.stringify({
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        expires_in: 3600,
        user: mockUser
      }));

      console.log('Mock session created for:', email);
      return this.createResponse(null);
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, 'There was an error processing your request. Please try again later.');
    }
  }

  async signOut(): Promise<ApiResponse<null>> {
    try {
      console.log('Signing out user...');
      
      // Clear mock session data
      localStorage.removeItem('mockAuthUser');
      localStorage.removeItem('mockAuthSession');
      
      // Also clear any real Supabase sessions
      await supabase.auth.signOut();
      
      console.log('User signed out successfully');
      return this.createResponse(null);
    } catch (error) {
      console.error('Error in signOut:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getCurrentSession(): Promise<ApiResponse<AuthSession>> {
    try {
      // First check for mock session
      const mockSessionStr = localStorage.getItem('mockAuthSession');
      if (mockSessionStr) {
        const mockSession = JSON.parse(mockSessionStr);
        return this.createResponse(mockSession);
      }

      // Fallback to real Supabase session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        return this.createResponse(null, error.message);
      }

      if (!data.session) {
        return this.createResponse(null, 'No active session');
      }

      const authSession: AuthSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 0,
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          created_at: data.session.user.created_at,
          last_sign_in_at: data.session.user.last_sign_in_at
        }
      };

      return this.createResponse(authSession);
    } catch (error) {
      console.error('Error getting current session:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      // First check for mock user
      const mockUserStr = localStorage.getItem('mockAuthUser');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        return this.createResponse(mockUser);
      }

      // Fallback to real Supabase user
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        return this.createResponse(null, error.message);
      }

      if (!data.user) {
        return this.createResponse(null, 'No authenticated user');
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at
      };

      return this.createResponse(authUser);
    } catch (error) {
      console.error('Error getting current user:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    // For mock authentication, we'll use a simple interval to check localStorage
    const checkMockAuth = () => {
      const mockUserStr = localStorage.getItem('mockAuthUser');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        callback(mockUser);
      } else {
        callback(null);
      }
    };

    // Check immediately
    checkMockAuth();

    // Set up interval to check for changes
    const interval = setInterval(checkMockAuth, 1000);

    // Also listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mockAuthUser') {
        checkMockAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}
