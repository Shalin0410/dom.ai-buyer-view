
import { MessageSquare, Search, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { user, signOut } = useAuth();

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
      className={`relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
        activeTab === tabKey
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {count > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </div>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">
                {'D'.toUpperCase()}
              </span>
            </div>
            <span className="text-xl font-bold text-black">Dom AI</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <NavButton
              icon={LayoutDashboard}
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-gray-600 hover:text-red-600 hover:bg-red-50 ml-2"
              title="Sign Out"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
