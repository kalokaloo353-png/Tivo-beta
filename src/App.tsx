import React, { useState, useEffect } from 'react';
import { ActiveTab, User, Video, LiveStream, Gift } from './types';
import { storage } from './services/storage';
import { audioEngine } from './services/audioService';
import { auth, onAuthStateChanged } from './services/firebase';

// Components
import { FeedView } from './components/FeedView';
import { DiscoverView } from './components/DiscoverView';
import { CreateView } from './components/CreateView';
import { LiveStreamView } from './components/LiveStreamView';
import { InboxView } from './components/InboxView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';
import { CommentModal } from './components/CommentModal';
import { ShareModal } from './components/ShareModal';
import { GiftSheet } from './components/GiftSheet';
import { SubscribeModal } from './components/SubscribeModal';
import { AuthModal } from './components/AuthModal';
import { GiftBoxModal } from './components/GiftBoxModal';
import { WelcomeRewardModal } from './components/WelcomeRewardModal';
import { TikTokGiftOverlay, ActiveGiftAnimation } from './components/TikTokGiftOverlay';
import { TakoAssistantModal } from './components/TakoAssistantModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [videos, setVideos] = useState<Video[]>(() => storage.getVideos());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [subView, setSubView] = useState<'settings' | 'view-user' | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [targetVideoId, setTargetVideoId] = useState<string | null>(null);
  const [discoverInitialQuery, setDiscoverInitialQuery] = useState('');
  const [activeConversationUser, setActiveConversationUser] = useState<User | null>(null);

  // Live Stream State
  const [showLiveStudio, setShowLiveStudio] = useState(false);
  const [selectedLiveStream, setSelectedLiveStream] = useState<LiveStream | null>(null);

  // Monetization Modals
  const [activeCommentVideo, setActiveCommentVideo] = useState<Video | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<Video | null>(null);
  const [activeGiftVideo, setActiveGiftVideo] = useState<Video | null>(null);
  const [activeSubscribeCreator, setActiveSubscribeCreator] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGiftBoxModal, setShowGiftBoxModal] = useState(false);
  const [showWelcomeRewardModal, setShowWelcomeRewardModal] = useState(false);
  const [tiktokGift, setTiktokGift] = useState<ActiveGiftAnimation | null>(null);

  // Tako AI Assistant State
  const [showTakoModal, setShowTakoModal] = useState(false);
  const [takoTargetVideo, setTakoTargetVideo] = useState<Video | null>(null);

  const handleOpenTako = (video?: Video) => {
    if (video) {
      setTakoTargetVideo(video);
    } else {
      setTakoTargetVideo(videos[0] || null);
    }
    audioEngine.playSoundEffect('tap');
    setShowTakoModal(true);
  };

  // Audio / Mute
  const [isMuted, setIsMuted] = useState(false);

  // Floating Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAwardCoins = (amount: number) => {
    let updated: User;
    if (amount >= 100000) {
      updated = storage.claim100kGift();
    } else {
      updated = {
        ...currentUser,
        coins: (currentUser.coins || 0) + amount
      };
      storage.saveCurrentUser(updated);
    }
    setCurrentUser(updated);
    showToast(`Claimed +${amount.toLocaleString()} Coins!`);
  };

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Sync or retain current user
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  // Video Actions
  const handleToggleLike = (videoId: string) => {
    const res = storage.toggleLikeVideo(videoId);
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, isLiked: res.isLiked, likesCount: res.likesCount } : v))
    );
  };

  const handleToggleBookmark = (videoId: string) => {
    const res = storage.toggleBookmarkVideo(videoId);
    audioEngine.playSoundEffect('pop');
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, isBookmarked: res.isBookmarked, bookmarksCount: res.bookmarksCount } : v
      )
    );
    showToast(res.isBookmarked ? 'Saved to Favorites' : 'Removed from Favorites');
  };

  const handleFollowCreator = (creatorId: string) => {
    const res = storage.toggleFollowUser(creatorId);
    setUsers(storage.getUsers());
    setVideos((prev) =>
      prev.map((v) =>
        v.creator.id === creatorId
          ? {
              ...v,
              creator: {
                ...v.creator,
                isFollowing: res.isFollowing,
                followersCount: res.targetUser.followersCount,
              },
            }
          : v
      )
    );
    showToast(res.isFollowing ? `Following @${res.targetUser.username}` : `Unfollowed @${res.targetUser.username}`);
  };

  const handleSelectHashtag = (tag: string) => {
    setDiscoverInitialQuery(`#${tag}`);
    setSubView(null);
    setActiveTab('discover');
  };

  const handleSelectSound = (soundId: string) => {
    const track = storage.getVideos().find((v) => v.musicTrack.id === soundId)?.musicTrack;
    if (track) {
      setDiscoverInitialQuery(track.title);
      setSubView(null);
      setActiveTab('discover');
    }
  };

  const handleSelectCreator = (user: User) => {
    if (user.id === currentUser.id) {
      setSubView(null);
      setActiveTab('profile');
    } else {
      setViewingUser(user);
      setSubView('view-user');
    }
  };

  const handleVideoPublished = (newVideo: Video) => {
    setVideos(storage.getVideos());
    setSubView(null);
    setActiveTab('feed');
    setTargetVideoId(newVideo.id);
    showToast('Your clip is published and live on TIVO!');
  };

  const handleSendMessageWithVideo = (recipient: User, video: Video) => {
    setActiveConversationUser(recipient);
    setSubView(null);
    setActiveTab('inbox');
    showToast(`Shared clip with @${recipient.username}`);
  };

  const handleGiftSent = (gift: Gift) => {
    setTiktokGift((prev) => ({
      id: `gift-${Date.now()}`,
      sender: currentUser,
      gift,
      comboCount: prev && prev.gift.id === gift.id ? prev.comboCount + 1 : 1
    }));
    audioEngine.playSoundEffect('publish');
    showToast(`Sent ${gift.name} (${gift.coins} Coins)!`);
    setCurrentUser(storage.getCurrentUser());
    setVideos(storage.getVideos());
  };

  const handleLogout = () => {
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: User) => {
    setShowAuthModal(false);
    setCurrentUser(user);
    setUsers(storage.getUsers());
    setVideos(storage.getVideos());
    showToast(`Welcome to TIVO, ${user.displayName}!`);
    setShowWelcomeRewardModal(true);
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white flex justify-center items-center overflow-hidden font-['Plus_Jakarta_Sans'] select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 px-4 py-2 rounded-full bg-white text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>●</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="relative w-full h-full max-w-[500px] md:max-w-full flex flex-col bg-black overflow-hidden shadow-2xl">
        {/* SUBVIEWS */}
        {subView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            onBack={() => setSubView(null)}
            onLogout={handleLogout}
            onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
            onToast={showToast}
          />
        )}

        {subView === 'view-user' && viewingUser && (
          <div className="relative w-full h-full">
            <ProfileView
              user={viewingUser}
              currentUser={currentUser}
              onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
              onOpenSettings={() => setSubView('settings')}
              onSelectVideo={(video) => {
                setSubView(null);
                setActiveTab('feed');
                setTargetVideoId(video.id);
              }}
              onStartMessageWithUser={(u) => {
                setActiveConversationUser(u);
                setSubView(null);
                setActiveTab('inbox');
              }}
              onGoLive={() => setShowLiveStudio(true)}
              onOpenGiftBox={() => setShowGiftBoxModal(true)}
            />
            <button
              onClick={() => setSubView(null)}
              className="fixed top-4 left-4 z-40 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-neutral-800 transition"
            >
              ← Back
            </button>
          </div>
        )}

        {/* PRIMARY TABS */}
        {!subView && (
          <>
            {activeTab === 'feed' && (
              <FeedView
                videos={videos}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onOpenComments={(v) => setActiveCommentVideo(v)}
                onOpenShare={(v) => setActiveShareVideo(v)}
                onOpenGift={(v) => setActiveGiftVideo(v)}
                onOpenGiftBox={() => setShowGiftBoxModal(true)}
                onFollowCreator={handleFollowCreator}
                onSelectHashtag={handleSelectHashtag}
                onSelectSound={handleSelectSound}
                onSelectCreator={handleSelectCreator}
                onOpenSearch={() => setActiveTab('discover')}
                onOpenLive={() => {
                  setSelectedLiveStream(storage.getLiveStreams()[0]);
                  setShowLiveStudio(true);
                }}
                onOpenTako={handleOpenTako}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                targetVideoId={targetVideoId}
                onClearTargetVideoId={() => setTargetVideoId(null)}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverView
                videos={videos}
                users={users}
                currentUser={currentUser}
                onSelectVideo={(video) => {
                  setActiveTab('feed');
                  setTargetVideoId(video.id);
                }}
                onSelectCreator={handleSelectCreator}
                onSelectLiveStream={(stream) => {
                  setSelectedLiveStream(stream);
                  setShowLiveStudio(true);
                }}
                onFollowCreator={handleFollowCreator}
                onOpenTako={() => handleOpenTako()}
                initialQuery={discoverInitialQuery}
              />
            )}

            {activeTab === 'create' && (
              <CreateView
                currentUser={currentUser}
                onVideoPublished={handleVideoPublished}
                onCancel={() => setActiveTab('feed')}
                onGoLive={() => {
                  setSelectedLiveStream(null);
                  setShowLiveStudio(true);
                }}
              />
            )}

            {activeTab === 'inbox' && (
              <InboxView
                currentUser={currentUser}
                onSelectVideo={(video) => {
                  setActiveTab('feed');
                  setTargetVideoId(video.id);
                }}
                onSelectCreator={handleSelectCreator}
                activeConversationUser={activeConversationUser}
                onClearActiveConversationUser={() => setActiveConversationUser(null)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={currentUser}
                currentUser={currentUser}
                onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
                onOpenSettings={() => setSubView('settings')}
                onSelectVideo={(video) => {
                  setActiveTab('feed');
                  setTargetVideoId(video.id);
                }}
                onStartMessageWithUser={(u) => {
                  setActiveConversationUser(u);
                  setActiveTab('inbox');
                }}
                onGoLive={() => {
                  setSelectedLiveStream(null);
                  setShowLiveStudio(true);
                }}
                onOpenGiftBox={() => setShowGiftBoxModal(true)}
              />
            )}

            {/* Bottom Navigation Bar */}
            {activeTab !== 'create' && (
              <BottomNav
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setSubView(null);
                  if (tab === 'discover') setDiscoverInitialQuery('');
                }}
                currentUser={currentUser}
                unreadCount={storage.getNotifications().filter((n) => !n.read).length}
              />
            )}
          </>
        )}
      </main>

      {/* LIVE STREAMING VIEW MODAL (STREAMER OR VIEWER) */}
      {showLiveStudio && (
        <LiveStreamView
          currentUser={currentUser}
          targetStream={selectedLiveStream}
          onClose={() => {
            setShowLiveStudio(false);
            setSelectedLiveStream(null);
          }}
          onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* COMMENTS MODAL */}
      {activeCommentVideo && (
        <CommentModal
          videoId={activeCommentVideo.id}
          isOpen={!!activeCommentVideo}
          onClose={() => setActiveCommentVideo(null)}
          currentUser={currentUser}
          onCommentAdded={() => setVideos(storage.getVideos())}
          onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* SHARE MODAL */}
      {activeShareVideo && (
        <ShareModal
          video={activeShareVideo}
          isOpen={!!activeShareVideo}
          onClose={() => setActiveShareVideo(null)}
          currentUser={currentUser}
          onSendMessageWithVideo={handleSendMessageWithVideo}
        />
      )}

      {/* VIRTUAL GIFT MODAL */}
      {activeGiftVideo && (
        <GiftSheet
          isOpen={!!activeGiftVideo}
          onClose={() => setActiveGiftVideo(null)}
          creator={activeGiftVideo.creator}
          currentUser={currentUser}
          onGiftSent={handleGiftSent}
          onOpenSignIn={() => setShowAuthModal(true)}
          videoId={activeGiftVideo.id}
        />
      )}

      {/* SUBSCRIBE TO CREATOR MODAL */}
      {activeSubscribeCreator && (
        <SubscribeModal
          isOpen={!!activeSubscribeCreator}
          onClose={() => setActiveSubscribeCreator(null)}
          creator={activeSubscribeCreator}
          onSubscribed={() => {
            setUsers(storage.getUsers());
            setVideos(storage.getVideos());
            showToast(`Subscribed to @${activeSubscribeCreator.username}!`);
          }}
        />
      )}

      {/* FIREBASE AUTH MODAL */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* 100k COINS MYSTERY GIFT BOX MODAL (Permanently disappears once claimed) */}
      {!currentUser.hasClaimed100kGift && (
        <GiftBoxModal
          isOpen={showGiftBoxModal}
          onClose={() => setShowGiftBoxModal(false)}
          onAwardCoins={handleAwardCoins}
        />
      )}

      {/* SIGN IN WELCOME REWARD MODAL */}
      <WelcomeRewardModal
        isOpen={showWelcomeRewardModal}
        onClose={() => setShowWelcomeRewardModal(false)}
        onClaim={() => {
          handleAwardCoins(5000);
          setShowWelcomeRewardModal(false);
        }}
      />

      {/* TIKTOK STYLE FULL-SCREEN GIFT BANNER ANIMATION */}
      <TikTokGiftOverlay
        activeGift={tiktokGift}
        onComplete={() => setTiktokGift(null)}
      />

      {/* TAKO AI ASSISTANT MODAL (TIKTOK STYLE) */}
      <TakoAssistantModal
        isOpen={showTakoModal}
        onClose={() => setShowTakoModal(false)}
        currentVideo={takoTargetVideo}
        currentUser={currentUser}
        onSelectVideo={(video) => {
          setActiveTab('feed');
          setTargetVideoId(video.id);
          setShowTakoModal(false);
        }}
        onSelectCreator={(user) => {
          handleSelectCreator(user);
          setShowTakoModal(false);
        }}
      />
    </div>
  );
}
