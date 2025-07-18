// Supabase Authentication Service Implementation
import { supabase } from '@/lib/supabaseClient';
import { BaseAuthService } from '../api/auth';
import { ApiResponse, AuthUser, AuthSession } from '../api/types';

export class SupabaseAuthService extends BaseAuthService {
  async signInWithMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<null>> {
    try {
      console.log('Clearing existing sessions before sending magic link...');
      
      // Clear existing sessions to prevent conflicts
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalRedirectUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: finalRedirectUrl,
          shouldCreateUser: false 
        },
      });

      if (error) {
        console.error('Error sending magic link:', error);
        return this.createResponse(null, error.message);
      }

      console.log('Magic link sent successfully');
      return this.createResponse(null);
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error);
      const apiError = this.handleError(error);
      return this.createResponse(null, apiError.message);
    }
  }

  async signOut(): Promise<ApiResponse<null>> {
    try {
      console.log('Signing out user...');
      
      // Sign out from Supabase (this should clear all sessions)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        return this.createResponse(null, error.message);
      }

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }
}
