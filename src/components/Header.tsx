
import { MessageSquare, Search, Home, User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const NavButton = ({ icon: Icon, label, tabKey, count = 0 }) => (
    <button
      onClick={() => onTabChange(tabKey)}
      className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 group ${
        activeTab === tabKey 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
          : 'text-[#2E2E2E] hover:bg-white/50 hover:shadow-md'
      }`}
    >
      <div className="relative">
        <Icon 
          size={20} 
          strokeWidth={activeTab === tabKey ? 2.5 : 2} 
        />
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-[#F47C6D] border-0 text-[#E8ECF2] shadow-lg">
            {count}
          </Badge>
        )}
      </div>
      <span className={`font-medium transition-all duration-300 ${
        activeTab === tabKey ? 'text-white' : 'text-[#2E2E2E]'
      }`}>
        {label}
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/30 shadow-modern">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dom AI
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <NavButton 
              icon={Home} 
              label="Dashboard" 
              tabKey="dashboard" 
            />
            <NavButton 
              icon={Search} 
              label="Search" 
              tabKey="search" 
            />
            <NavButton 
              icon={MessageSquare} 
              label="Messages" 
              tabKey="chat" 
            />
            <NavButton 
              icon={User} 
              label="Profile" 
              tabKey="profile" 
            />
            
            {/* User Info and Logout */}
            <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-white/20">
              <div className="text-sm text-gray-600">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} className="mr-1" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
