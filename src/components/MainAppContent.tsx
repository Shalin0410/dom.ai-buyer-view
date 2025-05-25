
import ModernDashboard from '@/components/ModernDashboard';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import PropertySwiping from '@/components/PropertySwiping';
import ProfilePage from '@/components/ProfilePage';

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
  // In the main app context, we don't need the back functionality
  // since we have bottom navigation
  const handleChatBack = () => {
    // Could potentially navigate to dashboard or do nothing
    // since we have bottom navigation
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
    // In main app, this could switch to chat tab
    console.log('Open chat from property swiping');
  };

  return (
    <div className="pb-20">
      {activeTab === 'dashboard' && <ModernDashboard userData={userData} />}
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
