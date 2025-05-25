
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
  return (
    <div className="pb-20">
      {activeTab === 'dashboard' && <ModernDashboard userData={userData} />}
      {activeTab === 'chat' && <EnhancedChatInterface />}
      {activeTab === 'search' && <PropertyMatch />}
      {activeTab === 'profile' && <ProfilePage userData={userData} />}
    </div>
  );
};

export default MainAppContent;
