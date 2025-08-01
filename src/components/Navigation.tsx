import React from 'react';
import { Home, BookOpen, Users, Bot, MessageCircle } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, color: 'from-blue-500 to-indigo-600' },
    { id: 'courses', label: 'Courses', icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
    { id: 'students', label: 'Students', icon: Users, color: 'from-purple-500 to-violet-600' },
    // { id: 'supercoaches', label: 'SuperCoaches', icon: Bot, color: 'from-orange-500 to-red-500' },
    { id: 'conversations', label: 'Conversations', icon: MessageCircle, color: 'from-pink-500 to-rose-500' }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-2 shadow-lg glass rounded-2xl w-fit">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden group ${
            activeTab === tab.id 
              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105` 
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          <tab.icon size={18} className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
          <span className="relative z-10">{tab.label}</span>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 w-8 h-1 transform -translate-x-1/2 rounded-full left-1/2 bg-white/30"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default Navigation;