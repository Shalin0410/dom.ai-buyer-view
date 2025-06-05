
import { MessageSquare, Search, Home, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const NavButton = ({ icon: Icon, label, tabKey, count = 0 }) => (
    <button
      onClick={() => onTabChange(tabKey)}
      className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 group ${
        activeTab === tabKey 
          ? 'bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] text-[#E8ECF2] shadow-lg' 
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
        activeTab === tabKey ? 'text-[#E8ECF2]' : 'text-[#2E2E2E]'
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
            <div className="w-10 h-10 bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] rounded-xl flex items-center justify-center shadow-lg">
              <Home size={20} className="text-[#E8ECF2]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] bg-clip-text text-transparent">
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
              count={3}
            />
            <NavButton 
              icon={User} 
              label="Profile" 
              tabKey="profile" 
            />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
