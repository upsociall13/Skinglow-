
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
    { id: AppView.ANALYSIS, icon: Camera, label: 'Analysis' },
    { id: AppView.ROUTINE, icon: Calendar, label: 'Routine' },
    { id: AppView.SHOP, icon: ShoppingBag, label: 'Shop' },
    { id: AppView.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 pb-8 flex justify-between items-center z-50 transition-colors ${isDarkMode ? 'bg-[#1A1816] border-gray-800' : 'bg-white border-gray-100'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center space-y-1"
          >
            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-[#D4C4A8] text-white' : (isDarkMode ? 'text-gray-600' : 'text-gray-400')}`}>
              <Icon size={20} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isActive ? (isDarkMode ? 'text-[#D4C4A8]' : 'text-[#2E2A25]') : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
