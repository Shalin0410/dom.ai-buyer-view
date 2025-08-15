import { useState } from 'react';
import ModernDashboard from '@/components/ModernDashboard';
import ChatbotInterface from '@/components/ChatbotInterface';
import ChatbotTest from '@/components/ChatbotTest';
import PropertySwiping from '@/components/PropertySwiping';
import ProfilePage from '@/components/ProfilePage';
import PropertyDetailPage from '@/components/PropertyDetailPage';
import { UserData } from '@/types/user';

interface MainAppContentProps {
  activeTab: string;
  userData: UserData | null;
  onTabChange?: (tab: string) => void;
}

const MainAppContent = ({ activeTab, userData, onTabChange }: MainAppContentProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleChatBack = () => {
    // Navigation handled by header now
  };

  const handlePropertyAction = (propertyId: string, action: 'like' | 'dislike' | 'save') => {
    // Property action logic can be implemented here
    // Future: Add property to saved/liked list, notify agent, etc.
  };

  const handleOpenChat = () => {
    onTabChange?.('chat');
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const handleBackToDashboard = () => {
    setSelectedPropertyId(null);
  };

  const handleNavigateToSearch = () => {
    if (onTabChange) {
      onTabChange('search');
    }
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
          onNavigateToSearch={handleNavigateToSearch}
        />
      )}
      {activeTab === 'chat' && <ChatbotInterface onBack={handleChatBack} />}
      {activeTab === 'chat-test' && <ChatbotTest />}
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
