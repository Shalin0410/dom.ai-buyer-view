
import { useState } from 'react';
import ModernDashboard from '@/components/ModernDashboard';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import PropertySwiping from '@/components/PropertySwiping';
import ProfilePage from '@/components/ProfilePage';
import PropertyDetailPage from '@/components/PropertyDetailPage';

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

interface MainAppContentProps {
  activeTab: string;
  userData: UserData | null;
}

const MainAppContent = ({ activeTab, userData }: MainAppContentProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const handleChatBack = () => {
    // Navigation handled by header now
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
    console.log('Open chat from property swiping');
  };

  const handlePropertyClick = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
  };

  const handleBackToDashboard = () => {
    setSelectedPropertyId(null);
  };

  // Show property detail page if a property is selected
  if (selectedPropertyId) {
    return (
      <div className="w-full">
        <PropertyDetailPage 
          propertyId={selectedPropertyId}
          onBack={handleBackToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {activeTab === 'dashboard' && (
        <ModernDashboard 
          userData={userData} 
          onPropertyClick={handlePropertyClick}
        />
      )}
      {activeTab === 'chat' && <EnhancedChatInterface onBack={handleChatBack} />}
      {activeTab === 'search' && (
        <PropertySwiping 
          userProfile={userData}
          onPropertyAction={handlePropertyAction}
          onOpenChat={handleOpenChat}
        />
      )}
      {activeTab === 'profile' && <ProfilePage userData={userData} />}
    </div>
  );
};

export default MainAppContent;
