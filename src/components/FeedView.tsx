import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, Radio, Gift as GiftBoxIcon } from 'lucide-react';
import { Video, User } from '../types';
import { storage } from '../services/storage';
import { VideoCard } from './VideoCard';
import { TivoLogo } from './TivoLogo';
import { TakoMascot } from './TakoMascot';

interface FeedViewProps {
  videos: Video[];
  currentUser: User;
  onToggleLike: (videoId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  onOpenComments: (video: Video) => void;
  onOpenShare: (video: Video) => void;
  onOpenGift: (video: Video) => void;
  onOpenGiftBox: () => void;
  onFollowCreator: (creatorId: string) => void;
  onSelectHashtag: (tag: string) => void;
  onSelectSound: (soundId: string) => void;
  onSelectCreator: (user: User) => void;
  onOpenSearch: () => void;
  onOpenLive: () => void;
  onOpenTako?: (video?: Video) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  targetVideoId?: string | null;
  onClearTargetVideoId?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  videos,
  currentUser,
  onToggleLike,
  onToggleBookmark,
  onOpenComments,
  onOpenShare,
  onOpenGift,
  onOpenGiftBox,
  onFollowCreator,
  onSelectHashtag,
  onSelectSound,
  onSelectCreator,
  onOpenSearch,
  onOpenLive,
  onOpenTako,
  isMuted,
  onToggleMute,
  targetVideoId,
  onClearTargetVideoId
}) => {
  const [feedType, setFeedType] = useState<'foryou' | 'following'>('foryou');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayVideos = feedType === 'following'
    ? videos.filter(v => v.creator.isFollowing)
    : videos;

  useEffect(() => {
    if (displayVideos[currentIndex]) {
      storage.incrementViewCount(displayVideos[currentIndex].id);
    }
  }, [currentIndex, displayVideos]);

  useEffect(() => {
    if (targetVideoId && displayVideos.length > 0) {
      const idx = displayVideos.findIndex(v => v.id === targetVideoId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        scrollToIndex(idx);
      }
      if (onClearTargetVideoId) onClearTargetVideoId();
    }
  }, [targetVideoId, displayVideos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, displayVideos.length]);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const targetEl = containerRef.current.children[index] as HTMLElement;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNextVideo = () => {
    if (currentIndex < displayVideos.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollToIndex(next);
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      scrollToIndex(prev);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    if (itemHeight <= 0) return;
    const newIdx = Math.round(scrollTop / itemHeight);
    if (newIdx !== currentIndex && newIdx >= 0 && newIdx < displayVideos.length) {
      setCurrentIndex(newIdx);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Top Floating Feed Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/85 via-black/30 to-transparent">
        {/* TIVO Brand Emblem */}
        <TivoLogo size="sm" />

        {/* Following vs For You Tab Switcher */}
        <div className="flex items-center gap-4 text-sm font-black tracking-wide">
          <button
            onClick={() => {
              setFeedType('following');
              setCurrentIndex(0);
            }}
            className={`transition relative py-1 ${
              feedType === 'following'
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span>Following</span>
            {feedType === 'following' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
            )}
          </button>

          <span className="text-neutral-700 text-xs">|</span>

          <button
            onClick={() => {
              setFeedType('foryou');
              setCurrentIndex(0);
            }}
            className={`transition relative py-1 ${
              feedType === 'foryou'
                ? 'text-white'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span>For You</span>
            {feedType === 'foryou' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Right Actions: Gift Box (+100k), Tako AI & Search Button */}
        <div className="flex items-center gap-2">
          {!currentUser.hasClaimed100kGift && (
            <button
              onClick={onOpenGiftBox}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-black hover:bg-neutral-200 text-[11px] font-black transition shadow-md"
              title="Claim 100k Coins Gift Box"
            >
              <GiftBoxIcon className="w-3.5 h-3.5 text-black" />
              <span>+100k</span>
            </button>
          )}

          {/* Quick Tako AI Assistant Trigger */}
          <button
            onClick={() => onOpenTako && onOpenTako(displayVideos[currentIndex])}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-950/80 border border-sky-400/40 text-cyan-300 hover:border-cyan-300 transition shadow-[0_0_10px_rgba(14,165,233,0.3)] active:scale-95"
            title="Ask Tako AI Assistant"
          >
            <TakoMascot size="xs" />
            <span className="text-[10px] font-black tracking-tight">Tako</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:border-white transition"
            aria-label="Discover and search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertical Video Scroll Container */}
      {displayVideos.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
          <p className="text-sm font-bold text-white mb-1">
            {feedType === 'following' ? 'No clips from followed creators yet' : 'No videos available'}
          </p>
          <p className="text-xs text-neutral-400 max-w-xs mb-4">
            Follow more creators in Discover to see their latest clips here!
          </p>
          <button
            onClick={() => setFeedType('foryou')}
            className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold"
          >
            Explore For You Feed
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y-mandatory no-scrollbar"
        >
          {displayVideos.map((video, idx) => (
            <div key={video.id} className="w-full h-full snap-start relative">
              <VideoCard
                video={video}
                isActive={idx === currentIndex}
                currentUser={currentUser}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onOpenGift={onOpenGift}
                onFollowCreator={onFollowCreator}
                onSelectHashtag={onSelectHashtag}
                onSelectSound={onSelectSound}
                onSelectCreator={onSelectCreator}
                onOpenTako={onOpenTako}
                isMuted={isMuted}
                onToggleMute={onToggleMute}
              />
            </div>
          ))}
        </div>
      )}

      {/* Desktop Up/Down Navigation Arrows */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-2 z-30">
        <button
          onClick={handlePrevVideo}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-20 hover:border-white transition"
          aria-label="Previous video"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <button
          onClick={handleNextVideo}
          disabled={currentIndex >= displayVideos.length - 1}
          className="w-10 h-10 rounded-full bg-black/60 border border-neutral-800 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-20 hover:border-white transition"
          aria-label="Next video"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
