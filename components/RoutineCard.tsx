
import React from 'react';
import { Check, GripVertical } from 'lucide-react';
import { RoutineStep } from '../types';

interface RoutineCardProps {
  step: RoutineStep;
  index: number;
  onToggle: (id: string) => void;
  isDarkMode?: boolean;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ 
  step, 
  index,
  onToggle, 
  isDarkMode, 
  onDragStart, 
  onDragEnter, 
  onDragEnd,
  isDragging 
}) => {
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
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`p-4 mb-4 rounded-2xl border transition-all duration-300 ${
        isDragging ? 'opacity-30 scale-95 shadow-none' : 'opacity-100 scale-100'
      } ${
        step.completed 
          ? (isDarkMode ? 'border-[#D4C4A8]/40 bg-gray-800 shadow-sm' : 'border-[#D4C4A8] bg-white shadow-sm') 
          : (isDarkMode ? 'border-gray-800 bg-gray-900 shadow-md' : 'border-gray-100 bg-white shadow-md')
      } group active:cursor-grabbing`}
    >
      <div className="flex items-center space-x-3">
        {/* Drag Handle */}
        <div className={`cursor-grab active:cursor-grabbing transition-colors p-1 ${isDarkMode ? 'text-gray-600 hover:text-[#D4C4A8]' : 'text-gray-300 hover:text-[#D4C4A8]'}`}>
          <GripVertical size={18} />
        </div>

        <div 
          className="flex flex-1 items-center space-x-4 cursor-pointer"
          onClick={() => onToggle(step.id)}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors shrink-0 shadow-inner ${
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
            <p className={`text-xs line-clamp-1 mt-0.5 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {step.description}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
            step.completed ? 'bg-[#D4C4A8] border-[#D4C4A8]' : (isDarkMode ? 'border-gray-700' : 'border-gray-300')
          }`}>
            {step.completed && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineCard;
