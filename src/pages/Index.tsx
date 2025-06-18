
import { useState } from 'react';
import Header from '@/components/Header';
import MainAppContent from '@/components/MainAppContent';

interface UserData {
  id: number;
  email: string;
  name: string;
  isFirstTime: boolean;
  preferences?: string;
  realtorInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock user data since we're removing authentication
  const userData: UserData = {
    id: 1,
    email: 'user@example.com',
    name: 'Sarah Johnson',
    isFirstTime: false,
    preferences: 'Modern homes with great views',
    realtorInfo: {
      name: 'John Smith',
      email: 'john@realty.com',
      phone: '(555) 123-4567'
    }
  };

  // Main website interface - no authentication flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <MainAppContent activeTab={activeTab} userData={userData} />
      </main>
    </div>
  );
};

export default Index;
