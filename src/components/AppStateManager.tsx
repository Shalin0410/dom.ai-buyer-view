import { useState } from 'react';
import AuthFlow from '@/components/AuthFlow';
import PreferenceInput from '@/components/PreferenceInput';
import PropertySwiping from '@/components/PropertySwiping';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import PreferenceSuccess from '@/components/PreferenceSuccess';

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

interface AppStateManagerProps {
  appState: AppState;
  userData: UserData | null;
  userPreferences: string;
  onStateChange: (state: AppState) => void;
  onUserDataUpdate: (userData: UserData) => void;
  onPreferencesUpdate: (preferences: string) => void;
}

const AppStateManager = ({
  appState,
  userData,
  userPreferences,
  onStateChange,
  onUserDataUpdate,
  onPreferencesUpdate
}: AppStateManagerProps) => {
  const handleLogin = (user: UserData) => {
    onUserDataUpdate(user);
    if (user.isFirstTime) {
      onStateChange('preferences');
    } else {
      onStateChange('swiping');
    }
  };

  const handlePreferencesComplete = (preferences: string, realtorInfo?: any) => {
    onPreferencesUpdate(preferences);
    if (userData) {
      onUserDataUpdate({
        ...userData,
        preferences,
        realtorInfo
      });
    }
    // Show success message before going to swiping
    onStateChange('profile-notification');
  };

  const handleSuccessComplete = () => {
    onStateChange('swiping');
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
    onStateChange('chat');
  };

  const handleBackFromChat = () => {
    onStateChange('swiping');
  };

  switch (appState) {
    case 'auth':
      return <AuthFlow onLogin={handleLogin} />;
    
    case 'preferences':
      return <PreferenceInput onComplete={handlePreferencesComplete} />;
    
    case 'profile-notification':
      return <PreferenceSuccess onComplete={handleSuccessComplete} />;
    
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
      return null;
  }
};

export default AppStateManager;
