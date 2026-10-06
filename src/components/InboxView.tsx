import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Bell, Heart, UserPlus, Gift, Star, Send, ArrowLeft 
} from 'lucide-react';
import { User, Video, Conversation, Message, Notification } from '../types';
import { storage } from '../services/storage';
import { audioEngine } from '../services/audioService';
import { VerifiedBadge } from './VerifiedBadge';

interface InboxViewProps {
  currentUser: User;
  onSelectVideo: (video: Video) => void;
  onSelectCreator: (user: User) => void;
  activeConversationUser?: User | null;
  onClearActiveConversationUser?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  currentUser,
  onSelectVideo,
  onSelectCreator,
  activeConversationUser,
  onClearActiveConversationUser
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>(storage.getConversations());
  const [notifications, setNotifications] = useState<Notification[]>(storage.getNotifications());
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeConversationUser) {
      setActiveTab('messages');
      const convId = `conv-${activeConversationUser.id}`;
      let conv = conversations.find(c => c.participant.id === activeConversationUser.id);
      if (!conv) {
        conv = {
          id: convId,
          participant: activeConversationUser,
          unreadCount: 0,
          updatedAt: 'Just now',
          lastMessage: {
            id: `msg-${Date.now()}`,
            conversationId: convId,
            senderId: currentUser.id,
            receiverId: activeConversationUser.id,
            text: 'Hello!',
            createdAt: 'Just now',
            read: true
          }
        };
      }
      setSelectedConversation(conv);
    }
  }, [activeConversationUser]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(storage.getMessages(selectedConversation.id));
      scrollToBottom();
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!selectedConversation || !inputText.trim()) return;

    audioEngine.playSoundEffect('publish');
    const newMsg = storage.sendMessage(
      selectedConversation.id,
      selectedConversation.participant,
      inputText.trim()
    );

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    scrollToBottom();
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col overflow-hidden pb-16">
      {selectedConversation ? (
        <div className="flex-1 flex flex-col h-full bg-neutral-950">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  if (onClearActiveConversationUser) onClearActiveConversationUser();
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => onSelectCreator(selectedConversation.participant)}
                className="flex items-center gap-2.5 text-left"
              >
                <img
                  src={selectedConversation.participant.avatar}
                  alt={selectedConversation.participant.username}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">
                      {selectedConversation.participant.displayName}
                    </span>
                    <VerifiedBadge 
                      followersCount={selectedConversation.participant.followersCount} 
                      verified={selectedConversation.participant.verified} 
                      size="xs"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    @{selectedConversation.participant.username}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isMine
                        ? 'bg-white text-black font-medium'
                        : 'bg-neutral-900 text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-neutral-500 mt-1 px-1">
                    {msg.createdAt}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-white disabled:bg-neutral-800 text-black rounded-full transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-xl mx-auto w-full">
          {/* Header Selector */}
          <div className="px-4 pt-4 pb-2 bg-black border-b border-neutral-900">
            <h2 className="text-base font-black text-white mb-3">Inbox & Activity</h2>

            <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'messages' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'notifications' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Messages List */}
          {activeTab === 'messages' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-white cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.username}
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {conv.participant.displayName}
                        </span>
                        <VerifiedBadge 
                          followersCount={conv.participant.followersCount} 
                          verified={conv.participant.verified} 
                          size="xs"
                        />
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0">
                    {conv.updatedAt}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Activity / Notifications List */}
          {activeTab === 'notifications' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white">
                      {notif.type === 'gift' ? (
                        <Gift className="w-5 h-5 text-white" />
                      ) : notif.type === 'subscription' ? (
                        <Star className="w-5 h-5 text-white fill-white" />
                      ) : notif.type === 'like' ? (
                        <Heart className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-200">
                        <strong className="text-white mr-1">@{notif.actor.username}</strong>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-500">{notif.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
