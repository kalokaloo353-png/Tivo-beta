import React, { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Gift, User } from '../types';
import { GiftIcon } from './GiftIcon';

export interface ActiveGiftAnimation {
  id: string;
  sender: User;
  gift: Gift;
  comboCount: number;
}

interface TikTokGiftOverlayProps {
  activeGift: ActiveGiftAnimation | null;
  onComplete: () => void;
}

export const TikTokGiftOverlay: React.FC<TikTokGiftOverlayProps> = ({
  activeGift,
  onComplete
}) => {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (activeGift) {
      setVisible(true);
      setPulse(true);
      const pulseTimeout = setTimeout(() => setPulse(false), 300);

      // Duration set to 3s as requested
      const dismissTimeout = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300);
      }, 3000);

      return () => {
        clearTimeout(pulseTimeout);
        clearTimeout(dismissTimeout);
      };
    } else {
      setVisible(false);
    }
  }, [activeGift, activeGift?.comboCount, onComplete]);

  if (!activeGift || !visible) return null;

  const is100k = activeGift.gift.coins >= 100000 || activeGift.gift.id === 'gift-100k';

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-end pb-28 sm:pb-36 px-4 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Full-screen Shockwave burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className={`rounded-full border border-white/40 animate-ping ${is100k ? 'w-[600px] h-[600px] duration-1000' : 'w-96 h-96'}`} />
        {is100k && (
          <div className="absolute w-[800px] h-[800px] rounded-full bg-white/5 animate-pulse" />
        )}
      </div>

      {/* 100k Supernova Banner announcement */}
      {is100k && (
        <div className="absolute top-20 inset-x-0 mx-auto max-w-sm text-center z-50 animate-in zoom-in duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/90 border border-white/40 backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.6)]">
            <Sparkles className="w-4 h-4 text-white animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase text-white">
              LEGENDARY 100K SUPERNOVA GIFT
            </span>
            <Sparkles className="w-4 h-4 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Main Gift Container */}
      <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
        {/* Sender Pill Banner (smooth slide-in) */}
        <div className="flex items-center gap-3 bg-black/90 backdrop-blur-2xl border border-white/20 pl-2 pr-4 py-2 rounded-full shadow-[0_0_35px_rgba(255,255,255,0.25)] animate-in slide-in-from-left duration-300">
          <div className="relative">
            <img
              src={activeGift.sender.avatar}
              alt={activeGift.sender.displayName}
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow">
              <Check className="w-2.5 h-2.5 stroke-[3] text-white" />
            </span>
          </div>

          <div className="pr-1">
            <h4 className="text-xs font-black text-white leading-tight">
              {activeGift.sender.displayName}
            </h4>
            <p className="text-[11px] text-neutral-300 font-medium">
              Sent <span className="font-black text-white underline decoration-white/40">{activeGift.gift.name}</span>
            </p>
          </div>

          <div className="w-10 h-10 flex items-center justify-center bg-neutral-900/90 rounded-full border border-white/20 shrink-0 shadow-inner">
            <GiftIcon iconKey={activeGift.gift.id} size="sm" />
          </div>
        </div>

        {/* Big Floating 3D Vector Gift + Combo Counter */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div
              className={`absolute rounded-full border border-dashed border-white/40 animate-spin ${is100k ? 'w-32 h-32' : 'w-24 h-24'}`}
              style={{ animationDuration: is100k ? '2.5s' : '4s' }}
            />
            <div className={`transition-transform duration-300 ${pulse ? 'scale-125 rotate-6' : 'scale-100 rotate-0'}`}>
              <GiftIcon
                iconKey={activeGift.gift.id}
                size={is100k ? '2xl' : 'xl'}
                className="filter drop-shadow-[0_0_25px_rgba(255,255,255,0.85)]"
              />
            </div>
          </div>

          {/* Combo Multiplier */}
          <div className="flex flex-col items-center justify-center pl-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 drop-shadow">
              COMBO
            </span>
            <div
              key={activeGift.comboCount}
              className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-neutral-400 drop-shadow-[0_4px_16px_rgba(255,255,255,0.6)] animate-bounce"
            >
              x{activeGift.comboCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
