import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Upload, FlipHorizontal, Timer, Radio, Users, 
  ArrowLeft, Disc, Play, RefreshCw, X 
} from 'lucide-react';
import { User, Video, MusicTrack } from '../types';
import { storage, DEFAULT_TRACKS, saveVideoBlob } from '../services/storage';
import { audioEngine } from '../services/audioService';

interface CreateViewProps {
  currentUser: User;
  onVideoPublished: (video: Video) => void;
  onCancel: () => void;
  onGoLive?: () => void;
}

type CreateStep = 'capture' | 'edit';
type CameraMode = '15s' | '60s' | 'live';
type TimerDuration = 0 | 3 | 10;

export const CreateView: React.FC<CreateViewProps> = ({
  currentUser,
  onVideoPublished,
  onCancel,
  onGoLive
}) => {
  const [step, setStep] = useState<CreateStep>('capture');
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload'>('camera');
  const [cameraMode, setCameraMode] = useState<CameraMode>('60s');
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Stream & Recording States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Live Stream Broadcast Setup
  const [liveTitle, setLiveTitle] = useState('My First LIVE on TIVO!');
  const [liveCategory, setLiveCategory] = useState('Chat');
  const [showFollowersRequiredModal, setShowFollowersRequiredModal] = useState(false);

  // Editor states
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(DEFAULT_TRACKS[0]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Media Refs
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Stop hardware camera safely
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      mediaStreamRef.current = null;
    }
    if (videoElementRef.current) {
      try {
        videoElementRef.current.srcObject = null;
      } catch {}
    }
    setCameraActive(false);
  }, []);

  // Start camera with safe fallbacks
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraActive(false);
      return;
    }

    const constraintsList: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: { facingMode: { ideal: facingMode } },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream: MediaStream | null = null;
    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch {}
    }

    if (stream) {
      mediaStreamRef.current = stream;
      setCameraActive(true);
      if (videoElementRef.current) {
        videoElementRef.current.muted = true;
        videoElementRef.current.playsInline = true;
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }
    } else {
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (step === 'capture' && captureSource === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, captureSource, facingMode, startCamera, stopCamera]);

  // Connect video element ref
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
    if (el) {
      el.muted = true;
      el.playsInline = true;
      if (mediaStreamRef.current) {
        el.srcObject = mediaStreamRef.current;
        el.play().catch(() => {});
      }
    }
  }, []);

  // Play fallback video if hardware camera unavailable so screen never breaks
  useEffect(() => {
    if (!cameraActive && fallbackVideoRef.current) {
      fallbackVideoRef.current.muted = true;
      fallbackVideoRef.current.playsInline = true;
      fallbackVideoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Recording ticker
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          const maxSecs = cameraMode === '15s' ? 15 : 60;
          if (prev >= maxSecs) {
            handleStopRecording();
            return maxSecs;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, cameraMode]);

  const handleModeChange = (mode: CameraMode) => {
    if (mode === 'live' && (currentUser.followersCount || 0) < 50) {
      setShowFollowersRequiredModal(true);
      return;
    }
    setCameraMode(mode);
    audioEngine.playSoundEffect('tap');
  };

  const handleStartLive = () => {
    if ((currentUser.followersCount || 0) < 50) {
      setShowFollowersRequiredModal(true);
      return;
    }
    audioEngine.playSoundEffect('publish');
    if (onGoLive) {
      onGoLive();
    }
  };

  const handleShutterPress = () => {
    if (cameraMode === 'live') {
      handleStartLive();
      return;
    }

    if (timerDuration > 0 && !isRecording) {
      setCountdown(timerDuration);
      let count = timerDuration;
      audioEngine.playSoundEffect('beep');
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          audioEngine.playSoundEffect('beep');
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          beginRecording();
        }
      }, 1000);
    } else {
      if (isRecording) {
        handleStopRecording();
      } else {
        beginRecording();
      }
    }
  };

  const beginRecording = () => {
    recordedChunksRef.current = [];
    audioEngine.playSoundEffect('tap');

    if (mediaStreamRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        let options: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          options = { mimeType: 'video/webm;codecs=vp9,opus' };
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options = { mimeType: 'video/webm' };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          options = { mimeType: 'video/mp4' };
        }

        const recorder = new MediaRecorder(mediaStreamRef.current, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'video/mp4';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          setVideoBlob(blob);
          setVideoBlobUrl(URL.createObjectURL(blob));
          setStep('edit');
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('MediaRecorder notice, fallback active:', err);
      }
    }

    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    audioEngine.playSoundEffect('pop');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        return;
      } catch {}
    }

    // High quality video clip fallback if hardware recorder not available
    const clipUrl = cameraMode === '15s' ? '/videos/clip_2.mp4' : '/videos/clip_1.mp4';
    setVideoBlobUrl(clipUrl);
    setThumbnailUrl('/videos/thumb_1.jpg');
    setCaption('New video on TIVO #creative #motion');
    setStep('edit');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoBlob(file);
    setVideoBlobUrl(url);
    setThumbnailUrl('/videos/thumb_1.jpg');
    setStep('edit');
  };

  const handlePublish = async () => {
    if (!videoBlobUrl) return;
    setIsPublishing(true);

    const videoId = `vid-${Date.now()}`;
    const hashtags = caption
      .split(' ')
      .filter((w) => w.startsWith('#'))
      .map((w) => w.replace('#', ''));

    if (videoBlob) {
      await saveVideoBlob(videoId, videoBlob);
    }

    // Clean video with 0 fake stats
    const newVideo: Video = {
      id: videoId,
      videoUrl: videoBlobUrl,
      thumbnailUrl: thumbnailUrl || '/videos/thumb_1.jpg',
      caption: caption || 'New visual story on TIVO #motion #video',
      hashtags: hashtags.length > 0 ? hashtags : ['visual', 'motion', 'tivo'],
      creator: currentUser,
      musicTrack: selectedTrack,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      isExclusive
    };

    storage.addVideo(newVideo);
    audioEngine.playSoundEffect('publish');
    setIsPublishing(false);
    onVideoPublished(newVideo);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* TOP CONTROLS */}
      {/* ========================================================================= */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={onCancel}
          className="p-2 text-white rounded-full bg-black/50 backdrop-blur-md hover:bg-neutral-800 transition active:scale-95 shadow"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {step === 'capture' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaptureSource(captureSource === 'camera' ? 'upload' : 'camera')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition border backdrop-blur-md ${
                captureSource === 'upload' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black/50 text-white border-white/20 hover:border-white'
              }`}
            >
              {captureSource === 'upload' ? 'Upload View' : 'Upload File'}
            </button>
          </div>
        )}

        {step === 'edit' && (
          <button
            onClick={() => setStep('capture')}
            className="px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white"
          >
            Retake
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CLEAN CAMERA VIEWPORT */}
      {/* ========================================================================= */}
      {step === 'capture' && (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {captureSource === 'camera' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-neutral-950 overflow-hidden">
              {/* REAL USER WEBCAM VIDEO */}
              <video
                ref={setVideoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* SEAMLESS LIVE FALLBACK FEED IF WEBCAM PERMISSION NOT GRANTED */}
              {!cameraActive && (
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <video
                    ref={fallbackVideoRef}
                    src="/videos/clip_1.mp4"
                    playsInline
                    muted
                    loop
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* COUNTDOWN OVERLAY */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                  <span className="text-8xl font-black text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}

              {/* CAMERA RIGHT SIDEBAR CONTROLS */}
              <div className="absolute right-4 top-16 z-30 flex flex-col items-center gap-3">
                {/* Flip camera */}
                <button
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:border-white transition active:scale-90 shadow-lg"
                  title="Flip camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>

                {/* Shutter timer */}
                <button
                  onClick={() => setTimerDuration((prev) => (prev === 0 ? 3 : prev === 3 ? 10 : 0))}
                  className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center text-white text-[10px] font-bold hover:border-white transition shadow-lg"
                  title="Timer"
                >
                  <Timer className="w-4 h-4 text-white mb-0.5" />
                  <span>{timerDuration === 0 ? 'Off' : `${timerDuration}s`}</span>
                </button>
              </div>

              {/* LIVE Mode Setup Overlay */}
              {cameraMode === 'live' && (
                <div className="absolute inset-x-4 top-16 z-30 p-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl space-y-3 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">LIVE Broadcast Setup</span>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">LIVE Title</label>
                    <input
                      type="text"
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                      placeholder="Add a title to your LIVE..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {['Chat', 'Creative', 'Music', 'Gaming'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setLiveCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                          liveCategory === cat ? 'bg-white text-black shadow' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BOTTOM CONTROLS & SHUTTER */}
              {/* ========================================================================= */}
              <div className="absolute bottom-6 inset-x-0 z-30 flex flex-col items-center gap-3 px-6">
                {cameraMode === 'live' ? (
                  <button
                    onClick={handleStartLive}
                    className="w-full max-w-xs py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest transition shadow-[0_0_30px_rgba(239,68,68,0.6)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Radio className="w-4 h-4 text-white" />
                    <span>Go LIVE Now</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-around max-w-sm">
                    {/* Device Upload */}
                    <label className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer text-white hover:border-white transition shadow-lg active:scale-90">
                      <Upload className="w-5 h-5" />
                      <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {/* Standard Shutter Button */}
                    <button
                      onClick={handleShutterPress}
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
                    >
                      <div
                        className={`transition-all duration-200 ${
                          isRecording 
                            ? 'w-8 h-8 rounded-lg bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                            : 'w-14 h-14 rounded-full bg-red-500 group-hover:scale-105'
                        }`}
                      />
                    </button>

                    {/* Recording Time / Mode Duration */}
                    <div className="w-12 text-center font-mono text-xs font-bold text-white">
                      {isRecording ? `${recordingSeconds}s` : cameraMode}
                    </div>
                  </div>
                )}

                {/* CLEAN MODE SELECTOR: 15s • 60s • LIVE */}
                <div className="flex items-center justify-center gap-6 pt-1 text-xs font-black uppercase tracking-wider select-none">
                  <button
                    type="button"
                    onClick={() => handleModeChange('15s')}
                    className={`transition ${cameraMode === '15s' ? 'text-white scale-110 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('60s')}
                    className={`transition ${cameraMode === '60s' ? 'text-white scale-110 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    60s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('live')}
                    className={`transition flex items-center gap-1 ${cameraMode === 'live' ? 'text-red-500 scale-110 drop-shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>LIVE</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* UPLOAD VIEW */
            <div className="w-full max-w-md p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-neutral-900 border-2 border-dashed border-neutral-700 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-bold text-white">Upload from device</h3>
              <p className="text-xs text-neutral-400">Select MP4, MOV or WebM video file</p>
              <label className="inline-block px-6 py-3 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-200 transition">
                <span>Select Video</span>
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: EDIT & PUBLISH */}
      {/* ========================================================================= */}
      {step === 'edit' && videoBlobUrl && (
        <div className="relative w-full h-full flex flex-col justify-between p-4 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-md mx-auto space-y-4 pt-10 pb-6">
            {/* Captured Preview */}
            <div className="relative w-full aspect-[9/16] max-h-[50vh] mx-auto rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
              <video
                src={videoBlobUrl}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Sound Selection */}
            <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Disc className="w-4 h-4 text-white shrink-0 animate-spin-slow" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{selectedTrack.title}</span>
                  <span className="text-[10px] text-neutral-400">{selectedTrack.artist}</span>
                </div>
              </div>
              <select
                value={selectedTrack.id}
                onChange={(e) => {
                  const trk = DEFAULT_TRACKS.find((t) => t.id === e.target.value);
                  if (trk) setSelectedTrack(trk);
                }}
                className="bg-neutral-800 text-white text-xs rounded-xl px-2 py-1 border border-neutral-700 focus:outline-none"
              >
                {DEFAULT_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Caption & #Hashtags
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a captivating story #motion #design #viral..."
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
              />
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-3.5 rounded-full bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isPublishing ? 'Publishing to TIVO...' : 'Publish Video'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP: 50 FOLLOWERS REQUIRED FOR LIVE */}
      {/* ========================================================================= */}
      {showFollowersRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Radio className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Live Streaming Requirement</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Sorry, you need to post more and get 50 followers to broadcast LIVE.
              </p>
            </div>

            <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Your Current Followers</span>
              <span className="font-bold text-white font-mono">
                {(currentUser.followersCount || 0).toLocaleString()} / 50
              </span>
            </div>

            <button
              onClick={() => setShowFollowersRequiredModal(false)}
              className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
