import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Send, MessageCircle, Flame, Sparkles, Zap, Star, ThumbsUp, 
  MessageSquare, Gift as GiftBoxIcon, Coins, ChevronDown, Check 
} from 'lucide-react';
import { Comment, User, Gift } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { GiftIcon } from './GiftIcon';
import { VerifiedBadge } from './VerifiedBadge';

interface CommentModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCommentAdded?: () => void;
  onUpdateCurrentUser?: (user: User) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  videoId,
  isOpen,
  onClose,
  currentUser,
  onCommentAdded,
  onUpdateCurrentUser
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [coins, setCoins] = useState(currentUser.coins);

  const availableGifts = storage.getGiftsCatalog(currentUser.id);

  const quickReactions = [
    { label: 'Fire', text: 'Fire clip! 🔥', icon: Flame },
    { label: 'Love', text: 'Love this aesthetic! ❤️', icon: Heart },
    { label: 'Clean', text: 'Super clean edit! ✨', icon: Sparkles },
    { label: 'Insane', text: 'Insane skills! ⚡', icon: Zap },
    { label: 'Perfection', text: 'Perfection! 🌟', icon: Star },
    { label: 'Great', text: 'Great work! 👍', icon: ThumbsUp }
  ];

  useEffect(() => {
    if (isOpen) {
      setComments(storage.getComments(videoId));
      setCoins(storage.getCurrentUser().coins);
      setShowGiftDrawer(false);
      setGiftError(null);
    }
  }, [videoId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    audioEngine.playSoundEffect('pop');
    const newComment = storage.addComment(videoId, inputText.trim());
    setComments(storage.getComments(videoId));
    setInputText('');
    if (onCommentAdded) onCommentAdded();
  };

  const handleSendGiftInComment = (gift: Gift) => {
    setGiftError(null);
    const current = storage.getCurrentUser();
    if (current.coins < gift.coins) {
      setGiftError(`Insufficient coins! Need ${gift.coins} Coins (you have ${current.coins}).`);
      audioEngine.playSoundEffect('beep');
      return;
    }

    // Add gift comment (No full screen animation triggered!)
    const result = storage.addGiftComment(videoId, gift, inputText.trim() || undefined);
    if (!result.success) {
      setGiftError(result.error || 'Failed to send gift');
      return;
    }

    const updatedUser = storage.getCurrentUser();
    setCoins(updatedUser.coins);
    if (onUpdateCurrentUser) onUpdateCurrentUser(updatedUser);

    setComments(storage.getComments(videoId));
    setInputText('');
    setShowGiftDrawer(false);
    audioEngine.playSoundEffect('publish');
    if (onCommentAdded) onCommentAdded();
  };

  const handleLikeComment = (commentId: string) => {
    audioEngine.playSoundEffect('like');
    storage.toggleLikeComment(commentId);
    setComments(storage.getComments(videoId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 select-none">
      <div 
        className="w-full sm:max-w-md bg-neutral-950 sm:rounded-3xl rounded-t-3xl border border-neutral-800 shadow-2xl flex flex-col h-[80vh] sm:h-[680px] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-white" />
            <h3 className="font-black text-sm text-white">
              Comments <span className="text-neutral-500 font-normal ml-1">({comments.length.toLocaleString()})</span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-white">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-neutral-600 stroke-[1.5]" />
              <p className="text-xs font-semibold text-neutral-400">No comments yet</p>
              <p className="text-[11px] text-neutral-600">Be the first to share your thoughts or send a gift in the comments!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isGiftComment = !!comment.gift;
              return (
                <div 
                  key={comment.id} 
                  className={`flex items-start gap-3 p-2.5 rounded-2xl transition ${
                    isGiftComment 
                      ? 'bg-gradient-to-r from-pink-950/30 via-neutral-900/80 to-purple-950/30 border border-pink-500/30 shadow-md' 
                      : 'hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.username}
                      className={`w-8 h-8 rounded-full object-cover border ${isGiftComment ? 'border-pink-500' : 'border-neutral-700'}`}
                    />
                    <VerifiedBadge 
                      followersCount={comment.user.followersCount} 
                      verified={comment.user.verified}
                      size="xs"
                      className="absolute -bottom-1 -right-1"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">@{comment.user.username}</span>
                      <VerifiedBadge 
                        followersCount={comment.user.followersCount} 
                        verified={comment.user.verified}
                        size="xs"
                      />
                      {isGiftComment && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[9px] font-black uppercase border border-pink-500/40">
                          <GiftBoxIcon className="w-2.5 h-2.5" />
                          Gifter
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-500">· {comment.createdAt}</span>
                    </div>

                    {/* GIFT CARD IN COMMENT */}
                    {comment.gift ? (
                      <div className="mt-2 p-2.5 rounded-xl bg-neutral-900/90 border border-pink-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-pink-500/30 flex items-center justify-center p-1 shadow-inner shrink-0">
                            <GiftIcon iconKey={comment.gift.id} size="sm" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-white block leading-tight">
                              Sent {comment.gift.name}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {comment.gift.coins.toLocaleString()} Coins
                            </span>
                          </div>
                        </div>
                        {comment.text && comment.text !== `Sent ${comment.gift.name} (${comment.gift.coins} Coins)` && (
                          <p className="text-[11px] text-neutral-200 italic pr-1">
                            "{comment.text}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed break-words">
                        {comment.text}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white p-1 shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 transition ${comment.isLiked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
                    />
                    <span className="text-[10px] text-neutral-500">{comment.likesCount.toLocaleString()}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Reaction Chips */}
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/60 border-t border-neutral-800 overflow-x-auto no-scrollbar">
          {quickReactions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setInputText((prev) => prev + item.text)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition-all shrink-0 active:scale-95"
              >
                <Icon className="w-3.5 h-3.5 text-white" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* IN-COMMENT GIFT DRAWER TRAY */}
        {showGiftDrawer && (
          <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 space-y-2.5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GiftBoxIcon className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Gift in Comment (Appears in Comments List)
                </span>
              </div>
              <button
                onClick={() => setShowGiftDrawer(false)}
                className="text-neutral-400 hover:text-white p-1 text-xs"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {giftError && (
              <p className="text-[11px] text-red-400 font-medium">{giftError}</p>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto no-scrollbar py-1">
              {availableGifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGiftInComment(gift)}
                  className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-pink-500 hover:bg-pink-950/20 flex flex-col items-center text-center transition group active:scale-95 shadow-sm"
                >
                  <GiftIcon iconKey={gift.id} size="sm" className="group-hover:scale-110 transition" />
                  <span className="text-[10px] font-bold text-white mt-1 truncate max-w-full">
                    {gift.name}
                  </span>
                  <span className="text-[9px] text-amber-400 font-black flex items-center gap-0.5">
                    <Coins className="w-2.5 h-2.5" />
                    {gift.coins.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form with Gift Box Button */}
        <form onSubmit={handleSubmit} className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
          {/* Virtual Gift Button inside Comment Input */}
          <button
            type="button"
            onClick={() => {
              setShowGiftDrawer(!showGiftDrawer);
              audioEngine.playSoundEffect('tap');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-md shrink-0 active:scale-90 ${
              showGiftDrawer 
                ? 'bg-white text-black ring-2 ring-pink-500' 
                : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white hover:scale-105'
            }`}
            title="Send Gift in Comment (No video animation)"
          >
            <GiftBoxIcon className="w-4 h-4 text-white drop-shadow" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={showGiftDrawer ? "Add an optional gift message..." : "Add a comment..."}
            className="flex-1 bg-neutral-800 text-white placeholder-neutral-500 text-xs rounded-full px-4 py-2.5 focus:outline-none focus:border-white border border-neutral-700"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-white disabled:bg-neutral-800 text-black rounded-full transition active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
