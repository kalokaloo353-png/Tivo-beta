import React, { useState } from 'react';
import { X, Sparkles, Gift as GiftIcon, Coins } from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface GiftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardCoins: (amount: number) => void;
}

export const GiftBoxModal: React.FC<GiftBoxModalProps> = ({
  isOpen,
  onClose,
  onAwardCoins
}) => {
  const [opened, setOpened] = useState(false);

  if (!isOpen) return null;

  const handleOpenBox = () => {
    audioEngine.playSoundEffect('publish');
    setOpened(true);
    onAwardCoins(100000);
    setTimeout(() => {
      setOpened(false);
      onClose();
    }, 2200);
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

        {opened ? (
          <div className="py-6 space-y-3 animate-in zoom-in-75 duration-300 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-bounce">
              <Coins className="w-10 h-10 text-black stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black text-white">+100,000 COINS!</h3>
            <p className="text-xs text-neutral-300 font-medium">
              Awesome! 100,000 coins have been credited to your TIVO balance! Send virtual gifts or support creators.
            </p>
          </div>
        ) : (
          <>
            <div 
              className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto shadow-2xl animate-pulse cursor-pointer hover:border-white transition"
              onClick={handleOpenBox}
            >
              <GiftIcon className="w-10 h-10 text-white stroke-[2]" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Mystery Gift Box</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Tap to unbox your developer test reward!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                  Contained Reward
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  100,000 TIVO Coins
                </span>
              </div>
              <Coins className="w-7 h-7 text-white" />
            </div>

            <button
              onClick={handleOpenBox}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-2xl active:scale-95"
            >
              Open Gift Box (+100k Coins)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
