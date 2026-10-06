import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Camera, FlipHorizontal, Mic, MicOff, Users, Heart, Send, 
  Sparkles, Gift as GiftBoxIcon, Shield, Pin, Clock, AlertCircle, 
  ArrowLeft, Check, Play, UserCheck, Flame, Radio, RefreshCw 
} from 'lucide-react';
import { User, LiveStream, LiveChatMessage, Gift, GiftEvent } from '../types';
import { storage, DEFAULT_LIVESTREAMS } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { GiftSheet } from './GiftSheet';
import { SubscribeModal } from './SubscribeModal';
import { TikTokGiftOverlay, ActiveGiftAnimation } from './TikTokGiftOverlay';
import { GiftIcon } from './GiftIcon';
import { VerifiedBadge } from './VerifiedBadge';

interface LiveStreamViewProps {
  currentUser: User;
  onClose: () => void;
  targetStream?: LiveStream | null;
  onUpdateCurrentUser: (user: User) => void;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  currentUser,
  onClose,
  targetStream,
  onUpdateCurrentUser
}) => {
  // If targetStream provided, watch that stream. If null, streamer mode!
  const isWatching = !!targetStream;
  const streamer = targetStream ? targetStream.streamer : currentUser;

  // Streamer setup & eligibility
  const [isLiveActive, setIsLiveActive] = useState(isWatching);
  const [streamTitle, setStreamTitle] = useState('Late night freestyle & chat');
  const [category, setCategory] = useState('Creative');
  const [showFollowersRequiredModal, setShowFollowersRequiredModal] = useState(false);

  // Camera & stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(targetStream ? (targetStream.viewerCount || 0) : 0);
  const [likesCount, setLikesCount] = useState(targetStream ? (targetStream.likesCount || 0) : 0);

  // Chat & Moderation (Starts empty, no fake user comments)
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [inputChat, setInputChat] = useState('');
  const [pinnedComment, setPinnedComment] = useState<string | null>(targetStream?.pinnedComment || null);
  const [slowMode, setSlowMode] = useState(false);
  const [showModTools, setShowModTools] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  // Gifts & Animations
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [activeGifts, setActiveGifts] = useState<GiftEvent[]>([]);
  const [streamDuration, setStreamDuration] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);
  const [tiktokGift, setTiktokGift] = useState<ActiveGiftAnimation | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported on this browser');
        setCameraActive(false);
        return;
      }

      let stream: MediaStream | null = null;
      const constraintsList: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: facingMode } }, audio: false },
        { video: true, audio: false },
        { video: { facingMode: { ideal: facingMode } }, audio: true },
        { video: true, audio: true }
      ];

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          // Continue to next constraint
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => {
            console.warn('Auto play live stream video notice:', e);
          });
        }
      } else {
        setCameraActive(false);
        setCameraError('Please allow camera access in browser to broadcast live');
      }
    } catch (e: any) {
      setCameraActive(false);
      setCameraError(e?.message || 'Camera permission denied or camera not found');
    }
  }, [facingMode, stopCamera]);

  // Set video element ref and attach user stream immediately
  const setVideoElementRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && mediaStreamRef.current) {
      el.srcObject = mediaStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // Update srcObject whenever cameraActive flips
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Initialize user camera as soon as streamer mode starts
  useEffect(() => {
    if (!isWatching) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isWatching, facingMode, startCamera, stopCamera]);

  // Real viewer joined stream tracking
  useEffect(() => {
    if (isWatching && targetStream) {
      const realCount = storage.joinLiveStream(targetStream.id, currentUser.id);
      setViewerCount(realCount);

      return () => {
        storage.leaveLiveStream(targetStream.id, currentUser.id);
      };
    }
  }, [isWatching, targetStream, currentUser.id]);

  // Stream duration ticker & real viewer monitor for broadcaster
  useEffect(() => {
    let timer: any;
    if (isLiveActive) {
      const streamId = `live-${currentUser.id}`;
      timer = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
        const realCount = storage.getRealLiveViewerCount(streamId);
        setViewerCount(realCount);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveActive, currentUser.id]);

  const handleStartBroadcast = () => {
    // Follower check: must have at least 50 followers to go live
    if ((currentUser.followersCount || 0) < 50) {
      setShowFollowersRequiredModal(true);
      return;
    }

    setIsLiveActive(true);
    audioEngine.playSoundEffect('publish');
    storage.startLiveStream({
      id: `live-${currentUser.id}`,
      streamer: currentUser,
      title: streamTitle,
      viewerCount: 0,
      likesCount: 0,
      isLive: true,
      startedAt: 'Just now',
      category
    });
  };

  const handleEndBroadcast = () => {
    setIsLiveActive(false);
    stopCamera();
    setShowSummary(true);
    storage.endLiveStream(`live-${currentUser.id}`);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    audioEngine.playSoundEffect('tap');
    const newMsg: LiveChatMessage = {
      id: `live-m-${Date.now()}`,
      user: currentUser,
      text: inputChat.trim(),
      isSubscriber: streamer.isSubscribedTo,
      timestamp: 'Just now'
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputChat('');
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSendGift = (gift: Gift) => {
    audioEngine.playSoundEffect('publish');
    setTiktokGift((prev) => ({
      id: `gift-${Date.now()}`,
      sender: currentUser,
      gift,
      comboCount: prev && prev.gift.id === gift.id ? prev.comboCount + 1 : 1
    }));
    setTotalCoinsEarned((prev) => prev + gift.coins);
    setShowGiftSheet(false);
    onUpdateCurrentUser(storage.getCurrentUser());
  };

  const handleLikeStream = () => {
    setLikesCount((prev) => prev + 1);
    audioEngine.playSoundEffect('like');
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center select-none overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* 1. STREAMER SETUP SCREEN (With live user camera preview background) */}
      {!isWatching && !isLiveActive && !showSummary && (
        <div className="relative w-full h-full max-w-[500px] flex flex-col justify-between items-center overflow-hidden bg-neutral-950 p-6">
          {/* User Camera Preview behind setup screen */}
          <div className="absolute inset-0 w-full h-full bg-neutral-950 overflow-hidden">
            <video
              ref={setVideoElementRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover filter contrast-105 ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraActive ? 'opacity-70' : 'opacity-20'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80 backdrop-blur-sm" />
          </div>

          {/* Top Bar on Setup Screen */}
          <div className="relative z-20 w-full flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-neutral-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-neutral-800 transition active:scale-90"
              title="Flip camera"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Center Setup Card */}
          <div className="relative z-20 w-full max-w-sm space-y-4 text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto shadow-2xl">
              <Radio className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Start Live Broadcast</h2>
              <p className="text-xs text-neutral-300 mt-1">Broadcast directly from your camera in HD</p>
            </div>

            {/* Camera Status */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-neutral-300">{cameraActive ? 'User Camera Ready' : (cameraError || 'Starting Camera...')}</span>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Broadcast Title</label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Give your live stream a title..."
                  className="w-full bg-neutral-900/90 border border-neutral-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Stream Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Creative', 'Music', 'Cooking', 'Fitness', 'Chat', 'Gaming'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        category === cat
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Go Live Button */}
          <div className="relative z-20 w-full max-w-sm pt-4">
            <button
              onClick={handleStartBroadcast}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest transition shadow-[0_0_30px_rgba(239,68,68,0.6)] active:scale-95 flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 text-white" />
              <span>Go Live Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE LIVE BROADCAST (Streamer or Viewer) */}
      {isLiveActive && (
        <div className="relative w-full h-full max-w-[500px] bg-black flex flex-col justify-between overflow-hidden">
          {/* Stream Video Feed */}
          {isWatching ? (
            <video
              src={targetStream?.videoUrl || "/videos/clip_1.mp4"}
              autoPlay
              loop
              playsInline
              muted={false}
              className="absolute inset-0 w-full h-full object-cover filter contrast-110"
            />
          ) : (
            /* Streamer Live Camera Feed */
            <div className="absolute inset-0 w-full h-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
              <video
                ref={setVideoElementRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover filter contrast-105 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center">
                  <Camera className="w-12 h-12 text-neutral-500 mb-2 animate-pulse" />
                  <p className="text-xs text-neutral-300 mb-3">{cameraError || 'User camera starting...'}</p>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dark Gradients for contrast */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

          {/* TOP BAR: Streamer Info & Stats */}
          <div className="relative z-20 flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/10">
              <img
                src={streamer.avatar}
                alt={streamer.username}
                className="w-9 h-9 rounded-full object-cover border border-white/40"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white">{streamer.displayName}</span>
                  <VerifiedBadge 
                    followersCount={streamer.followersCount} 
                    verified={streamer.verified} 
                    size="xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-white" />
                    <span>{viewerCount.toLocaleString()}</span>
                  </span>
                  <span>·</span>
                  <span className="font-mono">{formatTime(streamDuration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase animate-pulse flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                LIVE
              </span>

              {isWatching ? (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleEndBroadcast}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider transition shadow-lg active:scale-95"
                >
                  End Stream
                </button>
              )}
            </div>
          </div>

          {/* FLOATING VIRTUAL GIFTS ON-SCREEN BANNER */}
          <div className="absolute top-24 left-4 z-30 space-y-2 pointer-events-none">
            {activeGifts.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white animate-float-gift shadow-2xl"
              >
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <GiftIcon iconKey={g.giftId || 'gift-rose'} size="sm" />
                </div>
                <div>
                  <span className="text-xs font-black">{g.senderName}</span>
                  <p className="text-[10px] text-neutral-300">sent a {g.giftName} ({g.coins} Coins)!</p>
                </div>
              </div>
            ))}
          </div>

          {/* CHAT MESSAGES STREAM */}
          <div className="relative z-20 flex flex-col justify-end px-4 pb-2 space-y-3">
            {/* Pinned Message */}
            {pinnedComment && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white max-w-sm animate-in fade-in">
                <Pin className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="font-semibold line-clamp-1">{pinnedComment}</span>
              </div>
            )}

            {/* Chat list */}
            <div
              ref={chatContainerRef}
              className="max-h-48 overflow-y-auto no-scrollbar space-y-2 text-xs flex flex-col"
            >
              {chatMessages.length === 0 ? (
                <div className="text-[11px] text-neutral-400 italic py-2">
                  Welcome to the LIVE! Be the first to send a message.
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="inline-flex items-start gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-2xl max-w-xs border border-white/10 self-start"
                  >
                    <span className="font-bold text-neutral-300 shrink-0">
                      @{msg.user.username}:
                    </span>
                    <span className="text-white break-words">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* BOTTOM INTERACTION BAR */}
            <div className="flex items-center gap-2 pt-2">
              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="relative flex-1">
                <input
                  type="text"
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  disabled={!inputChat.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-white disabled:bg-neutral-800 text-black rounded-full transition"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>

              {/* Colorful Gift Button */}
              <button
                onClick={() => setShowGiftSheet(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white flex items-center justify-center transition shadow-[0_0_15px_rgba(244,63,94,0.6)] hover:shadow-[0_0_25px_rgba(244,63,94,0.9)] hover:scale-110 active:scale-95 shrink-0"
                title="Send virtual gift"
              >
                <GiftBoxIcon className="w-5 h-5 text-white drop-shadow" />
              </button>

              {/* Likes Button */}
              <button
                onClick={handleLikeStream}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:text-white flex items-center justify-center transition active:scale-125 shrink-0"
                title="Tap to like"
              >
                <Heart className="w-5 h-5 fill-white" />
              </button>

              {/* Streamer Moderation Tools */}
              {!isWatching && (
                <button
                  onClick={() => setShowModTools(!showModTools)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition shrink-0 ${
                    showModTools ? 'bg-white text-black border-white' : 'bg-black/60 border-white/20 text-white'
                  }`}
                  title="Streamer Moderation"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Streamer Moderation Tools Bar */}
            {showModTools && !isWatching && (
              <div className="p-3 bg-neutral-950/95 border border-white/20 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setSlowMode(!slowMode)}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 ${
                    slowMode ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Slow Mode (3s)</span>
                </button>

                <button
                  onClick={() => setPinnedComment(chatMessages[chatMessages.length - 1]?.text || 'Welcome to the live!')}
                  className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-white text-neutral-300 font-bold transition flex items-center gap-1.5"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pin Last Msg</span>
                </button>

                <button
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="p-2 rounded-xl border border-neutral-800 text-white hover:border-white"
                  title="Flip camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BROADCAST SUMMARY SCREEN */}
      {showSummary && (
        <div className="w-full max-w-sm p-6 bg-neutral-950 border border-neutral-800 rounded-3xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto text-xl font-black">
            <Check className="w-6 h-6 stroke-[3] text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Live Broadcast Ended</h3>
            <p className="text-xs text-neutral-400">Great stream! Here are your performance metrics:</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-bold uppercase">Duration</span>
              <span className="text-base font-black text-white">{formatTime(streamDuration)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-bold uppercase">Peak Viewers</span>
              <span className="text-base font-black text-white">{viewerCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-bold uppercase">Total Likes</span>
              <span className="text-base font-black text-white">{likesCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block font-bold uppercase">Coins Received</span>
              <span className="text-base font-black text-white">+{totalCoinsEarned.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      )}

      {/* GIFT SHEET MODAL */}
      {showGiftSheet && (
        <GiftSheet
          isOpen={showGiftSheet}
          onClose={() => setShowGiftSheet(false)}
          creator={streamer}
          currentUser={currentUser}
          onGiftSent={handleSendGift}
        />
      )}

      {/* SUBSCRIBE MODAL */}
      {showSubscribeModal && (
        <SubscribeModal
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
          creator={streamer}
          onSubscribed={() => {
            setShowSubscribeModal(false);
          }}
        />
      )}

      {/* TIKTOK STYLE GIFT ANIMATION BANNER */}
      <TikTokGiftOverlay
        activeGift={tiktokGift}
        onComplete={() => setTiktokGift(null)}
      />

      {/* POPUP: 50 FOLLOWERS REQUIRED FOR LIVE */}
      {showFollowersRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-white">
              <Users className="w-7 h-7 text-white stroke-[2]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">Live Requirement</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-semibold bg-neutral-900 border border-neutral-800 p-4 rounded-2xl text-left">
                "Sorry, you need to post more and get 50 followers."
              </p>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Current followers: <strong className="text-white">{currentUser.followersCount || 0} / 50</strong>
            </div>
            <button
              onClick={() => {
                setShowFollowersRequiredModal(false);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
            >
              OK, Post More Videos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
