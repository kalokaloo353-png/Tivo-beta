import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Shield, Check, AlertCircle, Coins, Users, Key, Sparkles, 
  Search, ArrowRight, RefreshCw, CheckCircle2, UserCheck, Database
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';
import { findUserInFirestore, updateUserInFirestore } from '../services/firebase';
import { audioEngine } from '../services/audioService';
import { VerifiedBadge } from './VerifiedBadge';

interface TiviPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
  onToast?: (msg: string) => void;
}

export const TiviPanelModal: React.FC<TiviPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
  onToast
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // User Lookup & Management state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User>(currentUser);
  const [usernameInput, setUsernameInput] = useState('');
  const [isSearchingFirebase, setIsSearchingFirebase] = useState(false);
  const [firebaseSearchStatus, setFirebaseSearchStatus] = useState<string | null>(null);

  // Grant values
  const [coinsAmount, setCoinsAmount] = useState<number>(10000);
  const [followersAmount, setFollowersAmount] = useState<number>(50);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [topupExpired, setTopupExpired] = useState<boolean>(() => storage.isTopupExpired());

  useEffect(() => {
    if (isOpen) {
      const users = storage.getUsers();
      setAllUsers(users);
      setSelectedUser(currentUser);
      setUsernameInput(currentUser.username);
      setTopupExpired(storage.isTopupExpired());
    } else {
      setIsAuthenticated(false);
      setPasswordInput('');
      setPasswordError(false);
      setActionSuccessMessage(null);
      setFirebaseSearchStatus(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'tivi.panel') {
      setIsAuthenticated(true);
      setPasswordError(false);
      audioEngine.playSoundEffect('publish');
    } else {
      setPasswordError(true);
      audioEngine.playSoundEffect('beep');
    }
  };

  // Find username in Firebase Firestore & local storage
  const handleFindUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = usernameInput.trim().toLowerCase().replace(/^@/, '');
    if (!query) return;

    setIsSearchingFirebase(true);
    setFirebaseSearchStatus('Searching Firebase Firestore...');
    setActionSuccessMessage(null);

    try {
      // 1. Check local storage first
      const users = storage.getUsers();
      const current = storage.getCurrentUser();
      let found: User | undefined = users.find(
        (u) => u.username.toLowerCase() === query || u.id === query || u.email?.toLowerCase() === query
      );

      if (!found && (current.username.toLowerCase() === query || current.id === query || current.email?.toLowerCase() === query)) {
        found = current;
      }

      // 2. Query Firebase Firestore for real-time remote user
      const firestoreUser = await findUserInFirestore(query);
      if (firestoreUser) {
        found = {
          ...found,
          ...firestoreUser
        };
        // Merge into local list
        const updatedUsers = users.map(u => u.id === firestoreUser.id ? { ...u, ...firestoreUser } : u);
        if (!updatedUsers.some(u => u.id === firestoreUser.id)) {
          updatedUsers.unshift(firestoreUser);
        }
        storage.saveUsers(updatedUsers);
        setAllUsers(updatedUsers);
      }

      if (found) {
        setSelectedUser(found);
        setFirebaseSearchStatus(firestoreUser ? 'User verified & synced from Firebase Firestore' : 'User found in local registry');
        audioEngine.playSoundEffect('pop');
      } else {
        setFirebaseSearchStatus(`No user found with username "@${query}".`);
        audioEngine.playSoundEffect('beep');
      }
    } catch (err) {
      console.warn('Find user error:', err);
      setFirebaseSearchStatus('Search completed.');
    } finally {
      setIsSearchingFirebase(false);
    }
  };

  const refreshStateWithUser = (updated: User) => {
    setSelectedUser(updated);
    const users = storage.getUsers();
    setAllUsers(users.map(u => u.id === updated.id ? updated : u));

    if (updated.id === currentUser.id || updated.username.toLowerCase() === currentUser.username.toLowerCase()) {
      storage.saveCurrentUser(updated);
      onUpdateCurrentUser(updated);
    }
  };

  const handleGrantCoins = async (amount: number) => {
    const result = storage.grantCoinsToUser(selectedUser.id, amount);
    if (result.success && result.user) {
      // Sync to Firebase Firestore
      await updateUserInFirestore(result.user.id, { coins: result.user.coins });
      refreshStateWithUser(result.user);
      audioEngine.playSoundEffect('pop');
      const msg = `Successfully granted +${amount.toLocaleString()} coins to @${result.user.username}!`;
      setActionSuccessMessage(msg);
      if (onToast) onToast(msg);
    }
  };

  const handleGrantFollowers = async (amount: number) => {
    const result = storage.grantFollowersToUser(selectedUser.id, amount);
    if (result.success && result.user) {
      // Sync to Firebase Firestore
      await updateUserInFirestore(result.user.id, { 
        followersCount: result.user.followersCount,
        verified: result.user.followersCount >= 10000 ? true : result.user.verified
      });
      refreshStateWithUser(result.user);
      audioEngine.playSoundEffect('publish');
      const msg = `Successfully granted +${amount.toLocaleString()} followers to @${result.user.username}!`;
      setActionSuccessMessage(msg);
      if (onToast) onToast(msg);
    }
  };

  const handleSetExactFollowersForLive = () => {
    const currentCount = selectedUser.followersCount || 0;
    const diff = Math.max(0, 10000 - currentCount);
    const toAdd = diff > 0 ? diff : 10000;
    handleGrantFollowers(toAdd);
  };

  const handleToggleTopupExpiry = () => {
    if (topupExpired) {
      storage.resetTopupTimer();
      setTopupExpired(false);
      if (onToast) onToast('5-Day Free Topup offer has been reset to ACTIVE!');
    } else {
      storage.expireTopupTimer();
      setTopupExpired(true);
      if (onToast) onToast('5-Day Free Topup offer is now EXPIRED (Price is Unavailable)!');
    }
    audioEngine.playSoundEffect('tap');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black shadow-md">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Tivi Management Panel</h3>
              <p className="text-[10px] text-neutral-400">Firebase Firestore & Creator Tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PASSWORD AUTHENTICATION SCREEN (NO VISIBLE TEXT OF PASSWORD) */}
        {!isAuthenticated ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-300 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Protected Administrator Console</h4>
              <p className="text-xs text-neutral-400">
                Please enter your administrator password to unlock the coins and followers management panel.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter administrator password"
                  className={`w-full px-4 py-3 rounded-2xl bg-neutral-900 border text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition ${
                    passwordError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-neutral-800 focus:border-white focus:ring-white'
                  }`}
                  autoFocus
                />
                <Key className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
              {passwordError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 pt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Incorrect administrator password. Please try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Unlock Management Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* UNLOCKED MANAGEMENT PANEL */
          <div className="space-y-5">
            {/* SUCCESS BANNER */}
            {actionSuccessMessage && (
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="font-medium">{actionSuccessMessage}</span>
                </div>
                <button 
                  onClick={() => setActionSuccessMessage(null)}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* USERNAME LOOKUP IN FIREBASE */}
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Find User in Firebase
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {allUsers.length} local accounts
                </span>
              </div>

              <form onSubmit={handleFindUser} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter username (e.g. jacob.dev, young.developer)"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingFirebase || !usernameInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  {isSearchingFirebase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Find User</span>
                </button>
              </form>

              {firebaseSearchStatus && (
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{firebaseSearchStatus}</span>
                </p>
              )}
            </div>

            {/* SELECTED TARGET USER CARD */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <VerifiedBadge 
                    followersCount={selectedUser.followersCount} 
                    verified={selectedUser.verified}
                    size="sm"
                    className="absolute -bottom-1 -right-1"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{selectedUser.displayName}</span>
                    <VerifiedBadge 
                      followersCount={selectedUser.followersCount} 
                      verified={selectedUser.verified}
                      size="xs"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 block font-mono">@{selectedUser.username}</span>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-300">
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Coins className="w-3 h-3 text-amber-400" />
                      {selectedUser.coins.toLocaleString()} Coins
                    </span>
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Users className="w-3 h-3 text-sky-400" />
                      {selectedUser.followersCount.toLocaleString()} Followers
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.id === currentUser.id && (
                <span className="px-2 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold border border-white/20">
                  You
                </span>
              )}
            </div>

            {/* QUICK ACCOUNTS SELECTOR */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Quick Select Accounts
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {allUsers.slice(0, 8).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setUsernameInput(u.username);
                      setActionSuccessMessage(null);
                      setFirebaseSearchStatus(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition ${
                      selectedUser.id === u.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <img src={u.avatar} alt={u.username} className="w-4 h-4 rounded-full object-cover" />
                    <span>@{u.username}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION 1: GIVE COINS */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white">Grant Coins to @{selectedUser.username}</span>
                </div>
                <span className="text-xs font-black text-white font-mono">
                  {(selectedUser.coins || 0).toLocaleString()} Coins
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1000, 10000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleGrantCoins(amt)}
                    className="py-2 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xs border border-neutral-700 hover:border-white transition active:scale-95 flex flex-col items-center"
                  >
                    <span>+{amt >= 1000 ? `${(amt / 1000)}k` : amt}</span>
                    <span className="text-[9px] text-neutral-400 font-normal">Coins</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white"
                  placeholder="Custom coins"
                />
                <button
                  onClick={() => handleGrantCoins(coinsAmount)}
                  className="py-2 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shrink-0 active:scale-95"
                >
                  Grant Custom
                </button>
              </div>
            </div>

            {/* ACTION 2: GIVE FOLLOWERS */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white">Grant Followers to @{selectedUser.username}</span>
                </div>
                <span className="text-xs font-black text-white font-mono">
                  {(selectedUser.followersCount || 0).toLocaleString()} Followers
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleGrantFollowers(amt)}
                    className="py-2 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xs border border-neutral-700 hover:border-white transition active:scale-95 flex flex-col items-center"
                  >
                    <span>+{amt.toLocaleString()}</span>
                    <span className="text-[9px] text-neutral-400 font-normal">Followers</span>
                  </button>
                ))}
              </div>

              {/* Set Exactly 10,000 Followers Milestone Button */}
              <button
                onClick={handleSetExactFollowersForLive}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-950 via-neutral-900 to-blue-950 border border-cyan-700/60 hover:border-cyan-400 text-cyan-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
              >
                <VerifiedBadge followersCount={10000} verified size="xs" />
                <span>Grant 10,000 Followers & Unlock Verified Checkmark</span>
              </button>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={followersAmount}
                  onChange={(e) => setFollowersAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white"
                  placeholder="Custom followers"
                />
                <button
                  onClick={() => handleGrantFollowers(followersAmount)}
                  className="py-2 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shrink-0 active:scale-95"
                >
                  Grant Custom
                </button>
              </div>
            </div>

            {/* 5-DAY PROMOTIONAL TIMER CONTROLLER */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">5-Day Free Topup Promo</span>
                <span className="text-[11px] text-neutral-400">
                  Status: <strong className={topupExpired ? 'text-red-400' : 'text-emerald-400'}>
                    {topupExpired ? 'Expired (Price Unavailable)' : 'Active (Free Topup Available)'}
                  </strong>
                </span>
              </div>
              <button
                onClick={handleToggleTopupExpiry}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  topupExpired 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black' 
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {topupExpired ? 'Reset to Active' : 'Expire Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
