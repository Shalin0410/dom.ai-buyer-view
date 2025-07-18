import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyer } from '@/hooks/useBuyer';

interface Props {
  children: JSX.Element;
}

const RequireAuth: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();

  // If we're still loading auth state, show loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no authenticated user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, check if they exist in buyers database
  // This ensures only buyers added by agents can access the app
  return <BuyerAccessCheck userEmail={user.email}>{children}</BuyerAccessCheck>;
};

// Component to check if authenticated user exists in buyers database
const BuyerAccessCheck: React.FC<{ userEmail: string; children: JSX.Element }> = ({ userEmail, children }) => {
  const { data: buyer, isLoading, error } = useBuyer(userEmail);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">There was an error verifying your access. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-amber-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Not Authorized</h2>
          <p className="text-gray-600 mb-4">
            Your account ({userEmail}) is not registered in our buyer database. 
            Please contact your real estate agent to get access to the platform.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Only buyers who have been added by their assigned agent can access this platform.
          </p>
          <button 
            onClick={() => {
              // Sign out the user since they don't have database access
              window.location.href = '/login';
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // User exists in buyers database, allow access
  return children;
};

export default RequireAuth;
