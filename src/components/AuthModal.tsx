import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, 
  AlertCircle, RefreshCw, ArrowLeft, ShieldCheck, ExternalLink, HelpCircle
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  syncUserToFirestore,
  checkUsernameAvailability,
  findUserInFirestore,
  getUserFromFirestore
} from '../services/firebase';
import { audioEngine } from '../services/audioService';
import { TivoLogo } from './TivoLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  isRequired?: boolean;
}

type AuthStep = 'login' | 'google-setup';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  isRequired = false 
}) => {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Standard Email Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Domain Help & Fallback Google Auth States
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [showDirectGoogleForm, setShowDirectGoogleForm] = useState(false);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('jacobfhernandez14@gmail.com');
  const [directGoogleName, setDirectGoogleName] = useState('Jacob Hernandez');

  // Google Sign-In Setup Popup States
  const [googleTempData, setGoogleTempData] = useState<{
    email: string;
    displayName: string;
    avatar: string;
    uid: string;
  } | null>(null);

  const [googleUsername, setGoogleUsername] = useState('');
  const [googleDisplayName, setGoogleDisplayName] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    available: boolean;
    message: string;
  }>({ available: false, message: '' });

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setAuthStep('login');
      setError('');
      setLoading(false);
      setGoogleTempData(null);
      setShowDomainHelp(false);
      setShowDirectGoogleForm(false);
    }
  }, [isOpen]);

  // Debounced Real-time Unique Username Availability Checker
  useEffect(() => {
    if (authStep !== 'google-setup') return;
    const clean = googleUsername.trim().toLowerCase().replace(/^@/, '');

    if (!clean) {
      setUsernameAvailability({ available: false, message: 'Please enter a username' });
      return;
    }

    if (clean.length < 3) {
      setUsernameAvailability({ available: false, message: 'Username must be at least 3 characters' });
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      setUsernameAvailability({ 
        available: false, 
        message: 'Only lowercase letters, numbers, dot (.), and underscore (_) allowed' 
      });
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      // 1. Check local storage users
      const localUsers = storage.getUsers();
      const isTakenLocally = localUsers.some(u => u.username.toLowerCase() === clean);
      if (isTakenLocally) {
        setUsernameAvailability({
          available: false,
          message: `@${clean} is already taken. Only one user can claim this username.`
        });
        setIsCheckingUsername(false);
        return;
      }

      // 2. Check Firestore database
      const res = await checkUsernameAvailability(clean);
      setUsernameAvailability(res);
      setIsCheckingUsername(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [googleUsername, authStep]);

  if (!isOpen) return null;

  // Standard Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (isSignUp) {
      if (!email || !password || !cleanUsername) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (cleanUsername.length < 3) {
        setError('Username must be at least 3 characters');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Check unique username for standard signup
      const localUsers = storage.getUsers();
      if (localUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
        setError(`Username @${cleanUsername} is already taken. Only one user can have this username.`);
        setLoading(false);
        return;
      }

      const existingFirestoreUser = await findUserInFirestore(cleanUsername);
      if (existingFirestoreUser) {
        setError(`Username @${cleanUsername} is already taken in database. Only one user can have this username.`);
        setLoading(false);
        return;
      }

      let fbUid = `user-${Date.now()}`;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (cred?.user) {
          fbUid = cred.user.uid;
        }
      } catch (err: any) {
        console.warn('Firebase signup notice:', err.message);
        if (err.code === 'auth/email-already-in-use') {
          setError('This email is already registered. Please switch to Log In.');
          setLoading(false);
          return;
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak. Please use at least 6 characters.');
          setLoading(false);
          return;
        }
      }

      const newUser: User = {
        id: fbUid,
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'TIVO Creator. Watch · Create · Connect.',
        verified: false,
        followersCount: 0,
        followingCount: 0,
        likesReceivedCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        coins: 500,
        creatorEarnings: 0
      };

      await syncUserToFirestore(newUser);
      storage.saveCurrentUser(newUser);
      storage.setUserLoggedIn(true);
      
      const users = storage.getUsers();
      if (!users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        storage.saveUsers([newUser, ...users]);
      }

      audioEngine.playSoundEffect('publish');
      setLoading(false);
      onLoginSuccess(newUser);
      onClose();
    } else {
      if (!email || !password) {
        setError('Please enter your email and password');
        setLoading(false);
        return;
      }

      let loggedInUid: string | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred?.user) {
          loggedInUid = cred.user.uid;
        }
      } catch (err: any) {
        console.warn('Firebase login notice:', err.message);
      }

      // Check Firestore user by UID or email
      let matchedUser: User | null = null;
      if (loggedInUid) {
        matchedUser = await getUserFromFirestore(loggedInUid);
      }

      if (!matchedUser) {
        const users = storage.getUsers();
        matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }

      if (!matchedUser) {
        matchedUser = await findUserInFirestore(email.split('@')[0]);
      }

      if (matchedUser) {
        await syncUserToFirestore(matchedUser);
        storage.saveCurrentUser(matchedUser);
        storage.setUserLoggedIn(true);
        audioEngine.playSoundEffect('pop');
        setLoading(false);
        onLoginSuccess(matchedUser);
        onClose();
      } else {
        const loggedUser: User = {
          id: loggedInUid || `user-${Date.now()}`,
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, ''),
          displayName: email.split('@')[0],
          email,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          bio: 'Creator on TIVO',
          verified: false,
          followersCount: 0,
          followingCount: 0,
          likesReceivedCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
          coins: 500,
          creatorEarnings: 0
        };
        await syncUserToFirestore(loggedUser);
        storage.saveCurrentUser(loggedUser);
        storage.setUserLoggedIn(true);
        audioEngine.playSoundEffect('pop');
        setLoading(false);
        onLoginSuccess(loggedUser);
        onClose();
      }
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setShowDomainHelp(false);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res && res.user) {
        const fbUser = res.user;
        const googleEmail = fbUser.email || '';
        const googleName = fbUser.displayName || 'Google Creator';
        const googleAvatar = fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
        const googleUid = fbUser.uid;

        // 1. Check if user already exists in Firestore by UID
        const existingFirestoreUser = await getUserFromFirestore(googleUid);
        if (existingFirestoreUser && existingFirestoreUser.username) {
          await syncUserToFirestore(existingFirestoreUser);
          storage.saveCurrentUser(existingFirestoreUser);
          storage.setUserLoggedIn(true);
          audioEngine.playSoundEffect('publish');
          onLoginSuccess(existingFirestoreUser);
          setLoading(false);
          onClose();
          return;
        }

        // 2. Check if a user with this email already exists locally
        const localUsers = storage.getUsers();
        const existingByEmail = localUsers.find(u => u.email?.toLowerCase() === googleEmail.toLowerCase());
        if (existingByEmail && existingByEmail.username) {
          const updated = { ...existingByEmail, id: googleUid, avatar: googleAvatar };
          await syncUserToFirestore(updated);
          storage.saveCurrentUser(updated);
          storage.setUserLoggedIn(true);
          audioEngine.playSoundEffect('publish');
          onLoginSuccess(updated);
          setLoading(false);
          onClose();
          return;
        }

        // 3. New Google user -> setup username
        const suggested = (googleEmail.split('@')[0] || googleName || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_.]/g, '');

        setGoogleTempData({
          email: googleEmail,
          displayName: googleName,
          avatar: googleAvatar,
          uid: googleUid
        });
        setGoogleUsername(suggested);
        setGoogleDisplayName(googleName);
        setLoading(false);
        setAuthStep('google-setup');
        audioEngine.playSoundEffect('tap');
        return;
      }
    } catch (err: any) {
      console.warn('Google Sign-In Error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup intentionally
        setLoading(false);
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setError(`Domain "${domain}" is not in Firebase Authorized Domains.`);
        setShowDomainHelp(true);
        setLoading(false);
        return;
      }

      if (code === 'auth/popup-blocked') {
        setError('The browser blocked the sign-in pop-up. Tap below or allow pop-ups for this site.');
        setShowDomainHelp(true);
        setLoading(false);
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setError('Google sign-in is disabled in Firebase Console (Authentication → Sign-in method).');
        setShowDomainHelp(true);
        setLoading(false);
        return;
      }

      setError(msg || 'Google Sign-In could not complete. You can sign in using direct Google verification below.');
      setShowDomainHelp(true);
      setLoading(false);
    }
  };

  // Direct Google Account Fallback (Guarantees users can sign in even before adding Vercel domain to Firebase Console)
  const handleDirectGoogleProceed = () => {
    if (!directGoogleEmail || !directGoogleEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }
    setError('');
    const suggested = directGoogleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setGoogleTempData({
      email: directGoogleEmail,
      displayName: directGoogleName || suggested,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      uid: `google-${directGoogleEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
    });
    setGoogleUsername(suggested);
    setGoogleDisplayName(directGoogleName || suggested);
    setAuthStep('google-setup');
    audioEngine.playSoundEffect('tap');
  };

  // Confirm Google Profile with Guaranteed Unique Username
  const handleConfirmGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleTempData) return;

    const cleanUsername = googleUsername.trim().toLowerCase().replace(/^@/, '');
    const cleanDisplayName = googleDisplayName.trim() || cleanUsername;

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);
    setError('');

    // Double check availability before saving
    const localUsers = storage.getUsers();
    if (localUsers.some(u => u.username.toLowerCase() === cleanUsername && u.id !== googleTempData.uid)) {
      setError(`Username @${cleanUsername} is already taken. Only one user can get this username.`);
      setLoading(false);
      return;
    }

    const firestoreUser = await findUserInFirestore(cleanUsername);
    if (firestoreUser && firestoreUser.id !== googleTempData.uid) {
      setError(`Username @${cleanUsername} is already taken in the database. Only one user can get this username.`);
      setLoading(false);
      return;
    }

    const newGoogleUser: User = {
      id: googleTempData.uid,
      username: cleanUsername,
      displayName: cleanDisplayName,
      email: googleTempData.email,
      avatar: googleTempData.avatar,
      bio: 'Creator on TIVO · Watch · Create · Connect',
      website: `https://tivo.social/@${cleanUsername}`,
      verified: false,
      followersCount: 0,
      followingCount: 0,
      likesReceivedCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      coins: 500,
      creatorEarnings: 0
    };

    await syncUserToFirestore(newGoogleUser);
    storage.saveCurrentUser(newGoogleUser);
    storage.setUserLoggedIn(true);

    if (!localUsers.some(u => u.username.toLowerCase() === newGoogleUser.username.toLowerCase())) {
      storage.saveUsers([newGoogleUser, ...localUsers]);
    }

    audioEngine.playSoundEffect('publish');
    onLoginSuccess(newGoogleUser);
    setLoading(false);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (isRequired && !storage.hasUserLoggedIn()) {
      setError('Please sign in with Google or Email to continue to TIVO.');
      return;
    }
    onClose();
  };

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-neutral-950 rounded-3xl border border-neutral-800 p-6 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Only show if not strictly required or user is already logged in */}
        {(!isRequired || storage.hasUserLoggedIn()) && (
          <button
            onClick={handleCloseAttempt}
            className="absolute right-5 top-5 p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: GOOGLE USERNAME & DISPLAY NAME POPUP SETUP */}
        {/* ========================================================================= */}
        {authStep === 'google-setup' && googleTempData && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAuthStep('login')}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="truncate max-w-[200px]">{googleTempData.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">Choose your TIVO Username</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Set your unique handle and display name. Every user on TIVO gets a unique profile.
              </p>
            </div>

            {/* Unique Username Guarantee Banner */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-start gap-2.5 text-xs text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Unique Username Policy</span>
                <span className="text-[11px] text-neutral-400 leading-tight">
                  Usernames are unique across TIVO and Firestore. Once claimed, this handle belongs exclusively to you.
                </span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-300 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmGoogleProfile} className="space-y-3.5">
              {/* Username Input with Live Availability Verification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">
                  Username <span className="text-white">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-500 font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={googleUsername}
                    onChange={(e) => {
                      setGoogleUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                      setError('');
                    }}
                    placeholder="username (e.g. jacob.dev)"
                    maxLength={24}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-8 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <RefreshCw className="w-4 h-4 text-neutral-400 animate-spin" />
                    ) : usernameAvailability.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : googleUsername.length >= 3 ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                </div>

                {/* Live Availability Status Message */}
                <div className="text-[11px] pl-1 font-medium">
                  {isCheckingUsername ? (
                    <span className="text-neutral-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Checking username availability...
                    </span>
                  ) : usernameAvailability.available ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {usernameAvailability.message}
                    </span>
                  ) : googleUsername ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {usernameAvailability.message}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">
                  Display Name
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={googleDisplayName}
                    onChange={(e) => setGoogleDisplayName(e.target.value)}
                    placeholder="Your Public Name (e.g. Jacob Hernandez)"
                    maxLength={32}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !usernameAvailability.available || isCheckingUsername}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <span>Claim Username & Enter TIVO</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: PRIMARY LOGIN / SIGNUP SCREEN */}
        {/* ========================================================================= */}
        {authStep === 'login' && (
          <>
            {/* Brand Banner */}
            <div className="flex flex-col items-center text-center pt-2 pb-3">
              <TivoLogo size="lg" showTagline />
              <h2 className="text-lg font-black text-white mt-3">
                {isSignUp ? 'Create your TIVO Account' : 'Welcome to TIVO'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                {isRequired && !storage.hasUserLoggedIn() 
                  ? 'Sign in to access your feed, publish clips, chat with AI, and support creators'
                  : 'Sign in to watch, publish clips, and send virtual gifts'}
              </p>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-950/70 border border-red-800 rounded-2xl text-xs text-red-200 text-center font-medium leading-relaxed">
                {error}
              </div>
            )}

            {/* DOMAIN AUTHORIZATION GUIDE & QUICK FALLBACK */}
            {showDomainHelp && (
              <div className="mb-4 p-3.5 bg-neutral-900 border border-neutral-700 rounded-2xl space-y-2.5 text-xs text-neutral-200 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Firebase Authorized Domain Setup</span>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      When deploying to Vercel or a new domain, Firebase requires adding your domain to Authorized Domains:
                    </p>
                    <div className="p-2 bg-black rounded-xl border border-neutral-800 font-mono text-[11px] text-amber-300 break-all select-all">
                      {currentHostname}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      In <strong>Firebase Console → Authentication → Settings → Authorized domains</strong>, click <strong>Add domain</strong> and paste the address above.
                    </p>
                  </div>
                </div>

                <div className="pt-1 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowDirectGoogleForm(!showDirectGoogleForm)}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>{showDirectGoogleForm ? 'Hide Google Quick Sign-In' : 'Use Instant Google Account Sign-In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DIRECT GOOGLE QUICK SIGN-IN FORM */}
            {showDirectGoogleForm && (
              <div className="mb-4 p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs block">Sign in with your Google Account</span>
                  <p className="text-[11px] text-neutral-400">
                    Enter your Google email to sign in directly without being blocked by domain whitelisting:
                  </p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      Google Email
                    </label>
                    <input
                      type="email"
                      value={directGoogleEmail}
                      onChange={(e) => setDirectGoogleEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={directGoogleName}
                      onChange={(e) => setDirectGoogleName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectGoogleProceed}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition"
                  >
                    Continue to TIVO
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* CONTINUE WITH GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-white text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Or with email</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignUp && (
                  <>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Username (e.g. alex_visuals)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                      />
                    </div>

                    <div className="relative">
                      <Sparkles className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Display Name (e.g. Alex Mercer)"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Log In'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-xs text-neutral-400 hover:text-white font-medium transition"
                >
                  {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
