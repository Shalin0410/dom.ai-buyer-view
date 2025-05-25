
import { useState } from 'react';
import { MessageSquare, Search, Home, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChatInterface from '@/components/ChatInterface';
import PropertyMatch from '@/components/PropertyMatch';
import ProgressTracker from '@/components/ProgressTracker';
import PropertyCard from '@/components/PropertyCard';
import AuthFlow from '@/components/AuthFlow';
import PreferenceInput from '@/components/PreferenceInput';
import ProfileNotification from '@/components/ProfileNotification';
import PropertySwiping from '@/components/PropertySwiping';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import ModernDashboard from '@/components/ModernDashboard';
import ProfilePage from '@/components/ProfilePage';

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

  const NavButton = ({ icon: Icon, label, tabKey, count = 0 }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`flex flex-col items-center p-3 transition-all ${
        activeTab === tabKey 
          ? 'text-blue-600' 
          : 'text-gray-500'
      }`}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={activeTab === tabKey ? 2.5 : 2} />
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
            {count}
          </Badge>
        )}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );

  const handleLogin = (user: UserData) => {
    setUserData(user);
    if (user.isFirstTime) {
      setAppState('preferences');
    } else {
      setAppState('dashboard');
    }
  };

  const handlePreferencesComplete = (preferences: string, realtorInfo?: any) => {
    setUserPreferences(preferences);
    if (userData) {
      setUserData({
        ...userData,
        realtorInfo
      });
    }
    setAppState('profile-notification');
  };

  const handleProfileAccept = () => {
    if (userData) {
      setUserData({
        ...userData,
        preferences: userPreferences
      });
    }
    setAppState('dashboard');
  };

  const handleProfileEdit = () => {
    setAppState('preferences');
  };

  const handlePropertyAction = (propertyId: number, action: 'like' | 'dislike' | 'save') => {
    console.log(`Property ${propertyId} ${action}d`);
    
    if (action === 'like') {
      console.log('- Saved under liked homes');
      console.log('- Realtor notified');
      console.log('- Auto-booking appointment process started');
      console.log('- Learning user preferences for algorithm improvement');
    } else if (action === 'save') {
      console.log('- Saved under liked homes');
      console.log('- Realtor notified');
      console.log('- Learning user preferences for algorithm improvement');
    } else if (action === 'dislike') {
      console.log('- Learning user preferences for algorithm improvement');
    }

    if (Math.random() > 0.7) {
      console.log('🔔 Profile Update: We noticed you like homes with views. Should we add this to your preferences?');
    }
  };

  const handleOpenChat = () => {
    setAppState('chat');
  };

  const handleBackFromChat = () => {
    setAppState('swiping');
  };

  // Render based on current state
  switch (appState) {
    case 'auth':
      return <AuthFlow onLogin={handleLogin} />;
    
    case 'preferences':
      return <PreferenceInput onComplete={handlePreferencesComplete} />;
    
    case 'profile-notification':
      return (
        <ProfileNotification 
          userInput={userPreferences}
          onAccept={handleProfileAccept}
          onEdit={handleProfileEdit}
        />
      );
    
    case 'swiping':
      return (
        <PropertySwiping 
          userProfile={userData}
          onPropertyAction={handlePropertyAction}
          onOpenChat={handleOpenChat}
        />
      );
    
    case 'chat':
      return <EnhancedChatInterface onBack={handleBackFromChat} />;
    
    default:
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Main Content */}
          <div className="pb-20">
            {activeTab === 'dashboard' && <ModernDashboard userData={userData} />}
            {activeTab === 'chat' && <EnhancedChatInterface />}
            {activeTab === 'search' && <PropertyMatch />}
            {activeTab === 'profile' && <ProfilePage userData={userData} />}
          </div>

          {/* Modern Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg">
            <div className="max-w-lg mx-auto px-4 py-2">
              <div className="flex justify-around">
                <NavButton 
                  icon={MessageSquare} 
                  label="Chat" 
                  tabKey="chat" 
                  count={3}
                />
                <NavButton 
                  icon={Search} 
                  label="Search" 
                  tabKey="search" 
                />
                <NavButton 
                  icon={Home} 
                  label="Dashboard" 
                  tabKey="dashboard" 
                />
                <NavButton 
                  icon={User} 
                  label="Profile" 
                  tabKey="profile" 
                />
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default Index;
