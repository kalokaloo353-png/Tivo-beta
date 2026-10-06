import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, MessageCircle, Bookmark, Share2, Music, Play, Pause, 
  Volume2, VolumeX, Check, Plus, AlertCircle, Gift, Lock, Star 
} from 'lucide-react';
import { Video, User } from '../types';
import { audioEngine } from '../services/audioService';
import { VerifiedBadge } from './VerifiedBadge';
import { TakoMascot } from './TakoMascot';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  currentUser: User;
  onToggleLike: (videoId: string) => void;
  onToggleBookmark: (videoId: string) => void;
  onOpenComments: (video: Video) => void;
  onOpenShare: (video: Video) => void;
  onOpenGift: (video: Video) => void;
  onFollowCreator: (creatorId: string) => void;
  onSelectHashtag: (tag: string) => void;
  onSelectSound: (soundId: string) => void;
  onSelectCreator: (user: User) => void;
  onOpenTako?: (video: Video) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isActive,
  currentUser,
  onToggleLike,
  onToggleBookmark,
  onOpenComments,
  onOpenShare,
  onOpenGift,
  onFollowCreator,
  onSelectHashtag,
  onSelectSound,
  onSelectCreator,
  onOpenTako,
  isMuted,
  onToggleMute
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const [videoError, setVideoError] = useState(false);

  // Double tap detection
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setVideoError(false);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  };

  const handleVideoTouchOrClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createHeartBurst(x, y);
      if (!video.isLiked) {
        onToggleLike(video.id);
      }
      audioEngine.playSoundEffect('like');
    } else {
      handleTogglePlay(e);
    }
    lastTapRef.current = now;
  };

  const createHeartBurst = (x: number, y: number) => {
    const newParticles: HeartParticle[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        angle: (i * 360) / count + (Math.random() * 20 - 10),
        scale: 0.9 + Math.random() * 0.5
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 1);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = percentage * (videoRef.current.duration || 1);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none">
      <div 
        className="relative w-full h-full max-w-[480px] flex items-center justify-center cursor-pointer"
        onClick={handleVideoTouchOrClick}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          loop
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Fallback auto-recovery on error without annoying blocking banner */}
        {videoError && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Gradients */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

        {/* Play/Pause Pulse */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white scale-125 transition-transform animate-ping">
              {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
            </div>
          </div>
        )}

        {/* Monochrome Burst Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              transform: `translate(-50%, -50%) rotate(${p.angle}deg) scale(${p.scale})`,
            }}
            className="absolute pointer-events-none z-40 animate-out fade-out zoom-out duration-700"
          >
            <Heart className="w-12 h-12 text-white fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          </div>
        ))}

        {/* Top Right Sound Toggle */}
        <div className="absolute top-16 right-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition shadow-lg"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Right Interaction Sidebar */}
        <div 
          className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Creator Avatar & Follow Button */}
          <div className="relative mb-1">
            <button
              onClick={() => onSelectCreator(video.creator)}
              className="w-12 h-12 rounded-full p-0.5 bg-white block shadow-lg group"
            >
              <img
                src={video.creator.avatar}
                alt={video.creator.username}
                className="w-full h-full rounded-full object-cover border border-black"
              />
            </button>
            {currentUser.id !== video.creator.id && !video.creator.isFollowing && (
              <button
                onClick={() => onFollowCreator(video.creator.id)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-black shadow-md transition"
                title="Follow creator"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={() => onToggleLike(video.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-75 ${
                video.isLiked
                  ? 'bg-white text-black scale-110'
                  : 'bg-black/50 backdrop-blur-md text-white hover:bg-black/70'
              }`}
            >
              <Heart
                className={`w-6 h-6 transition ${
                  video.isLiked ? 'fill-black text-black' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
              {video.likesCount.toLocaleString()}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => onOpenComments(video)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-75 hover:bg-black/70">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
              {video.commentsCount.toLocaleString()}
            </span>
          </button>

          {/* Tako AI Assistant Button (TikTok-Style Mascot) */}
          <button
            onClick={() => onOpenTako && onOpenTako(video)}
            className="flex flex-col items-center gap-1 group relative"
            title="Ask Tako AI Assistant"
          >
            <div className="w-11 h-11 rounded-full bg-neutral-950/80 border border-sky-400/50 backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 active:scale-75 shadow-[0_0_12px_rgba(14,165,233,0.5)]">
              <TakoMascot size="xs" />
            </div>
            <span className="text-[10px] font-black text-cyan-300 tracking-tight drop-shadow">
              Tako
            </span>
          </button>

          {/* Virtual Gift Button */}
          <button
            onClick={() => onOpenGift(video)}
            className="flex flex-col items-center gap-1 group"
            title="Send virtual gift"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] hover:shadow-[0_0_25px_rgba(244,63,94,0.9)] flex items-center justify-center transition-all active:scale-75 hover:scale-110">
              <Gift className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            <span className="text-[10px] font-bold text-white tracking-tight drop-shadow">
              Gift
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(video.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-75 ${
                video.isBookmarked
                  ? 'bg-white text-black scale-110'
                  : 'bg-black/50 backdrop-blur-md text-white hover:bg-black/70'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 transition ${
                  video.isBookmarked ? 'fill-black text-black' : ''
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
              {video.bookmarksCount.toLocaleString()}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => onOpenShare(video)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-75 hover:bg-black/70">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
              {video.sharesCount.toLocaleString()}
            </span>
          </button>

          {/* Spinning Vinyl Record Sound Disc */}
          <div className="relative mt-1">
            {isPlaying && (
              <>
                <span className="absolute -top-3 left-1 text-white text-xs animate-float-note pointer-events-none">
                  ♫
                </span>
                <span
                  style={{ animationDelay: '1.2s' }}
                  className="absolute -top-4 right-1 text-neutral-300 text-[10px] animate-float-note pointer-events-none"
                >
                  ♪
                </span>
              </>
            )}

            <button
              onClick={() => onSelectSound(video.musicTrack.id)}
              className={`w-11 h-11 rounded-full p-1.5 bg-neutral-950 border border-white/30 shadow-xl flex items-center justify-center ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              title={`Sound: ${video.musicTrack.title}`}
            >
              <img
                src={video.musicTrack.coverUrl}
                alt={video.musicTrack.title}
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-white border border-black" />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Left Info Overlay */}
        <div 
          className="absolute left-4 right-20 bottom-8 z-20 text-left pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Creator Tag & Verified Status */}
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => onSelectCreator(video.creator)}
              className="flex items-center gap-1.5 hover:opacity-90 transition group"
            >
              <span className="font-extrabold text-sm text-white group-hover:underline">
                @{video.creator.username}
              </span>
              <VerifiedBadge 
                followersCount={video.creator.followersCount} 
                verified={video.creator.verified}
                size="sm"
              />
            </button>
          </div>

          {/* Caption & Hashtags */}
          <div className="text-xs text-neutral-200 leading-relaxed mb-3">
            <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>
              {video.caption.split(' ').map((word, i) => {
                if (word.startsWith('#')) {
                  const tag = word.replace('#', '');
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectHashtag(tag)}
                      className="font-bold text-white hover:underline mr-1 inline-block"
                    >
                      {word}
                    </button>
                  );
                }
                return word + ' ';
              })}
            </p>
            {video.caption.length > 80 && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white mt-0.5 inline-block"
              >
                {isCaptionExpanded ? 'Less' : '...more'}
              </button>
            )}
          </div>

          {/* Music Track Marquee */}
          <button
            onClick={() => onSelectSound(video.musicTrack.id)}
            className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 max-w-[240px] hover:border-white/40 transition group"
          >
            <Music className="w-3.5 h-3.5 text-white shrink-0 group-hover:scale-110 transition-transform" />
            <div className="overflow-hidden whitespace-nowrap text-[11px] text-neutral-300 font-medium">
              <span className="inline-block animate-marquee group-hover:[animation-play-state:paused]">
                {video.musicTrack.title} · {video.musicTrack.artist}
              </span>
            </div>
          </button>
        </div>

        {/* Scrubber Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="absolute bottom-0 inset-x-0 h-1 bg-white/20 hover:h-2 cursor-pointer transition-all z-30 group"
        >
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-white transition-all relative"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};
