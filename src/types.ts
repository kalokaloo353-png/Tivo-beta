export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  website?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  likesReceivedCount: number;
  createdAt: string;
  isFollowing?: boolean;
  // Monetization fields
  coins: number;
  creatorEarnings: number;
  isSubscribedTo?: boolean;
  subscriptionPrice?: number; // e.g. 4.99
  hasClaimed100kGift?: boolean;
  hasSent100kGift?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl?: string;
  coverUrl: string;
  duration: number;
  usesCount: number;
}

export interface TextOverlay {
  text: string;
  position: 'top' | 'middle' | 'bottom';
  color: string;
  backgroundColor?: string;
}

export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  creator: User;
  musicTrack: MusicTrack;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  filter?: string;
  textOverlay?: TextOverlay;
  isExclusive?: boolean; // Exclusive subscriber-only video
  creatorFundEarnings?: number; // USD generated
  giftsReceivedCount?: number;
}

export interface Comment {
  id: string;
  videoId: string;
  user: User;
  text: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  gift?: Gift;
  replies?: Comment[];
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  coins: number;
  color?: string;
}

export interface GiftEvent {
  id: string;
  senderName: string;
  senderAvatar: string;
  giftName: string;
  giftIcon: string;
  giftId?: string;
  coins: number;
  timestamp: number;
}

export interface LiveStream {
  id: string;
  streamer: User;
  title: string;
  viewerCount: number;
  likesCount: number;
  isLive: boolean;
  startedAt: string;
  category: string;
  videoUrl?: string;
  pinnedComment?: string;
  slowModeEnabled?: boolean;
}

export interface LiveChatMessage {
  id: string;
  user: User;
  text: string;
  isPinned?: boolean;
  isSubscriber?: boolean;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  videoAttachment?: {
    id: string;
    thumbnailUrl: string;
    caption: string;
    creatorUsername: string;
  };
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'gift' | 'subscription' | 'system';
  actor: User;
  message: string;
  videoId?: string;
  videoThumbnail?: string;
  createdAt: string;
  read: boolean;
}

export type ActiveTab = 'feed' | 'discover' | 'create' | 'inbox' | 'profile';
