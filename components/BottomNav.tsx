
import React from 'react';
import { Camera, Calendar, ShoppingBag, User } from 'lucide-react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isDarkMode?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, isDarkMode }) => {
  const items = [
    { 
      id: AppView.ANALYSIS, 
      icon: Camera, 
      label: 'Analysis',
      tooltip: 'Get AI-powered skin assessment'
    },
    { 
      id: AppView.ROUTINE, 
      icon: Calendar, 
      label: 'Routine',
      tooltip: 'View your personalized daily steps'
    },
    { 
      id: AppView.SHOP, 
      icon: ShoppingBag, 
      label: 'Shop',
      tooltip: 'Buy expert-recommended products'
    },
    { 
      id: AppView.PROFILE, 
      icon: User, 
      label: 'Profile',
      tooltip: 'Manage settings and skin diary'
    },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 pb-8 flex justify-between items-center z-50 transition-colors ${isDarkMode ? 'bg-[#1A1816] border-gray-800' : 'bg-white border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <div key={item.id} className="relative group">
            {/* Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none scale-90 group-hover:scale-100 z-[60] shadow-xl ${
              isDarkMode 
                ? 'bg-white text-gray-900' 
                : 'bg-[#2E2A25] text-white'
            }`}>
              {item.tooltip}
              {/* Tooltip Arrow */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent ${
                isDarkMode ? 'border-t-white' : 'border-t-[#2E2A25]'
              }`} />
            </div>

            <button
              onClick={() => setView(item.id)}
              className="flex flex-col items-center space-y-1"
              aria-label={item.tooltip}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-[#D4C4A8] text-white shadow-lg' 
                  : (isDarkMode ? 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/50' : 'text-gray-400 hover:text-[#2E2A25] hover:bg-gray-100')
              }`}>
                <Icon size={20} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive 
                  ? (isDarkMode ? 'text-[#D4C4A8]' : 'text-[#2E2A25]') 
                  : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
