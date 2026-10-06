import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Coins, Gift as GiftBoxIcon, AlertCircle, LogIn, Clock } from 'lucide-react';
import { Gift, User } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { GiftIcon } from './GiftIcon';

interface GiftSheetProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  currentUser: User;
  onGiftSent: (gift: Gift) => void;
  onOpenSignIn?: () => void;
  videoId?: string;
}

export const GiftSheet: React.FC<GiftSheetProps> = ({
  isOpen,
  onClose,
  creator,
  currentUser,
  onGiftSent,
  onOpenSignIn,
  videoId
}) => {
  // Retrieve available gifts for this user (100k gift permanently removed if already sent)
  const availableGifts = storage.getGiftsCatalog(currentUser.id);
  const [selectedGift, setSelectedGift] = useState<Gift>(availableGifts[0] || null);
  const [coins, setCoins] = useState(currentUser.coins);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);

  // Free 5-day promotional period calculation
  const getTopupStartTime = () => {
    return storage.getTopupStartTime();
  };

  const startTime = getTopupStartTime();
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - startTime >= FIVE_DAYS_MS;
  const remainingMs = Math.max(0, FIVE_DAYS_MS - (Date.now() - startTime));
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  useEffect(() => {
    const gifts = storage.getGiftsCatalog(currentUser.id);
    if (!selectedGift || !gifts.some((g) => g.id === selectedGift.id)) {
      setSelectedGift(gifts[0] || null);
    }
  }, [currentUser.id, currentUser.hasSent100kGift]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!selectedGift) return;
    setErrorMsg(null);
    const res = storage.sendGift(selectedGift, creator.id, videoId);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send gift');
      return;
    }

    setCoins(res.newCoins);
    audioEngine.playSoundEffect('publish');
    onGiftSent(selectedGift);
  };

  const handleAddCoins = (amount: number) => {
    if (isExpired) return;
    const updated = storage.addCoinsToUser(amount);
    setCoins(updated);
    audioEngine.playSoundEffect('pop');
    setShowTopUp(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none">
      <div 
        className="w-full sm:max-w-md bg-neutral-950 sm:rounded-3xl rounded-t-3xl border border-neutral-800 p-5 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 p-1 flex items-center justify-center shadow-lg">
              <GiftBoxIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Send Gift to @{creator.username}</h3>
              <p className="text-[10px] text-neutral-400">Support creator and trigger live TikTok animation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sign In Popup / Header Bar (Only if not already signed in) */}
        {onOpenSignIn && !storage.hasUserLoggedIn() && (
          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-7 h-7 rounded-full object-cover border border-neutral-700"
              />
              <div>
                <span className="text-xs font-bold text-white block">@{currentUser.username}</span>
                <span className="text-[10px] text-neutral-400">Sign in to sync your account</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSignIn();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-[11px] font-black transition shadow-sm active:scale-95"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* User Coins Balance Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-white" />
            <div>
              <span className="text-xs font-bold text-white">{coins.toLocaleString()} Coins</span>
              <span className="text-[10px] text-neutral-400 block">Available in your wallet</span>
            </div>
          </div>
          <button
            onClick={() => {
              setShowTopUp(true);
              audioEngine.playSoundEffect('tap');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Top Up</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-center text-xs text-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Gifts Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 py-1">
          {availableGifts.map((g) => {
            const isSelected = selectedGift?.id === g.id;
            const is100k = g.coins >= 100000;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGift(g);
                  setErrorMsg(null);
                  audioEngine.playSoundEffect('tap');
                }}
                className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'border-white bg-white/10 scale-105 shadow-lg shadow-white/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800'
                } ${is100k ? 'ring-1 ring-white/30' : ''}`}
              >
                {is100k && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-white text-black text-[8px] font-black uppercase tracking-wider shadow">
                    1-TIME ONLY
                  </span>
                )}
                <GiftIcon iconKey={g.id} size="md" className="mb-1.5" />
                <span className="text-[11px] font-bold text-neutral-200 text-center line-clamp-1">{g.name}</span>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5">{g.coins.toLocaleString()} Coins</span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSend}
            disabled={!selectedGift}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>Send {selectedGift?.name || 'Gift'}</span>
            <span>({selectedGift?.coins.toLocaleString() || 0} Coins)</span>
          </button>
        </div>

        {/* Top Up Modal Subview */}
        {showTopUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-white" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Up Coins</h4>
                </div>
                <button
                  onClick={() => setShowTopUp(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Special 5-day Free Notice Popup */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-black uppercase tracking-wider">Special Notice</span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed font-semibold bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                  "Hi, this topup is free for 5d that will not be available again."
                </p>
                <div className="text-[10px] text-neutral-400 font-mono pt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {isExpired ? (
                    <span className="text-red-400 font-bold block">
                      5-day period ended. Prices are now unavailable.
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium block">
                      Free offer active · {remainingDays}d {remainingHours}h remaining
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { amount: 1000 },
                  { amount: 10000 },
                  { amount: 50000 },
                  { amount: 100000 },
                ].map((tier) => (
                  <button
                    key={tier.amount}
                    disabled={isExpired}
                    onClick={() => handleAddCoins(tier.amount)}
                    className="w-full p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white disabled:opacity-40 disabled:hover:border-neutral-800 flex items-center justify-between transition active:scale-95"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">+{tier.amount.toLocaleString()} Coins</span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-md ${isExpired ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black'}`}>
                      {isExpired ? 'Unavailable' : 'FREE'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
