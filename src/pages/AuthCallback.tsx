import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setStatus('Processing authentication...');
        
        console.log('Auth callback - Full URL:', window.location.href);
        console.log('Auth callback - Search params:', window.location.search);
        console.log('Auth callback - Hash:', window.location.hash);

        // Check for errors in the URL hash first
        const hash = window.location.hash.substring(1); // Remove the '#'
        const params = new URLSearchParams(hash);
        const errorCode = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (errorCode) {
          console.error('Authentication error from URL:', errorCode, errorDescription);
          
          let userFriendlyMessage = 'Authentication failed. Please try again.';
          
          if (errorCode === 'access_denied' && params.get('error_code') === 'otp_expired') {
            userFriendlyMessage = 'The magic link has expired or has already been used. Please request a new magic link to sign in.';
          } else if (errorCode === 'access_denied') {
            userFriendlyMessage = 'Access was denied. The magic link may be invalid or expired.';
          }
          
          setError(userFriendlyMessage);
          return;
        }

        const type = params.get('type');
        
        if (type === 'magiclink' || type === 'signup') {
          // This is a magic link or signup link
          setStatus('Verifying magic link...');
          
          // Get the current session after magic link authentication
          const response = await authService.getCurrentSession();
          
          if (!response.success) {
            console.error('Error getting session after magic link:', response.error);
            setError(`Authentication error: ${response.error}`);
            return;
          }
          
          if (response.data) {
            console.log('Magic link authentication successful for user:', response.data.user?.email);
            // Clear the URL hash to prevent re-processing
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setStatus('Authentication successful! Redirecting...');
            navigate('/', { replace: true });
            return;
          }
        }
        
        // Fallback: Check if we have a valid session
        const sessionResponse = await authService.getCurrentSession();
        
        if (!sessionResponse.success) {
          console.error('Error getting session:', sessionResponse.error);
          setError(`Session error: ${sessionResponse.error}`);
          return;
        }

        if (!sessionResponse.success) {
          console.error('Auth error:', sessionResponse.error);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (sessionResponse.data) {
          console.log('Authentication successful, redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('No session found after magic link processing');
          setError('Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {error ? 'Authentication Error' : 'Authenticating...'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error || status}
          </p>
          {error && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Request New Magic Link
              </button>
              <p className="text-xs text-gray-500">
                If you continue to have issues, try clearing your browser cache or using an incognito window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
