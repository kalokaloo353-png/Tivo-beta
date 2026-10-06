import React from 'react';
import { X, Sparkles, Coins, Gift as GiftIcon } from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface WelcomeRewardModalProps {
  isOpen: boolean;
  onClaim: () => void;
  onClose: () => void;
}

export const WelcomeRewardModal: React.FC<WelcomeRewardModalProps> = ({
  isOpen,
  onClaim,
  onClose
}) => {
  if (!isOpen) return null;

  const handleClaim = () => {
    audioEngine.playSoundEffect('publish');
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gift Box Icon */}
        <div className="w-16 h-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto shadow-xl animate-bounce">
          <GiftIcon className="w-8 h-8 text-black stroke-[2.5]" />
        </div>

        {/* Welcome Message requested by user */}
        <div className="space-y-2">
          <h3 className="text-base font-black text-white">
            Welcome to TIVO!
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed font-medium bg-neutral-900 border border-neutral-800 p-4 rounded-2xl text-left">
            "Hi, thank you for trying! Here is a reward: free coins! This is a demo and the videos here are fake. If you want to make this real, please support this cause as I am a young developer."
          </p>
        </div>

        {/* Reward Box */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-white" />
            <div className="text-left">
              <span className="text-xs font-black text-white block">+5,000 Coins</span>
              <span className="text-[10px] text-neutral-400">Starter Creator Reward</span>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-300">FREE</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-xl active:scale-95"
          >
            Claim Free Coins & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
