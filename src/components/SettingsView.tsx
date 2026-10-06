import React, { useState } from 'react';
import { 
  ArrowLeft, Lock, Shield, UserX, LogOut, 
  Check, Coins, Key, ChevronRight 
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { TiviPanelModal } from './TiviPanelModal';

interface SettingsViewProps {
  currentUser: User;
  onBack: () => void;
  onLogout: () => void;
  onUpdateCurrentUser: (user: User) => void;
  onToast?: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onBack,
  onLogout,
  onUpdateCurrentUser,
  onToast
}) => {
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  const [pushLikes, setPushLikes] = useState(true);
  const [pushComments, setPushComments] = useState(true);
  const [pushGifts, setPushGifts] = useState(true);
  const [showTiviPanel, setShowTiviPanel] = useState(false);

  return (
    <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md px-4 py-3.5 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-black text-white">Settings & Privacy</h2>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* WALLET SETTINGS (Earnings removed) */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Coins & Balance
          </span>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl divide-y divide-neutral-800/80">
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">TIVO Coins Balance</span>
                <span className="text-[11px] text-neutral-400">
                  {currentUser.coins.toLocaleString()} Coins available for virtual gifts
                </span>
              </div>
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-white" />
                <span>{currentUser.coins.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* TIVI ADMIN / CREATOR PANEL */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Developer & Creator Console
          </span>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => {
                setShowTiviPanel(true);
                audioEngine.playSoundEffect('tap');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/60 transition group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-md group-hover:scale-105 transition">
                  <Shield className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white block">Tivi Panel</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                      Secret Console
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Administrator console for managing creator coins & followers
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition" />
            </button>
          </div>
        </div>

        {/* PRIVACY CONTROLS */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Privacy & Security
          </span>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl divide-y divide-neutral-800/80">
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Private Account</span>
                <span className="text-[11px] text-neutral-400">
                  Only approved followers can view your clips
                </span>
              </div>
              <button
                onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  isPrivateAccount ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    isPrivateAccount ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Direct Messages</span>
                <span className="text-[11px] text-neutral-400">
                  Allow messages from other community members
                </span>
              </div>
              <button
                onClick={() => setAllowDirectMessages(!allowDirectMessages)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  allowDirectMessages ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    allowDirectMessages ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Notification Preferences
          </span>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl divide-y divide-neutral-800/80">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-xs text-neutral-200">Likes and comments</span>
              <button
                onClick={() => setPushLikes(!pushLikes)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  pushLikes ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    pushLikes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-xs text-neutral-200">Gifts & Subscriptions</span>
              <button
                onClick={() => setPushGifts(!pushGifts)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  pushGifts ? 'bg-white' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    pushGifts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of TIVO</span>
          </button>
        </div>
      </div>

      {/* TIVI MANAGEMENT PANEL MODAL */}
      <TiviPanelModal
        isOpen={showTiviPanel}
        onClose={() => setShowTiviPanel(false)}
        currentUser={currentUser}
        onUpdateCurrentUser={onUpdateCurrentUser}
        onToast={onToast}
      />
    </div>
  );
};
