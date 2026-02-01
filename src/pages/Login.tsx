import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/services';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Missing information',
        description: 'Please enter your email address',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Verify email exists in persons table (bypasses RLS using admin client)
      const response = await dataService.verifyBuyerEmail(email);

      if (!response.success || !response.data) {
        toast({
          title: 'Account not found',
          description: 'No account found with this email address. Please check your email or contact your agent.',
          variant: 'destructive',
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Store buyer info in localStorage for the session
      localStorage.setItem('buyerId', response.data.id);
      localStorage.setItem('buyerEmail', email);

      toast({
        title: '✓ Login successful!',
        description: `Welcome back, ${response.data.first_name || 'there'}!`,
        duration: 3000,
      });

      // Navigate to main app
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: 'Login failed',
        description: err.message || 'Unable to verify your account. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToVoice = () => {
    navigate('/onboarding');
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
              Get started with your home search journey. Enter your email to sign in.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                🔒 Your email will be verified against our database.
              </p>
            </div>

            <Button
              onClick={handleSkipToVoice}
              variant="outline"
              className="w-full mt-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-gray-300 hover:bg-gray-50"
            >
              Skip to Voice Demo →
            </Button>
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
      `}</style>
    </>
  );
};

export default Login;
