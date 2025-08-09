
import { useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import MainAppContent from '@/components/MainAppContent';
import { Toaster } from '@/components/ui/toaster';
import { useBuyer } from '@/hooks/useBuyer';
import { UserData } from '@/types/user';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { user } = useAuth();
  const email = user?.email ?? '';
  const { data: buyer, isLoading, error } = useBuyer(email);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading buyer data</div>;
  if (!buyer) return <div>No buyer record found for {email}</div>;

  const userData: UserData | null = buyer ? {
    id: buyer.id,
    email: buyer.email,
    first_name: buyer.first_name,
    last_name: buyer.last_name,
    name: `${buyer.first_name} ${buyer.last_name}`,
    isFirstTime: false,
    preferences: '',
    agent_id: buyer.agent_id,
    agent: buyer.agent,
  } : null;

  // Main website interface - no authentication flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {userData && (
          <MainAppContent 
            activeTab={activeTab} 
            userData={userData} 
            onTabChange={setActiveTab}
          />
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
