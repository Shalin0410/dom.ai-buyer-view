import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Basic email format validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if fields are filled
    if (!name || !email) {
      setError('Please fill in your name and email');
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Verify if the email exists in the database (uses admin client to bypass RLS)
      const buyerResponse = await dataService.verifyBuyerEmail(email);

      if (!buyerResponse.success || !buyerResponse.data) {
        setError('No account found with this email address. Please check your email or contact your agent.');
        setLoading(false);
        return;
      }

      // Email exists - store user info and navigate to dashboard
      localStorage.setItem('tempUserName', name);
      localStorage.setItem('tempUserEmail', email);
      localStorage.setItem('buyerId', buyerResponse.data.id);

      // Navigate to main app dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Unable to verify your account. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fixed Header Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              D
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-900">Dom AI</div>
          </div>
          {/* <nav className="flex items-center gap-3 sm:gap-6">
            <a href="#dashboard" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Grid2X2 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </a>
            <a href="#search" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </a>
            <a href="#messages" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </a>
            <a href="#profile" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </a>
          </nav> */}
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
        <div className="w-full max-w-md lg:max-w-lg">
          <Card className="p-6 sm:p-8 lg:p-12 shadow-lg border border-gray-200 rounded-2xl animate-[slideUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
              Welcome to Dom
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Get started with your home search journey. We'll send you a secure link to sign in.
            </p>

            <form onSubmit={handleSendMagicLink} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full text-sm sm:text-base px-3 sm:px-4 py-2.5 sm:py-3 border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 text-sm sm:text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                🔒 We'll send you a secure link to access your account. No password needed!
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg animate-[fadeIn_0.4s_ease]">
                <p className="text-xs sm:text-sm text-red-900 leading-relaxed">
                  <strong className="font-semibold">Error:</strong> {error}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Login;
