import { Video, User } from '../types';
import { storage } from './storage';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tako';
  text: string;
  timestamp: string;
  recommendedVideoIds?: string[];
  suggestedPrompts?: string[];
}

export const INITIAL_TAKO_GREETING: ChatMessage = {
  id: 'tako-welcome',
  sender: 'tako',
  text: "Hey! I'm **Tako**, your TiVo AI Assistant 🐙✨\n\nI can recommend videos, explain what you're watching, brainstorm viral caption ideas, or help you navigate TiVo!",
  timestamp: 'Just now',
  suggestedPrompts: [
    '💡 Explain this video',
    '🎬 Recommend viral motion videos',
    '✍️ Give me 3 caption ideas for my next video',
    '🌟 How do I get the verified checkmark?',
    '🔴 What are the requirements to go LIVE?'
  ]
};

class AIAssistantService {
  /**
   * Send a message to Tako AI Assistant
   */
  public async sendMessage(
    prompt: string,
    currentVideo?: Video | null,
    currentUser?: User | null,
    history: ChatMessage[] = []
  ): Promise<ChatMessage> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error('Message cannot be empty');
    }

    try {
      // 1. Try calling the backend Gemini proxy endpoint
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          currentVideo: currentVideo
            ? {
                id: currentVideo.id,
                caption: currentVideo.caption,
                hashtags: currentVideo.hashtags,
                creator: {
                  username: currentVideo.creator.username,
                  displayName: currentVideo.creator.displayName,
                  verified: currentVideo.creator.verified,
                  followersCount: currentVideo.creator.followersCount
                },
                musicTrack: currentVideo.musicTrack
              }
            : null,
          currentUser: currentUser
            ? {
                username: currentUser.username,
                followersCount: currentUser.followersCount,
                verified: currentUser.verified
              }
            : null,
          history: history.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          const recIds = this.extractRecommendedVideoIds(data.text);
          return {
            id: `tako-${Date.now()}`,
            sender: 'tako',
            text: data.text,
            timestamp: 'Just now',
            recommendedVideoIds: recIds.length > 0 ? recIds : data.recommendedVideoIds,
            suggestedPrompts: data.suggestedPrompts || this.getSmartFollowUpPrompts(cleanPrompt)
          };
        }
      }
    } catch (err) {
      console.warn('Backend assistant notice, using resilient AI engine:', err);
    }

    // 2. Resilient instant AI response engine with deep TiVo domain knowledge
    const fallbackResponse = this.generateResilientResponse(cleanPrompt, currentVideo, currentUser);
    return fallbackResponse;
  }

  /**
   * Extract any video IDs mentioned in the format [vid-XX] or vid-XX
   */
  private extractRecommendedVideoIds(text: string): string[] {
    const allVideos = storage.getVideos();
    const foundIds: string[] = [];

    const matches = text.match(/vid-\d+/g);
    if (matches) {
      for (const m of matches) {
        if (allVideos.some((v) => v.id === m) && !foundIds.includes(m)) {
          foundIds.push(m);
        }
      }
    }
    return foundIds.slice(0, 3);
  }

  /**
   * Contextual fallback responses for TiVo
   */
  private generateResilientResponse(
    prompt: string,
    currentVideo?: Video | null,
    currentUser?: User | null
  ): ChatMessage {
    const q = prompt.toLowerCase();
    const allVideos = storage.getVideos();
    let text = '';
    let recIds: string[] = [];
    let suggested: string[] = [];

    // Question: Explain current video
    if (q.includes('explain') || q.includes('this video') || q.includes('what is this') || q.includes('current video')) {
      if (currentVideo) {
        text = `🎬 **About this Video:**\n\n` +
          `• **Creator:** @${currentVideo.creator.username} (${currentVideo.creator.displayName})\n` +
          `• **Story / Caption:** "${currentVideo.caption}"\n` +
          `• **Audio Track:** 🎵 *${currentVideo.musicTrack.title}* by ${currentVideo.musicTrack.artist}\n` +
          `• **Tags:** ${currentVideo.hashtags.map((h) => `#${h}`).join(' ')}\n\n` +
          `This video explores high-contrast kinetic motion and hypnotic digital aesthetics crafted specifically for the TiVo feed!`;
        suggested = ['Recommend similar videos', 'Who created this song?', 'Viral caption ideas'];
      } else {
        text = `You aren't currently watching a specific clip, but I can recommend the top trending motion videos on TiVo!`;
        recIds = ['vid-01', 'vid-02'];
        suggested = ['Show me fractals', 'Find lo-fi sounds', 'How to get verified?'];
      }
    }
    // Question: Verification / Checkmark Badge
    else if (q.includes('verified') || q.includes('check mark') || q.includes('checkmark') || q.includes('badge')) {
      text = `🌟 **How to get the Verified Checkmark on TiVo:**\n\n` +
        `1. **Follower Milestone:** You need **10,000 followers** to earn the official blue verification checkmark badge!\n` +
        `2. **Active Creator:** Publish original high-definition vertical videos and engage with your community.\n` +
        `3. **Current Progress:** You currently have **${(currentUser?.followersCount || 0).toLocaleString()}** / 10,000 followers.\n\n` +
        `Keep creating great clips and sharing your profile link to grow your audience!`;
      suggested = ['Requirements to go LIVE', 'Viral caption ideas', 'Trending hashtags'];
    }
    // Question: LIVE Broadcast requirements
    else if (q.includes('live') || q.includes('broadcast') || q.includes('stream')) {
      text = `🔴 **TiVo LIVE Broadcasting Requirements:**\n\n` +
        `• You need at least **50 followers** to unlock the LIVE broadcasting feature.\n` +
        `• Your current followers: **${(currentUser?.followersCount || 0).toLocaleString()}** / 50.\n` +
        `• Once unlocked, tap **Create (+)** and swipe to the **LIVE** mode to start streaming real-time video with instant chat and gifts!`;
      suggested = ['How to get verified check mark?', 'How do gifts work?', 'Recommend videos'];
    }
    // Question: Captions & Hashtags
    else if (q.includes('caption') || q.includes('idea') || q.includes('hashtag')) {
      text = `✍️ **Viral Caption Ideas for Your Next TiVo Video:**\n\n` +
        `1. *"Lost in the rhythm of pure geometry. Watch until the end. 🖤 #motion #minimal #hypnotic"*\n` +
        `2. *"Sound design meets kinetic flow. Turn volume UP 🎧 #audioreactive #vibes #tivo"*\n` +
        `3. *"Simulating digital infinity in monochrome. Which frame is your favorite? #fractal #generative #design"*\n\n` +
        `*Pro Tip: Tap the vinyl record on any clip to attach trending audio!*`;
      suggested = ['Recommend trending tracks', 'Explain this video', 'How to get verified?'];
    }
    // Question: Music / Sounds
    else if (q.includes('music') || q.includes('song') || q.includes('sound') || q.includes('track') || q.includes('audio')) {
      text = `🎵 **Top Trending Sounds on TiVo:**\n\n` +
        `• **Monochrome Beat** – *TIVO Sound Studio* (84.2k videos)\n` +
        `• **Minimalist Wave** – *VØID ARCHIVE* (128.9k videos)\n` +
        `• **Midnight Lo-Fi** – *Aura Beats* (92.1k videos)\n` +
        `• **Sub Bass Flow** – *Architect* (188.4k videos)\n\n` +
        `You can tap the rotating disc on any video to use the exact sound in your own video!`;
      suggested = ['Viral caption ideas', 'Recommend videos', 'How to go LIVE'];
    }
    // Question: Coin Gifts
    else if (q.includes('gift') || q.includes('coin') || q.includes('donate')) {
      text = `🎁 **Virtual Gifts on TiVo:**\n\n` +
        `• You can send virtual gifts to creators on their videos and in LIVE streams.\n` +
        `• Available gifts include **Rose (1 coin)**, **Heart (5 coins)**, **TiVo Crown (5,000 coins)**, and the ultimate **Cosmic Supernova (100,000 coins)** with full-screen TikTok 3D animations!\n` +
        `• Claim the free +100k coins gift box on your feed to get started!`;
      suggested = ['Claim 100k coins', 'How to go LIVE', 'Recommend videos'];
    }
    // Question: Recommendations
    else {
      // Pick 2 matching or diverse videos
      const sample = allVideos.slice(0, 3);
      recIds = sample.map((s) => s.id);
      text = `Here are some standout videos handpicked for you on TiVo:\n\n` +
        sample
          .map((v) => `• [${v.id}] **${v.caption.slice(0, 50)}...** by @${v.creator.username}`)
          .join('\n') +
        `\n\nTap any card below to watch! What kind of content would you like to explore next?`;
      suggested = ['Show me generative art', 'Find lo-fi sounds', 'How do I get verified?'];
    }

    return {
      id: `tako-${Date.now()}`,
      sender: 'tako',
      text,
      timestamp: 'Just now',
      recommendedVideoIds: recIds,
      suggestedPrompts: suggested
    };
  }

  /**
   * Follow up prompt suggestions
   */
  private getSmartFollowUpPrompts(query: string): string[] {
    const q = query.toLowerCase();
    if (q.includes('caption')) {
      return ['Give me 3 more ideas', 'Recommend trending tracks', 'How to get verified?'];
    }
    if (q.includes('music') || q.includes('sound')) {
      return ['Show videos with this sound', 'Caption ideas', 'How to go LIVE?'];
    }
    return ['🎬 Recommend more videos', '✍️ Viral caption ideas', '🌟 How to get verified?'];
  }
}

export const aiAssistant = new AIAssistantService();
