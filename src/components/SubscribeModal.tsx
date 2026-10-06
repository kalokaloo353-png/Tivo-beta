import React, { useState } from 'react';
import { X, Star, Check, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: User;
  onSubscribed: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  creator,
  onSubscribed
}) => {
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    storage.subscribeToCreator(creator.id);
    audioEngine.playSoundEffect('publish');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onSubscribed();
      onClose();
    }, 1500);
  };

  const perks = [
    'Unlock all exclusive subscriber-only videos & tutorials',
    'Exclusive Subscriber badge next to your username',
    'Priority direct messaging with creator',
    'Custom subscriber emoji in Live Stream chat'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div 
        className="w-full max-w-sm bg-neutral-950 rounded-3xl border border-neutral-800 p-6 shadow-2xl relative space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-white">You are now a Subscriber!</h3>
            <p className="text-xs text-neutral-400">
              Exclusive videos and creator perks are now unlocked for @{creator.username}.
            </p>
          </div>
        ) : (
          <>
            <div className="relative inline-block mx-auto mb-1">
              <img
                src={creator.avatar}
                alt={creator.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-white mx-auto shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-1 shadow">
                <Star className="w-3.5 h-3.5 fill-black" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-white">Subscribe to @{creator.username}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Support original creative work</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Subscriber Benefits
              </span>
              {perks.map((perk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-neutral-200">
                  <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSubscribe}
                className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-xl"
              >
                Subscribe for ${creator.subscriptionPrice || 4.99} / month
              </button>
              <span className="text-[10px] text-neutral-500 block mt-2">
                Cancel anytime in your settings. 85% goes directly to the creator.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
