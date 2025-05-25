
import ModernDashboard from '@/components/ModernDashboard';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import PropertyMatch from '@/components/PropertyMatch';
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

  return (
    <div className="pb-20">
      {activeTab === 'dashboard' && <ModernDashboard userData={userData} />}
      {activeTab === 'chat' && <EnhancedChatInterface onBack={handleChatBack} />}
      {activeTab === 'search' && <PropertyMatch />}
      {activeTab === 'profile' && <ProfilePage userData={userData} />}
    </div>
  );
};

export default MainAppContent;
