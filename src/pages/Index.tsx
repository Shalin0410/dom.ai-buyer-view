
import { useState } from 'react';
import Header from '@/components/Header';
import AppStateManager from '@/components/AppStateManager';
import MainAppContent from '@/components/MainAppContent';

type AppState = 'auth' | 'preferences' | 'profile-notification' | 'swiping' | 'chat' | 'dashboard';

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
  const [appState, setAppState] = useState<AppState>('auth');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPreferences, setUserPreferences] = useState<string>('');

  // If user is not logged in, show the app state flow
  if (appState !== 'dashboard' && appState !== 'swiping') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10">
        <AppStateManager
          appState={appState}
          userData={userData}
          userPreferences={userPreferences}
          onStateChange={setAppState}
          onUserDataUpdate={setUserData}
          onPreferencesUpdate={setUserPreferences}
        />
      </div>
    );
  }

  // Main website interface
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
