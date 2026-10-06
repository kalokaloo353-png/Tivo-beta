import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, Gift, Award, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { User, Video } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';

interface CreatorFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  videos: Video[];
}

export const CreatorFundModal: React.FC<CreatorFundModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  videos
}) => {
  const [withdrawn, setWithdrawn] = useState(false);
  const [balance, setBalance] = useState(currentUser.creatorEarnings || 385.40);

  if (!isOpen) return null;

  const userVideos = videos.filter(v => v.creator.id === currentUser.id);
  const totalViews = userVideos.reduce((acc, v) => acc + (v.viewsCount || 0), 0) + 142000;
  const estimatedFundPayout = (totalViews * 0.00004).toFixed(2);
  const giftEarnings = (balance - parseFloat(estimatedFundPayout)).toFixed(2);

  const handleWithdraw = () => {
    if (balance <= 0) return;
    audioEngine.playSoundEffect('publish');
    setWithdrawn(true);
    setBalance(0);
    const updated = { ...currentUser, creatorEarnings: 0 };
    storage.saveCurrentUser(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div 
        className="w-full max-w-lg bg-neutral-950 rounded-3xl border border-neutral-800 p-6 shadow-2xl relative space-y-5 overflow-y-auto max-h-[90vh] no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-black">
            $
          </div>
          <div>
            <h3 className="text-base font-black text-white">TIVO Creator Fund & Wallet</h3>
            <p className="text-[11px] text-neutral-400">Monetize views, subscriptions, and virtual gifts</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Available Creator Balance</span>
            <span className="text-[10px] font-bold text-neutral-300 bg-neutral-800 px-2.5 py-0.5 rounded-full">
              Verified Creator
            </span>
          </div>

          <div className="my-3">
            <span className="text-3xl font-black text-white tracking-tight">
              ${balance.toFixed(2)}
            </span>
            <span className="text-xs text-neutral-400 ml-1.5">USD</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-[11px] text-neutral-400">Minimum withdrawal: $10.00</span>
            <button
              onClick={handleWithdraw}
              disabled={balance <= 0 || withdrawn}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{withdrawn ? 'Payout Initiated' : 'Withdraw Funds'}</span>
            </button>
          </div>
        </div>

        {withdrawn && (
          <div className="p-3 bg-neutral-900 border border-white/20 rounded-2xl flex items-center gap-2 text-xs text-white">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>Payout of ${(currentUser.creatorEarnings || 385.40).toFixed(2)} sent to linked account!</span>
          </div>
        )}

        {/* Earnings Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Performance Fund
            </span>
            <span className="text-lg font-black text-white">${estimatedFundPayout}</span>
            <span className="text-[10px] text-neutral-500 block mt-1">Based on {(totalViews / 1000).toFixed(0)}k views</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Virtual Gifts & Subs
            </span>
            <span className="text-lg font-black text-white">${parseFloat(giftEarnings) > 0 ? giftEarnings : '210.00'}</span>
            <span className="text-[10px] text-neutral-500 block mt-1">From live streams & videos</span>
          </div>
        </div>

        {/* How It Works */}
        <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
          <span className="text-xs font-bold text-white block">Creator Monetization Rules</span>
          <div className="text-[11px] text-neutral-400 space-y-1.5 leading-relaxed">
            <p>• <strong>Performance Fund:</strong> Creators earn directly from qualified watch time and views ($0.04 / 1,000 views).</p>
            <p>• <strong>Virtual Gifts:</strong> Coins received in live streams and on videos convert directly to USD (1 Coin = $0.01 payout).</p>
            <p>• <strong>Exclusive Subscriptions:</strong> Receive 85% of monthly subscription fees from your subscribed followers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
