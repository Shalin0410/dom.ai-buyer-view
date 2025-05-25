
import { MessageSquare, Search, Home, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationBar = ({ activeTab, onTabChange }: NavigationBarProps) => {
  const NavButton = ({ icon: Icon, label, tabKey, count = 0 }) => (
    <button
      onClick={() => onTabChange(tabKey)}
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

  return (
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
  );
};

export default NavigationBar;
