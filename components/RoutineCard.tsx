
import React from 'react';
import { Check } from 'lucide-react';
import { RoutineStep } from '../types';

interface RoutineCardProps {
  step: RoutineStep;
  onToggle: (id: string) => void;
  isDarkMode?: boolean;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ step, onToggle, isDarkMode }) => {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'cleanse': return '💧';
      case 'serum': return '🧪';
      case 'hydrate': return '🧴';
      case 'protect': return '☀️';
      default: return '✨';
    }
  };

  return (
    <div 
      className={`p-4 mb-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
        step.completed 
          ? (isDarkMode ? 'border-[#D4C4A8]/40 bg-gray-800 shadow-sm' : 'border-[#D4C4A8] bg-white shadow-sm') 
          : (isDarkMode ? 'border-gray-800 bg-gray-900 shadow-md' : 'border-gray-100 bg-white shadow-md')
      }`}
      onClick={() => onToggle(step.id)}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${
          step.completed ? 'bg-[#D4C4A8] text-white' : (isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#EAE2D6] text-[#2E2A25]')
        }`}>
          {getIcon(step.icon)}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm transition-colors ${
            step.completed 
              ? 'text-gray-500 line-through' 
              : (isDarkMode ? 'text-white' : 'text-[#2E2A25]')
          }`}>
            {step.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
            {step.description}
          </p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          step.completed ? 'bg-[#D4C4A8] border-[#D4C4A8]' : (isDarkMode ? 'border-gray-700' : 'border-gray-300')
        }`}>
          {step.completed && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  );
};

export default RoutineCard;
