import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Sparkles, RefreshCw, Trash2, Play, 
  ExternalLink, ArrowRight, Video as VideoIcon, Compass, Flame 
} from 'lucide-react';
import { User, Video } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { aiAssistant, ChatMessage, INITIAL_TAKO_GREETING } from '../services/aiAssistantService';
import { TakoMascot } from './TakoMascot';

interface TakoAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo?: Video | null;
  currentUser: User;
  onSelectVideo: (video: Video) => void;
  onSelectCreator: (user: User) => void;
}

export const TakoAssistantModal: React.FC<TakoAssistantModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  currentUser,
  onSelectVideo,
  onSelectCreator
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_TAKO_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    audioEngine.playSoundEffect('tap');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await aiAssistant.sendMessage(
        text,
        currentVideo,
        currentUser,
        messages
      );
      audioEngine.playSoundEffect('pop');
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `tako-err-${Date.now()}`,
          sender: 'tako',
          text: "I'm having a slight hiccup connecting, but I'm still right here to assist you! Try tapping one of the suggested prompts below.",
          timestamp: 'Just now',
          suggestedPrompts: [
            '🎬 Recommend videos',
            '🌟 How do I get verified?',
            '✍️ Caption ideas'
          ]
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    audioEngine.playSoundEffect('pop');
    setMessages([INITIAL_TAKO_GREETING]);
  };

  const handleWatchVideo = (videoId: string) => {
    const vid = storage.getVideos().find((v) => v.id === videoId);
    if (vid) {
      audioEngine.playSoundEffect('publish');
      onSelectVideo(vid);
      onClose();
    }
  };

  // Helper to render bold text and line breaks cleanly without full markdown bloat
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, lineIdx) => {
      // Bold tags parsing **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lineIdx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md h-[88vh] sm:h-[680px] bg-neutral-950 sm:rounded-3xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* HEADER BAR */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <TakoMascot size="sm" isThinking={isThinking} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-wide">Tako AI</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Assistant
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block font-medium">
                TiVo Creative Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Close Tako"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Video Context Pill (if watching a video) */}
        {currentVideo && (
          <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex items-center justify-between text-xs text-neutral-300 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentVideo.thumbnailUrl}
                alt="Watching"
                className="w-6 h-6 rounded-md object-cover border border-neutral-700 shrink-0"
              />
              <span className="truncate text-[11px]">
                Context: <strong className="text-white">@{currentVideo.creator.username}</strong> · {currentVideo.caption}
              </span>
            </div>
            <button
              onClick={() => handleSendMessage('Explain this video in detail')}
              className="text-[10px] font-bold text-cyan-400 hover:underline shrink-0 ml-2"
            >
              Explain
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MESSAGES SCROLL CONTAINER */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className="flex items-start gap-2 max-w-[88%]">
                {msg.sender === 'tako' && (
                  <TakoMascot size="xs" className="mt-1" />
                )}

                <div
                  className={`p-3 rounded-2xl text-xs ${
                    msg.sender === 'user'
                      ? 'bg-white text-black font-semibold rounded-br-none shadow-md'
                      : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-none shadow-md'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Embedded Video Recommendation Cards */}
                  {msg.recommendedVideoIds && msg.recommendedVideoIds.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                        Recommended Videos on TiVo:
                      </span>
                      {msg.recommendedVideoIds.map((vidId) => {
                        const vid = storage.getVideos().find((v) => v.id === vidId);
                        if (!vid) return null;
                        return (
                          <div
                            key={vid.id}
                            onClick={() => handleWatchVideo(vid.id)}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 cursor-pointer transition group"
                          >
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                              <img
                                src={vid.thumbnailUrl}
                                alt={vid.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-white block truncate">
                                {vid.caption}
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate">
                                @{vid.creator.username} · {vid.musicTrack.title}
                              </span>
                              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 mt-0.5">
                                <span>Watch on TiVo</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested Follow-up Prompt Chips */}
              {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-6 pt-1 max-w-[92%]">
                  {msg.suggestedPrompts.map((promptText, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(promptText.replace(/^[^\w\s]+/, '').trim())}
                      className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-cyan-400/60 text-[10px] font-medium text-neutral-300 hover:text-white transition active:scale-95 text-left"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Thinking / Typing Animation */}
          {isThinking && (
            <div className="flex items-start gap-2 max-w-[88%]">
              <TakoMascot size="xs" isThinking={true} className="mt-1" />
              <div className="p-3 rounded-2xl rounded-bl-none bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-medium text-[11px]">Tako is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* QUICK ACTION BAR */}
        {/* ========================================================================= */}
        <div className="px-3 py-1.5 bg-neutral-900/40 border-t border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { label: '💡 Explain video', query: 'Explain the current video' },
            { label: '🎬 Recommend clips', query: 'Recommend cool motion clips' },
            { label: '✍️ Viral captions', query: 'Give me 3 viral caption ideas' },
            { label: '🌟 10k Checkmark', query: 'How do I get the verified checkmark?' },
            { label: '🔴 Go LIVE', query: 'What are the requirements to broadcast live?' },
            { label: '🎵 Trending sounds', query: 'What are the top trending tracks?' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(item.query)}
              className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-white/40 text-[10px] font-bold text-neutral-300 whitespace-nowrap hover:text-white transition active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* INPUT FORM */}
        {/* ========================================================================= */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-neutral-900/95 border-t border-neutral-800 flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Tako about videos, captions, creators..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 disabled:opacity-40 text-black flex items-center justify-center transition shadow active:scale-90 shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4 fill-black" />
          </button>
        </form>
      </div>
    </div>
  );
};
