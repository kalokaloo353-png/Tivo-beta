import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Edit3, Grid, Heart, Bookmark, 
  ExternalLink, Check, DollarSign, Coins, Radio, MessageSquare, Play, X, Upload, Camera, 
  Gift as GiftBoxIcon, Users, Link as LinkIcon, AlertCircle, RefreshCw, Sparkles, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { User, Video } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { syncUserToFirestore } from '../services/firebase';
import { VerifiedBadge } from './VerifiedBadge';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
  onOpenSettings: () => void;
  onSelectVideo: (video: Video) => void;
  onStartMessageWithUser: (user: User) => void;
  onGoLive: () => void;
  onOpenGiftBox: () => void;
}

// Compress and square center-crop image to 320x320 lightweight JPEG (~20KB)
function compressImageFile(file: File, maxDim = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (PNG, JPG, WebP, GIF)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image format'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.width;
          const height = img.height;
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxDim, maxDim);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  onUpdateCurrentUser,
  onOpenSettings,
  onSelectVideo,
  onStartMessageWithUser,
  onGoLive,
  onOpenGiftBox
}) => {
  const isOwnProfile = user.id === currentUser.id;
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'saved'>('videos');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [showFollowersRequiredModal, setShowFollowersRequiredModal] = useState(false);

  // Edit form states
  const [editDisplayName, setEditDisplayName] = useState(currentUser.displayName);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editWebsite, setEditWebsite] = useState(currentUser.website || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  
  // Avatar upload states
  const [avatarMethod, setAvatarMethod] = useState<'upload' | 'url' | 'camera' | 'presets'>('upload');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selfie camera refs & state
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isSelfieCameraActive, setIsSelfieCameraActive] = useState(false);
  const selfieStreamRef = useRef<MediaStream | null>(null);

  // Synchronize edit fields whenever modal opens or currentUser changes
  useEffect(() => {
    if (showEditModal) {
      setEditDisplayName(currentUser.displayName);
      setEditUsername(currentUser.username);
      setEditBio(currentUser.bio || '');
      setEditWebsite(currentUser.website || '');
      setEditAvatar(currentUser.avatar);
      setAvatarError(null);
      setAvatarSuccess(null);
      setAvatarUrlInput('');
      setAvatarMethod('upload');
    } else {
      stopSelfieCamera();
    }
  }, [showEditModal, currentUser]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopSelfieCamera();
    };
  }, []);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(!!user.isFollowing);
  const [followersCount, setFollowersCount] = useState(user.followersCount || 0);

  useEffect(() => {
    setIsFollowing(!!user.isFollowing);
    setFollowersCount(user.followersCount || 0);
  }, [user.id, user.followersCount, user.isFollowing]);

  const allVideos = storage.getVideos();
  const createdVideos = allVideos.filter(v => v.creator.id === user.id);
  const likedVideos = allVideos.filter(v => v.isLiked);
  const savedVideos = allVideos.filter(v => v.isBookmarked);

  // Preset creator photos
  const presetPhotos = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=320&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=320&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&auto=format&fit=crop&q=80'
  ];

  const handleToggleFollow = () => {
    audioEngine.playSoundEffect('tap');
    const result = storage.toggleFollowUser(user.id);
    setIsFollowing(result.isFollowing);
    setFollowersCount(result.targetUser.followersCount);
  };

  // Upload file from device with automatic center-crop compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsCompressingAvatar(true);

    try {
      const optimized = await compressImageFile(file, 320, 0.85);
      setEditAvatar(optimized);
      setAvatarSuccess('Photo uploaded & placed successfully!');
      audioEngine.playSoundEffect('pop');
    } catch (err: any) {
      setAvatarError(err?.message || 'Could not process selected photo. Please try a JPG or PNG file.');
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = '';
    }
  };

  // Apply photo link URL
  const handleApplyUrl = () => {
    const trimmed = avatarUrlInput.trim();
    if (!trimmed) {
      setAvatarError('Please enter an image URL');
      return;
    }
    setAvatarError(null);
    setIsCompressingAvatar(true);

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const minDim = Math.min(testImg.width, testImg.height);
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(testImg, (testImg.width - minDim) / 2, (testImg.height - minDim) / 2, minDim, minDim, 0, 0, 320, 320);
          setEditAvatar(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setEditAvatar(trimmed);
        }
      } catch {
        setEditAvatar(trimmed);
      }
      setAvatarSuccess('Photo link applied & placed!');
      audioEngine.playSoundEffect('pop');
      setIsCompressingAvatar(false);
      setAvatarUrlInput('');
    };
    testImg.onerror = () => {
      setEditAvatar(trimmed);
      setAvatarSuccess('Photo link placed!');
      audioEngine.playSoundEffect('pop');
      setIsCompressingAvatar(false);
      setAvatarUrlInput('');
    };
    testImg.src = trimmed;
  };

  // Selfie camera handlers
  const startSelfieCamera = async () => {
    setAvatarError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false
        });
        selfieStreamRef.current = stream;
        setIsSelfieCameraActive(true);
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
          selfieVideoRef.current.play().catch(() => {});
        }
      } else {
        setAvatarError('Webcam not supported in this browser');
      }
    } catch {
      setAvatarError('Camera access unavailable or blocked');
    }
  };

  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      try {
        selfieStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      selfieStreamRef.current = null;
    }
    setIsSelfieCameraActive(false);
  };

  const captureSelfie = () => {
    if (!selfieVideoRef.current) return;
    try {
      const video = selfieVideoRef.current;
      const canvas = document.createElement('canvas');
      const dim = Math.min(video.videoWidth || 320, video.videoHeight || 320);
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = ((video.videoWidth || 320) - dim) / 2;
        const startY = ((video.videoHeight || 320) - dim) / 2;
        ctx.translate(320, 0);
        ctx.scale(-1, 1); // mirror selfie
        ctx.drawImage(video, startX, startY, dim, dim, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditAvatar(dataUrl);
        setAvatarSuccess('Selfie captured and placed!');
        audioEngine.playSoundEffect('publish');
      }
      stopSelfieCamera();
    } catch {
      setAvatarError('Failed to capture selfie');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setAvatarError(null);

    try {
      const finalAvatar = editAvatar.trim() || currentUser.avatar;
      const updated: User = {
        ...currentUser,
        displayName: editDisplayName.trim() || currentUser.displayName,
        username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') || currentUser.username,
        bio: editBio.trim(),
        website: editWebsite.trim(),
        avatar: finalAvatar
      };

      storage.saveCurrentUser(updated);
      onUpdateCurrentUser(updated);
      syncUserToFirestore(updated).catch(() => {});
      stopSelfieCamera();
      setShowEditModal(false);
      audioEngine.playSoundEffect('publish');
    } catch (err: any) {
      setAvatarError(err?.message || 'Failed to save changes. Please try again.');
    }
  };

  const getActiveTabVideos = () => {
    switch (activeTab) {
      case 'videos':
        return createdVideos;
      case 'liked':
        return likedVideos;
      case 'saved':
        return savedVideos;
      default:
        return createdVideos;
    }
  };

  const displayVideos = getActiveTabVideos();

  return (
    <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar pb-24">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md px-4 py-3.5 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-sm text-white">@{user.username}</span>
          <VerifiedBadge 
            followersCount={followersCount}
            verified={user.verified}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <>
              {/* Mystery Gift Box Button */}
              {!currentUser.hasClaimed100kGift && (
                <button
                  onClick={onOpenGiftBox}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                  title="Claim 100,000 Free Coins"
                >
                  <GiftBoxIcon className="w-3.5 h-3.5 fill-black" />
                  <span>100K Coins</span>
                </button>
              )}

              <button
                onClick={onOpenSettings}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Info Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-2xl bg-neutral-900"
            />
            <VerifiedBadge 
              followersCount={followersCount} 
              verified={user.verified} 
              size="md"
              className="absolute top-0 right-0 shadow-lg"
            />
            {isOwnProfile && (
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white text-black shadow-md hover:bg-neutral-200 transition"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <h2 className="text-lg font-black text-white">{user.displayName}</h2>
            <VerifiedBadge 
              followersCount={followersCount} 
              verified={user.verified} 
              size="sm" 
            />
          </div>

          <p className="text-xs text-neutral-400 mt-0.5">@{user.username}</p>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 py-2 px-6 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
            <button
              onClick={() => setShowFollowModal('following')}
              className="flex flex-col items-center hover:opacity-80 transition"
            >
              <span className="text-sm font-black text-white font-mono">
                {user.followingCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Following
              </span>
            </button>

            <div className="w-[1px] h-6 bg-neutral-800" />

            <button
              onClick={() => setShowFollowModal('followers')}
              className="flex flex-col items-center hover:opacity-80 transition"
            >
              <span className="text-sm font-black text-white font-mono flex items-center gap-1">
                {followersCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Followers
              </span>
            </button>

            <div className="w-[1px] h-6 bg-neutral-800" />

            <div className="flex flex-col items-center">
              <span className="text-sm font-black text-white font-mono">
                {user.likesReceivedCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Likes
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 w-full max-w-xs">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit profile</span>
                </button>
                <button
                  onClick={() => {
                    if ((currentUser.followersCount || 0) < 50) {
                      setShowFollowersRequiredModal(true);
                      return;
                    }
                    onGoLive();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Go LIVE</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                    isFollowing
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      : 'bg-white hover:bg-neutral-200 text-black shadow-lg'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => onStartMessageWithUser(user)}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition"
                  title="Direct Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Bio & Link */}
          {user.bio && (
            <p className="text-xs text-neutral-300 mt-4 max-w-sm leading-relaxed text-center px-4 font-normal">
              {user.bio}
            </p>
          )}

          {user.website && (
            <a
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white hover:underline mt-2 font-medium"
            >
              <ExternalLink className="w-3 h-3 text-neutral-400" />
              <span>{user.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Verification Badge Progress Milestone */}
          {isOwnProfile && followersCount < 10000 && (
            <div className="mt-3 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Get <strong>10,000 followers</strong> to earn the verified checkmark</span>
              <span className="font-mono text-neutral-400">({followersCount.toLocaleString()} / 10,000)</span>
            </div>
          )}

          {followersCount >= 10000 && (
            <div className="mt-3 px-3 py-1 rounded-full bg-sky-950/40 border border-sky-500/30 flex items-center gap-1.5 text-[11px] text-sky-300 font-semibold">
              <VerifiedBadge followersCount={followersCount} size="xs" />
              <span>Verified Creator (10,000+ Followers Milestone)</span>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div>
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition ${
                activeTab === 'videos'
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Videos ({createdVideos.length})</span>
            </button>

            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition ${
                    activeTab === 'liked'
                      ? 'border-white text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Liked</span>
                </button>

                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition ${
                    activeTab === 'saved'
                      ? 'border-white text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Favorites</span>
                </button>
              </>
            )}
          </div>

          {/* Video Grid */}
          <div className="pt-3">
            {displayVideos.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Grid className="w-10 h-10 text-neutral-700 mx-auto" />
                <p className="text-xs text-neutral-400">No videos yet in this tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {displayVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    className="relative aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group hover:opacity-90 transition"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] text-white font-medium">
                      <Play className="w-3 h-3 fill-white" />
                      <span>{video.viewsCount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT PROFILE MODAL WITH HIGH-PERFORMANCE PFP UPLOAD & PLACEMENT */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => {
                stopSelfieCamera();
                setShowEditModal(false);
              }}
              className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-base text-white">Edit Profile & Photo</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Selector Panel */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-neutral-900/70 border border-neutral-800 rounded-3xl">
                {/* Live Avatar Preview */}
                <div className="relative group">
                  <img
                    src={editAvatar}
                    alt="PFP Preview"
                    onError={() => {
                      setAvatarError('Failed to display preview image');
                    }}
                    className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-2xl bg-neutral-900"
                  />
                  {isCompressingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white text-black shadow-lg hover:bg-neutral-200 transition active:scale-95"
                    title="Upload photo from device"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Messages */}
                {avatarError && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-300 text-[11px] font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{avatarError}</span>
                  </div>
                )}
                {avatarSuccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-300 text-[11px] font-medium animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{avatarSuccess}</span>
                  </div>
                )}

                {/* Photo Methods Navigation */}
                <div className="w-full flex items-center justify-center gap-1 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMethod('upload');
                      stopSelfieCamera();
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      avatarMethod === 'upload' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMethod('url');
                      stopSelfieCamera();
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      avatarMethod === 'url' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMethod('camera');
                      startSelfieCamera();
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      avatarMethod === 'camera' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3 h-3" />
                    <span>Selfie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMethod('presets');
                      stopSelfieCamera();
                    }}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      avatarMethod === 'presets' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Presets</span>
                  </button>
                </div>

                {/* METHOD 1: UPLOAD FILE FROM DEVICE */}
                {avatarMethod === 'upload' && (
                  <div className="w-full space-y-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressingAvatar}
                      className="w-full py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider transition active:scale-95 shadow flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isCompressingAvatar ? 'Optimizing Photo...' : 'Choose Photo from Device'}</span>
                    </button>
                    <p className="text-[10px] text-neutral-400">
                      Supports JPG, PNG, GIF, WebP. Automatically center-cropped & optimized.
                    </p>
                  </div>
                )}

                {/* METHOD 2: PASTE IMAGE URL */}
                {avatarMethod === 'url' && (
                  <div className="w-full space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        placeholder="Paste image link https://..."
                        className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs hover:bg-neutral-200 transition active:scale-95 shrink-0"
                      >
                        Place
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400 text-left">
                      Paste a direct image URL from Discord, Imgur, Unsplash, or anywhere on the web.
                    </p>
                  </div>
                )}

                {/* METHOD 3: CAMERA SELFIE SNAPSHOT */}
                {avatarMethod === 'camera' && (
                  <div className="w-full space-y-2 pt-1 flex flex-col items-center">
                    <div className="relative w-44 h-44 rounded-full overflow-hidden border-2 border-white bg-black flex items-center justify-center shadow-inner">
                      <video
                        ref={selfieVideoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    </div>
                    <div className="flex gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="flex-1 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Snapshot</span>
                      </button>
                      <button
                        type="button"
                        onClick={startSelfieCamera}
                        className="p-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition"
                        title="Restart camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* METHOD 4: PRESET AVATARS */}
                {avatarMethod === 'presets' && (
                  <div className="w-full pt-1 space-y-2">
                    <div className="grid grid-cols-6 gap-2">
                      {presetPhotos.map((photo, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setEditAvatar(photo);
                            setAvatarSuccess('Preset photo selected!');
                            audioEngine.playSoundEffect('pop');
                          }}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition active:scale-95 ${
                            editAvatar === photo 
                              ? 'border-white scale-110 shadow-lg' 
                              : 'border-neutral-700 opacity-60 hover:opacity-100 hover:border-neutral-500'
                          }`}
                        >
                          <img src={photo} alt={`preset-${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-white resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Website</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    stopSelfieCamera();
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              onClick={() => setShowFollowersRequiredModal(false)}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
