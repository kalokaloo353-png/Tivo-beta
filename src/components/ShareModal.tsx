import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, Globe, Twitter, Share2 } from 'lucide-react';
import { Video, User } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';

interface ShareModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSendMessageWithVideo: (recipient: User, video: Video) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  video,
  isOpen,
  onClose,
  currentUser,
  onSendMessageWithVideo
}) => {
  const [copied, setCopied] = useState(false);
  const users = storage.getUsers().filter(u => u.id !== currentUser.id);

  if (!isOpen) return null;

  const videoUrl = window.location.origin + '?v=' + video.id;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    audioEngine.playSoundEffect('pop');
    storage.incrementShareCount(video.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDM = (user: User) => {
    onSendMessageWithVideo(user, video);
    storage.incrementShareCount(video.id);
    audioEngine.playSoundEffect('publish');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div 
        className="w-full sm:max-w-md bg-neutral-950 sm:rounded-3xl rounded-t-3xl border border-neutral-800 p-5 shadow-2xl flex flex-col space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm text-white">Share Video</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share directly via TIVO DM */}
        <div>
          <span className="text-xs font-semibold text-neutral-400 block mb-2">Send in TIVO Chat</span>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSendDM(user)}
                className="flex flex-col items-center gap-1 min-w-[62px] group"
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-neutral-700 group-hover:border-white transition"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-black">
                    <Send className="w-3 h-3" />
                  </div>
                </div>
                <span className="text-[11px] text-neutral-300 truncate max-w-[60px] text-center font-medium">
                  {user.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link & Socials */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white transition"
          >
            {copied ? (
              <Check className="w-5 h-5 text-white mb-1" />
            ) : (
              <Copy className="w-5 h-5 text-white mb-1" />
            )}
            <span className="text-[11px] text-white font-bold">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watch on TIVO: ${video.caption}`)}&url=${encodeURIComponent(videoUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => storage.incrementShareCount(video.id)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white transition"
          >
            <Twitter className="w-5 h-5 text-white mb-1" />
            <span className="text-[11px] text-white font-bold">X / Post</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Watch on TIVO: ${video.caption} ${videoUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => storage.incrementShareCount(video.id)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white transition"
          >
            <MessageSquare className="w-5 h-5 text-white mb-1" />
            <span className="text-[11px] text-white font-bold">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
