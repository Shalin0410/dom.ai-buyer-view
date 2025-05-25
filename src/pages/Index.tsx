
import { useState } from 'react';
import NavigationBar from '@/components/NavigationBar';
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
      <AppStateManager
        appState={appState}
        userData={userData}
        userPreferences={userPreferences}
        onStateChange={setAppState}
        onUserDataUpdate={setUserData}
        onPreferencesUpdate={setUserPreferences}
      />
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50">
      <MainAppContent activeTab={activeTab} userData={userData} />
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
