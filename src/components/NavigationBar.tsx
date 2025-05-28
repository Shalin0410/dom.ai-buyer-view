
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
      className={`relative flex flex-col items-center p-4 transition-all duration-300 group ${
        activeTab === tabKey 
          ? 'text-brand-coral' 
          : 'text-brand-navy/60 hover:text-brand-navy'
      }`}
    >
      <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
        activeTab === tabKey 
          ? 'bg-gradient-to-r from-brand-coral to-brand-coral/80 shadow-lg scale-110' 
          : 'bg-white/60 backdrop-blur-sm group-hover:bg-white/80 group-hover:shadow-md'
      }`}>
        <Icon 
          size={20} 
          strokeWidth={activeTab === tabKey ? 2.5 : 2} 
          className={activeTab === tabKey ? 'text-white' : 'text-current'}
        />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-gradient-to-r from-brand-teal to-brand-teal/80 border-0 text-white shadow-lg">
            {count}
          </Badge>
        )}
      </div>
      <span className={`text-xs mt-2 font-medium transition-all duration-300 ${
        activeTab === tabKey ? 'text-brand-coral font-semibold' : 'text-brand-navy/60'
      }`}>
        {label}
      </span>
      {activeTab === tabKey && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full" />
      )}
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card border-t border-white/30 shadow-floating">
        <div className="max-w-lg mx-auto px-2 py-2">
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
    </div>
  );
};

export default NavigationBar;
