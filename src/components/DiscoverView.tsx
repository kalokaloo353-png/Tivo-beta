import React, { useState } from 'react';
import { Search, TrendingUp, Music, Hash, Users, Play, Heart, Radio, Sparkles, ArrowRight } from 'lucide-react';
import { Video, User, LiveStream } from '../types';
import { storage, DEFAULT_TRACKS, DEFAULT_LIVESTREAMS } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { VerifiedBadge } from './VerifiedBadge';
import { TakoMascot } from './TakoMascot';

interface DiscoverViewProps {
  videos: Video[];
  users: User[];
  currentUser: User;
  onSelectVideo: (video: Video) => void;
  onSelectCreator: (user: User) => void;
  onSelectLiveStream: (stream: LiveStream) => void;
  onFollowCreator: (creatorId: string) => void;
  onOpenTako?: () => void;
  initialQuery?: string;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  videos,
  users,
  currentUser,
  onSelectVideo,
  onSelectCreator,
  onSelectLiveStream,
  onFollowCreator,
  onOpenTako,
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'videos' | 'creators' | 'live' | 'sounds'>('all');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const trendingTags = [
    { tag: 'blackandwhite', count: '2.1M' },
    { tag: 'dance', count: '1.4M' },
    { tag: 'skate', count: '890K' },
    { tag: 'cooking', count: '650K' },
    { tag: 'cinematic', count: '520K' },
    { tag: 'tokyo', count: '480K' },
    { tag: 'tivo', count: '3.5M' }
  ];

  const liveStreams = storage.getLiveStreams();
  const query = searchQuery.toLowerCase().trim();

  const filteredVideos = videos.filter((v) => {
    if (!query) return true;
    return (
      v.caption.toLowerCase().includes(query) ||
      v.creator.username.toLowerCase().includes(query) ||
      v.hashtags.some((h) => h.toLowerCase().includes(query.replace('#', '')))
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    return (
      u.username.toLowerCase().includes(query) ||
      u.displayName.toLowerCase().includes(query) ||
      u.bio.toLowerCase().includes(query)
    );
  });

  const handleToggleSoundPreview = (track: any) => {
    if (playingTrackId === track.id) {
      audioEngine.stopMusicTrack();
      setPlayingTrackId(null);
    } else {
      audioEngine.playMusicTrack(track.id, 120, 'electro');
      setPlayingTrackId(track.id);
    }
  };

  return (
    <div className="w-full h-full bg-black text-white overflow-y-auto no-scrollbar pb-24">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md px-4 pt-4 pb-2 border-b border-neutral-900">
        <div className="relative max-w-xl mx-auto">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clips, creators, #hashtags, sounds..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tako AI Assistant Prompt Banner */}
        <div className="max-w-xl mx-auto mt-2.5">
          <button
            type="button"
            onClick={() => onOpenTako && onOpenTako()}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-neutral-900 to-indigo-950/50 border border-sky-500/30 hover:border-cyan-400/60 transition shadow group text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <TakoMascot size="xs" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">Ask Tako AI</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400 text-black font-extrabold uppercase">
                    AI Assistant
                  </span>
                </div>
                <span className="text-[10px] text-neutral-300 block truncate">
                  Get video recommendations, viral captions, and discover trends
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pt-3 max-w-xl mx-auto">
          {(['all', 'videos', 'creators', 'live', 'sounds'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full capitalize whitespace-nowrap transition ${
                activeFilter === tab
                  ? 'bg-white text-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'live' ? 'Live Now' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* ACTIVE LIVE BROADCASTS CAROUSEL */}
        {(activeFilter === 'all' || activeFilter === 'live') && liveStreams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-black text-sm text-white">Live Broadcasts</h3>
              </div>
              <span className="text-[11px] text-neutral-500">{liveStreams.length} streaming now</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveStreams.map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => onSelectLiveStream(stream)}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={stream.streamer.avatar}
                        alt={stream.streamer.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                      />
                      <span className="absolute -bottom-1 -right-1 px-1 rounded-sm bg-red-600 text-white text-[8px] font-black uppercase">
                        LIVE
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{stream.title}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        @{stream.streamer.username} · {stream.category}
                      </p>
                      <span className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>{stream.viewerCount} watching</span>
                      </span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-black shrink-0 ml-2 group-hover:bg-neutral-200 transition">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Hashtags */}
        {(activeFilter === 'all' || activeFilter === 'videos') && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-4 h-4 text-white" />
              <h3 className="font-black text-sm text-white">Trending Topics</h3>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {trendingTags.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => setSearchQuery(`#${item.tag}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white transition shrink-0"
                >
                  <Hash className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-neutral-200">{item.tag}</span>
                  <span className="text-[10px] text-neutral-500">({item.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Creators */}
        {(activeFilter === 'all' || activeFilter === 'creators') && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-white" />
                <h3 className="font-black text-sm text-white">Recommended Creators</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="min-w-[150px] p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center text-center relative hover:border-white transition"
                >
                  <button
                    onClick={() => onSelectCreator(user)}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-14 h-14 rounded-full object-cover border border-neutral-700"
                      />
                      <VerifiedBadge 
                        followersCount={user.followersCount} 
                        verified={user.verified}
                        size="xs"
                        className="absolute bottom-0 right-0"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white truncate max-w-[110px]">
                        {user.displayName}
                      </span>
                      <VerifiedBadge 
                        followersCount={user.followersCount} 
                        verified={user.verified}
                        size="xs"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[110px]">
                      @{user.username}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">
                      {user.followersCount.toLocaleString()} followers
                    </span>
                  </button>

                  {currentUser.id !== user.id && (
                    <button
                      onClick={() => onFollowCreator(user.id)}
                      className={`w-full mt-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition ${
                        user.isFollowing
                          ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 20 Videos Grid */}
        {(activeFilter === 'all' || activeFilter === 'videos') && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-sm text-white">
                {searchQuery ? `Search Results (${filteredVideos.length})` : '20 Trending Clips'}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.caption}
                    className="w-full h-full object-cover group-hover:brightness-110 transition duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Likes & Views Badge */}
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-[11px] font-bold line-clamp-2 leading-tight drop-shadow mb-1">
                      {video.caption}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-300 font-medium">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-white fill-white" />
                        <span>{video.likesCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3 fill-white" />
                        <span>{video.viewsCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
