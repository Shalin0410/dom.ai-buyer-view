import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Since we're using simple login, just redirect to dashboard
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Redirecting...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Taking you to the dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
