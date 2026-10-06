import React from 'react';
import { Home, Compass, Plus, Radio, User as UserIcon, MessageSquare } from 'lucide-react';
import { ActiveTab, User } from '../types';
import { audioEngine } from '../services/audioService';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: User;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  unreadCount = 0
}) => {
  const handleTabClick = (tab: ActiveTab) => {
    audioEngine.playSoundEffect('tap');
    onTabChange(tab);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-lg border-t border-neutral-900 px-3 py-2 flex items-center justify-around select-none">
      {/* Home Tab */}
      <button
        onClick={() => handleTabClick('feed')}
        className={`flex flex-col items-center gap-1 min-w-[48px] transition ${
          activeTab === 'feed'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'feed' ? 'stroke-[2.5] text-white' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] tracking-tight ${activeTab === 'feed' ? 'font-black text-white' : 'font-medium'}`}>
          Home
        </span>
      </button>

      {/* Discover Tab */}
      <button
        onClick={() => handleTabClick('discover')}
        className={`flex flex-col items-center gap-1 min-w-[48px] transition ${
          activeTab === 'discover'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5] text-white' : 'stroke-[1.8]'}`} />
        <span className={`text-[10px] tracking-tight ${activeTab === 'discover' ? 'font-black text-white' : 'font-medium'}`}>
          Discover
        </span>
      </button>

      {/* Create Button (+) */}
      <button
        onClick={() => handleTabClick('create')}
        className="relative group px-1 flex items-center justify-center -top-1"
        aria-label="Create new video"
      >
        <div className="relative w-11 h-8 rounded-xl bg-white p-[2px] shadow-lg hover:scale-105 active:scale-95 transition-transform">
          <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
            <Plus className="w-4 h-4 text-white stroke-[3]" />
          </div>
        </div>
      </button>

      {/* Inbox Tab */}
      <button
        onClick={() => handleTabClick('inbox')}
        className={`flex flex-col items-center gap-1 min-w-[48px] relative transition ${
          activeTab === 'inbox'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 ${activeTab === 'inbox' ? 'stroke-[2.5] text-white' : 'stroke-[1.8]'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
          )}
        </div>
        <span className={`text-[10px] tracking-tight ${activeTab === 'inbox' ? 'font-black text-white' : 'font-medium'}`}>
          Inbox
        </span>
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => handleTabClick('profile')}
        className={`flex flex-col items-center gap-1 min-w-[48px] transition ${
          activeTab === 'profile'
            ? 'text-white'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <div className="relative">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className={`w-5 h-5 rounded-full object-cover border ${
                activeTab === 'profile' ? 'border-white ring-1 ring-white/50' : 'border-neutral-700'
              }`}
            />
          ) : (
            <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5] text-white' : 'stroke-[1.8]'}`} />
          )}
        </div>
        <span className={`text-[10px] tracking-tight ${activeTab === 'profile' ? 'font-black text-white' : 'font-medium'}`}>
          Profile
        </span>
      </button>
    </div>
  );
};
