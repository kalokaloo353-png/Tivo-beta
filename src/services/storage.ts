import { User, Video, Comment, Conversation, Notification, MusicTrack, Message, Gift, LiveStream, GiftEvent } from '../types';

// IndexedDB Helper for video blob persistence
const DB_NAME = 'TIVO_MEDIA_DB_V4';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject('IndexedDB not supported');
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, blob, createdAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB', err);
  }
}

export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.blob : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Virtual Gifts Catalog (High-tech vector badges, no emojis)
export const GIFTS_CATALOG: Gift[] = [
  { id: 'gift-rose', name: 'Crystal Rose', icon: 'crystal-rose', coins: 1 },
  { id: 'gift-heart', name: 'Hyper Heart', icon: 'hyper-heart', coins: 5 },
  { id: 'gift-fire', name: 'Plasma Flame', icon: 'plasma-flame', coins: 15 },
  { id: 'gift-magic-wand', name: 'Star Wand', icon: 'magic-wand', coins: 20 },
  { id: 'gift-diamond', name: 'Quantum Diamond', icon: 'quantum-diamond', coins: 50 },
  { id: 'gift-rainbow-heart', name: 'Prism Heart', icon: 'rainbow-heart', coins: 75 },
  { id: 'gift-cyber-car', name: 'Cyber Supercar', icon: 'cyber-supercar', coins: 100 },
  { id: 'gift-dragon', name: 'Neon Dragon', icon: 'neon-dragon', coins: 250 },
  { id: 'gift-laser-sword', name: 'Cyber Katana', icon: 'laser-sword', coins: 300 },
  { id: 'gift-trophy', name: 'Platinum Trophy', icon: 'platinum-trophy', coins: 500 },
  { id: 'gift-phoenix', name: 'Phoenix Wings', icon: 'phoenix-wings', coins: 1000 },
  { id: 'gift-castle', name: 'Diamond Castle', icon: 'diamond-castle', coins: 1500 },
  { id: 'gift-rocket', name: 'Cosmic Rocket', icon: 'cosmic-rocket', coins: 2500 },
  { id: 'gift-crown', name: 'Celestial Crown', icon: 'celestial-crown', coins: 5000 },
  { id: 'gift-meteor', name: 'Meteor Shower', icon: 'meteor-shower', coins: 7500 },
  { id: 'gift-lion', name: 'Gold Lion King', icon: 'gold-lion', coins: 10000 },
  { id: 'gift-black-hole', name: 'Quantum Singularity', icon: 'black-hole', coins: 15000 },
  { id: 'gift-galaxy', name: 'Galaxy Planet', icon: 'galaxy-planet', coins: 25000 },
  { id: 'gift-portal', name: 'Interstellar Portal', icon: 'interstellar-portal', coins: 50000 },
  { id: 'gift-universe', name: 'Multiverse Matrix', icon: 'multiverse-matrix', coins: 75000 },
  { id: 'gift-100k', name: 'Cosmic Supernova', icon: 'cosmic-supernova', coins: 100000 }
];

// Default Music Tracks
export const DEFAULT_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Monochrome Beat',
    artist: 'TIVO Sound Studio',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    duration: 38,
    usesCount: 84200
  },
  {
    id: 'track-2',
    title: 'Minimalist Wave',
    artist: 'VØID ARCHIVE',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    duration: 45,
    usesCount: 128900
  },
  {
    id: 'track-3',
    title: 'Midnight Lo-Fi',
    artist: 'Aura Beats',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
    duration: 32,
    usesCount: 92100
  },
  {
    id: 'track-4',
    title: 'Sub Bass Flow',
    artist: 'Architect',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
    duration: 30,
    usesCount: 188400
  }
];

// Fake Creator Accounts with Random Realistic Names
export const DEFAULT_USERS: User[] = [
  {
    id: 'user-kai',
    username: 'kai_motion',
    displayName: 'Kai Tanaka',
    email: 'kai.motion@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Visual motion & kinetic design. Tokyo ',
    website: 'https://tivo.social/@kai_motion',
    verified: true,
    followersCount: 14200,
    followingCount: 65,
    likesReceivedCount: 420000,
    createdAt: '2022-04-15',
    isFollowing: true,
    coins: 4500,
    creatorEarnings: 1250.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-elena',
    username: 'elena.moves',
    displayName: 'Elena Rostova',
    email: 'elena.moves@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: 'Street choreography & freestyle beats ',
    website: 'https://tivo.social/@elena.moves',
    verified: true,
    followersCount: 28900,
    followingCount: 110,
    likesReceivedCount: 890000,
    createdAt: '2021-11-20',
    isFollowing: true,
    coins: 6200,
    creatorEarnings: 3120.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-marcus',
    username: 'marcus_flow',
    displayName: 'Marcus Vance',
    email: 'marcus.flow@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Urban runner & high-frame athlete. Gravity is optional.',
    website: 'https://tivo.social/@marcus_flow',
    verified: true,
    followersCount: 19400,
    followingCount: 84,
    likesReceivedCount: 510000,
    createdAt: '2022-01-10',
    isFollowing: false,
    coins: 3100,
    creatorEarnings: 1840.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-chloe',
    username: 'chloe.aesthetic',
    displayName: 'Chloe Dubois',
    email: 'chloe.aesthetic@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    bio: 'Minimalist cinema & architectural shadows ',
    website: 'https://tivo.social/@chloe.aesthetic',
    verified: true,
    followersCount: 35100,
    followingCount: 142,
    likesReceivedCount: 1200000,
    createdAt: '2021-08-04',
    isFollowing: true,
    coins: 8400,
    creatorEarnings: 4200.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-zane',
    username: 'zane.audio',
    displayName: 'Zane Sterling',
    email: 'zane.audio@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    bio: 'Sub-bass modular synthesis & night waves.',
    website: 'https://tivo.social/@zane.audio',
    verified: true,
    followersCount: 16800,
    followingCount: 92,
    likesReceivedCount: 380000,
    createdAt: '2022-06-18',
    isFollowing: false,
    coins: 2900,
    creatorEarnings: 1460.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-maya',
    username: 'maya.craft',
    displayName: 'Maya Lin',
    email: 'maya.craft@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: 'Generative art & optical illusions.',
    website: 'https://tivo.social/@maya.craft',
    verified: true,
    followersCount: 22400,
    followingCount: 104,
    likesReceivedCount: 670000,
    createdAt: '2021-12-12',
    isFollowing: true,
    coins: 5100,
    creatorEarnings: 2890.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-talia',
    username: 'talia.beats',
    displayName: 'Talia Brooks',
    email: 'talia.beats@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&auto=format&fit=crop&q=80',
    bio: 'Late night lo-fi & ambient studio sessions.',
    website: 'https://tivo.social/@talia.beats',
    verified: true,
    followersCount: 18200,
    followingCount: 76,
    likesReceivedCount: 440000,
    createdAt: '2022-03-01',
    isFollowing: false,
    coins: 3800,
    creatorEarnings: 1980.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-leo',
    username: 'leo.flow',
    displayName: 'Leo Silva',
    email: 'leo.flow@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bio: 'Parkour movement & cinematic stunts.',
    website: 'https://tivo.social/@leo.flow',
    verified: true,
    followersCount: 31000,
    followingCount: 130,
    likesReceivedCount: 920000,
    createdAt: '2021-09-14',
    isFollowing: true,
    coins: 7400,
    creatorEarnings: 3820.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-sasha',
    username: 'sasha.noir',
    displayName: 'Sasha Novak',
    email: 'sasha.noir@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    bio: 'Pure monochrome photography & studio drops ',
    website: 'https://tivo.social/@sasha.noir',
    verified: true,
    followersCount: 24700,
    followingCount: 95,
    likesReceivedCount: 710000,
    createdAt: '2022-02-17',
    isFollowing: false,
    coins: 4900,
    creatorEarnings: 2450.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-kenji',
    username: 'kenji.drift',
    displayName: 'Kenji Sato',
    email: 'kenji.drift@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Midnight Tokyo neon & light speed trails.',
    website: 'https://tivo.social/@kenji.drift',
    verified: true,
    followersCount: 27500,
    followingCount: 118,
    likesReceivedCount: 830000,
    createdAt: '2021-10-09',
    isFollowing: true,
    coins: 6100,
    creatorEarnings: 3100.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-amara',
    username: 'amara.vibes',
    displayName: 'Amara Diallo',
    email: 'amara.vibes@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
    bio: 'Acoustic chords & lyrical storytelling.',
    website: 'https://tivo.social/@amara.vibes',
    verified: true,
    followersCount: 15900,
    followingCount: 82,
    likesReceivedCount: 390000,
    createdAt: '2022-05-11',
    isFollowing: false,
    coins: 3400,
    creatorEarnings: 1620.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-nico',
    username: 'nico.fx',
    displayName: 'Nico Fontaine',
    email: 'nico.fx@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    bio: 'Visual experiments & mind bends.',
    website: 'https://tivo.social/@nico.fx',
    verified: true,
    followersCount: 20400,
    followingCount: 89,
    likesReceivedCount: 580000,
    createdAt: '2022-01-29',
    isFollowing: false,
    coins: 4300,
    creatorEarnings: 2150.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-riley',
    username: 'riley.records',
    displayName: 'Riley Quinn',
    email: 'riley.records@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=80',
    bio: 'Vinyl collector & tape loop master.',
    website: 'https://tivo.social/@riley.records',
    verified: true,
    followersCount: 13800,
    followingCount: 68,
    likesReceivedCount: 310000,
    createdAt: '2022-07-02',
    isFollowing: false,
    coins: 2700,
    creatorEarnings: 1350.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-jordan',
    username: 'jordan.pulse',
    displayName: 'Jordan Hayes',
    email: 'jordan.pulse@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    bio: 'Strength movement & precision athletics.',
    website: 'https://tivo.social/@jordan.pulse',
    verified: true,
    followersCount: 26100,
    followingCount: 112,
    likesReceivedCount: 760000,
    createdAt: '2021-11-05',
    isFollowing: true,
    coins: 5800,
    creatorEarnings: 2950.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-serena',
    username: 'serena.digital',
    displayName: 'Serena Wu',
    email: 'serena.digital@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
    bio: 'Cyber aesthetics & digital installations.',
    website: 'https://tivo.social/@serena.digital',
    verified: true,
    followersCount: 21900,
    followingCount: 94,
    likesReceivedCount: 640000,
    createdAt: '2022-03-24',
    isFollowing: false,
    coins: 4600,
    creatorEarnings: 2300.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-felix',
    username: 'felix.groove',
    displayName: 'Felix Becker',
    email: 'felix.groove@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&auto=format&fit=crop&q=80',
    bio: 'Deep techno grooves & analog synths.',
    website: 'https://tivo.social/@felix.groove',
    verified: true,
    followersCount: 17500,
    followingCount: 79,
    likesReceivedCount: 420000,
    createdAt: '2022-04-30',
    isFollowing: false,
    coins: 3600,
    creatorEarnings: 1800.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-luna',
    username: 'luna.cinematic',
    displayName: 'Luna Alvarez',
    email: 'luna.cinematic@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=200&auto=format&fit=crop&q=80',
    bio: 'Film grain & vintage vertical lens drops.',
    website: 'https://tivo.social/@luna.cinematic',
    verified: true,
    followersCount: 29800,
    followingCount: 125,
    likesReceivedCount: 880000,
    createdAt: '2021-09-28',
    isFollowing: true,
    coins: 6900,
    creatorEarnings: 3450.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-axel',
    username: 'axel.speed',
    displayName: 'Axel Jensen',
    email: 'axel.speed@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'Automotive cinematography & exhaust audio.',
    website: 'https://tivo.social/@axel.speed',
    verified: true,
    followersCount: 23100,
    followingCount: 98,
    likesReceivedCount: 690000,
    createdAt: '2022-02-08',
    isFollowing: false,
    coins: 5200,
    creatorEarnings: 2600.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-nova',
    username: 'nova.skies',
    displayName: 'Nova Campbell',
    email: 'nova.skies@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?w=200&auto=format&fit=crop&q=80',
    bio: 'Drone skies & atmospheric horizons.',
    website: 'https://tivo.social/@nova.skies',
    verified: true,
    followersCount: 19700,
    followingCount: 86,
    likesReceivedCount: 530000,
    createdAt: '2022-05-19',
    isFollowing: false,
    coins: 4100,
    creatorEarnings: 2050.00,
    subscriptionPrice: 4.99
  },
  {
    id: 'user-devon',
    username: 'devon.code',
    displayName: 'Devon Cole',
    email: 'devon.code@tivo.social',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
    bio: 'Creative coding & generative motion.',
    website: 'https://tivo.social/@devon.code',
    verified: true,
    followersCount: 18900,
    followingCount: 81,
    likesReceivedCount: 470000,
    createdAt: '2022-06-03',
    isFollowing: false,
    coins: 3900,
    creatorEarnings: 1950.00,
    subscriptionPrice: 4.99
  }
];

// Current Account (Young Developer - starts at 0 followers as requested)
export const CURRENT_USER: User = {
  id: 'user-young-dev',
  username: 'young.developer',
  displayName: 'Young Developer',
  email: 'jacobfhernandez14@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  bio: 'Young developer building TIVO  Minimalist short-video platform.',
  website: 'https://tivo.social/@young.developer',
  verified: false,
  followersCount: 0,
  followingCount: 0,
  likesReceivedCount: 0,
  createdAt: '2026-10-01',
  coins: 500,
  creatorEarnings: 0,
  subscriptionPrice: 4.99
};

// 20 Distinct Working Video Clips served locally from /videos/clip_*.mp4
export const DEFAULT_VIDEOS: Video[] = [
  {
    id: 'vid-01',
    videoUrl: '/videos/clip_1.mp4',
    thumbnailUrl: '/videos/thumb_1.jpg',
    caption: 'Pulsing concentric soundwave frequency test  #motion #soundwave #minimal #tivo',
    hashtags: ['motion', 'soundwave', 'minimal', 'tivo'],
    creator: DEFAULT_USERS[0],
    musicTrack: DEFAULT_TRACKS[0],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T18:30:00Z',
    creatorFundEarnings: 35.60,
    giftsReceivedCount: 48
  },
  {
    id: 'vid-02',
    videoUrl: '/videos/clip_2.mp4',
    thumbnailUrl: '/videos/thumb_2.jpg',
    caption: 'Cellular automata rule 30 cascading in pure black & white  #automata #mathart #generative',
    hashtags: ['automata', 'mathart', 'generative'],
    creator: DEFAULT_USERS[1],
    musicTrack: DEFAULT_TRACKS[1],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T17:15:00Z',
    creatorFundEarnings: 56.80,
    giftsReceivedCount: 92
  },
  {
    id: 'vid-03',
    videoUrl: '/videos/clip_3.mp4',
    thumbnailUrl: '/videos/thumb_3.jpg',
    caption: 'Infinite Mandelbrot zoom into deep monochrome fractals  #fractal #deepzoom #illusion',
    hashtags: ['fractal', 'deepzoom', 'illusion'],
    creator: DEFAULT_USERS[2],
    musicTrack: DEFAULT_TRACKS[2],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T16:00:00Z',
    creatorFundEarnings: 86.00,
    giftsReceivedCount: 124
  },
  {
    id: 'vid-04',
    videoUrl: '/videos/clip_4.mp4',
    thumbnailUrl: '/videos/thumb_4.jpg',
    caption: 'Conway Game of Life evolving complex organic patterns  #gameoflife #simulation #motion',
    hashtags: ['gameoflife', 'simulation', 'motion'],
    creator: DEFAULT_USERS[3],
    musicTrack: DEFAULT_TRACKS[3],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T15:20:00Z',
    creatorFundEarnings: 119.20,
    giftsReceivedCount: 180
  },
  {
    id: 'vid-05',
    videoUrl: '/videos/clip_5.mp4',
    thumbnailUrl: '/videos/thumb_5.jpg',
    caption: 'Hypnotic spiral vortex in high contrast white and black  #spiral #vortex #trippy',
    hashtags: ['spiral', 'vortex', 'trippy'],
    creator: DEFAULT_USERS[4],
    musicTrack: DEFAULT_TRACKS[0],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T14:45:00Z',
    creatorFundEarnings: 44.80,
    giftsReceivedCount: 65
  },
  {
    id: 'vid-06',
    videoUrl: '/videos/clip_6.mp4',
    thumbnailUrl: '/videos/thumb_6.jpg',
    caption: 'Liquid mercury waves undulating in rhythmic harmony  #fluid #mercury #aesthetic',
    hashtags: ['fluid', 'mercury', 'aesthetic'],
    creator: DEFAULT_USERS[5],
    musicTrack: DEFAULT_TRACKS[1],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T13:10:00Z',
    creatorFundEarnings: 73.60,
    giftsReceivedCount: 110
  },
  {
    id: 'vid-07',
    videoUrl: '/videos/clip_7.mp4',
    thumbnailUrl: '/videos/thumb_7.jpg',
    caption: 'Sierpinski carpet fractal expanding across dimensions  #geometry #sierpinski #lines',
    hashtags: ['geometry', 'sierpinski', 'lines'],
    creator: DEFAULT_USERS[6],
    musicTrack: DEFAULT_TRACKS[2],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T12:00:00Z',
    creatorFundEarnings: 50.40,
    giftsReceivedCount: 72
  },
  {
    id: 'vid-08',
    videoUrl: '/videos/clip_8.mp4',
    thumbnailUrl: '/videos/thumb_8.jpg',
    caption: 'Perspective checkerboard flight into the horizon  #perspective #flight #checkerboard',
    hashtags: ['perspective', 'flight', 'checkerboard'],
    creator: DEFAULT_USERS[7],
    musicTrack: DEFAULT_TRACKS[3],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T11:20:00Z',
    creatorFundEarnings: 106.00,
    giftsReceivedCount: 155
  },
  {
    id: 'vid-09',
    videoUrl: '/videos/clip_9.mp4',
    thumbnailUrl: '/videos/thumb_9.jpg',
    caption: 'Optical moire interference fields intersecting dynamically  #moire #optical #pattern',
    hashtags: ['moire', 'optical', 'pattern'],
    creator: DEFAULT_USERS[8],
    musicTrack: DEFAULT_TRACKS[0],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T10:40:00Z',
    creatorFundEarnings: 67.20,
    giftsReceivedCount: 98
  },
  {
    id: 'vid-10',
    videoUrl: '/videos/clip_10.mp4',
    thumbnailUrl: '/videos/thumb_10.jpg',
    caption: 'Warp speed starburst particles accelerating forward ✨ #starburst #warp #hyperdrive',
    hashtags: ['starburst', 'warp', 'hyperdrive'],
    creator: DEFAULT_USERS[9],
    musicTrack: DEFAULT_TRACKS[1],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T09:10:00Z',
    creatorFundEarnings: 81.60,
    giftsReceivedCount: 118
  },
  {
    id: 'vid-11',
    videoUrl: '/videos/clip_11.mp4',
    thumbnailUrl: '/videos/thumb_11.jpg',
    caption: 'Minimalist sound equalizer columns bouncing to sub-bass  #equalizer #spectrum #audio',
    hashtags: ['equalizer', 'spectrum', 'audio'],
    creator: DEFAULT_USERS[10],
    musicTrack: DEFAULT_TRACKS[2],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T08:30:00Z',
    creatorFundEarnings: 47.20,
    giftsReceivedCount: 68
  },
  {
    id: 'vid-12',
    videoUrl: '/videos/clip_12.mp4',
    thumbnailUrl: '/videos/thumb_12.jpg',
    caption: 'Hyper diamond radiance radiating geometric light  #diamond #radiance #geometric',
    hashtags: ['diamond', 'radiance', 'geometric'],
    creator: DEFAULT_USERS[11],
    musicTrack: DEFAULT_TRACKS[3],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T07:15:00Z',
    creatorFundEarnings: 111.20,
    giftsReceivedCount: 164
  },
  {
    id: 'vid-13',
    videoUrl: '/videos/clip_13.mp4',
    thumbnailUrl: '/videos/thumb_13.jpg',
    caption: 'Radar HUD sweep scanning for signal blips in the dark  #radar #hud #scanning',
    hashtags: ['radar', 'hud', 'scanning'],
    creator: DEFAULT_USERS[12],
    musicTrack: DEFAULT_TRACKS[0],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T06:00:00Z',
    creatorFundEarnings: 38.40,
    giftsReceivedCount: 54
  },
  {
    id: 'vid-14',
    videoUrl: '/videos/clip_14.mp4',
    thumbnailUrl: '/videos/thumb_14.jpg',
    caption: 'Lissajous harmonic resonance figure-8 oscillation ♾ #lissajous #resonance #physics',
    hashtags: ['lissajous', 'resonance', 'physics'],
    creator: DEFAULT_USERS[13],
    musicTrack: DEFAULT_TRACKS[1],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T05:30:00Z',
    creatorFundEarnings: 70.40,
    giftsReceivedCount: 102
  },
  {
    id: 'vid-15',
    videoUrl: '/videos/clip_15.mp4',
    thumbnailUrl: '/videos/thumb_15.jpg',
    caption: 'Digital matrix rain stream falling through the mainframe  #matrix #digitalrain #cyber',
    hashtags: ['matrix', 'digitalrain', 'cyber'],
    creator: DEFAULT_USERS[14],
    musicTrack: DEFAULT_TRACKS[2],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T04:20:00Z',
    creatorFundEarnings: 94.40,
    giftsReceivedCount: 138
  },
  {
    id: 'vid-16',
    videoUrl: '/videos/clip_16.mp4',
    thumbnailUrl: '/videos/thumb_16.jpg',
    caption: 'Kaleidoscope star geometry refracting light trails  #kaleidoscope #star #symmetry',
    hashtags: ['kaleidoscope', 'star', 'symmetry'],
    creator: DEFAULT_USERS[15],
    musicTrack: DEFAULT_TRACKS[3],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T03:10:00Z',
    creatorFundEarnings: 61.60,
    giftsReceivedCount: 88
  },
  {
    id: 'vid-17',
    videoUrl: '/videos/clip_17.mp4',
    thumbnailUrl: '/videos/thumb_17.jpg',
    caption: 'Isometric diamond grid shifting across 3D planes  #isometric #3dgrid #minimalism',
    hashtags: ['isometric', '3dgrid', 'minimalism'],
    creator: DEFAULT_USERS[16],
    musicTrack: DEFAULT_TRACKS[0],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T02:00:00Z',
    creatorFundEarnings: 79.20,
    giftsReceivedCount: 115
  },
  {
    id: 'vid-18',
    videoUrl: '/videos/clip_18.mp4',
    thumbnailUrl: '/videos/thumb_18.jpg',
    caption: 'Sonic shockwave rings expanding outwards into silence  #shockwave #sonic #rings',
    hashtags: ['shockwave', 'sonic', 'rings'],
    creator: DEFAULT_USERS[17],
    musicTrack: DEFAULT_TRACKS[1],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T01:30:00Z',
    creatorFundEarnings: 55.60,
    giftsReceivedCount: 78
  },
  {
    id: 'vid-19',
    videoUrl: '/videos/clip_19.mp4',
    thumbnailUrl: '/videos/thumb_19.jpg',
    caption: 'Wolfram rule 90 triangle cascade creating intricate pyramids  #wolfram #rule90 #triangles',
    hashtags: ['wolfram', 'rule90', 'triangles'],
    creator: DEFAULT_USERS[18],
    musicTrack: DEFAULT_TRACKS[2],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-03T00:45:00Z',
    creatorFundEarnings: 99.20,
    giftsReceivedCount: 145
  },
  {
    id: 'vid-20',
    videoUrl: '/videos/clip_20.mp4',
    thumbnailUrl: '/videos/thumb_20.jpg',
    caption: 'Oscillating light horizon glowing on pure black  #horizon #light #contrast #tivo',
    hashtags: ['horizon', 'light', 'contrast', 'tivo'],
    creator: DEFAULT_USERS[19],
    musicTrack: DEFAULT_TRACKS[3],
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-10-02T23:50:00Z',
    creatorFundEarnings: 122.00,
    giftsReceivedCount: 190
  }
];

// Active Live Streams (Real counts starting from 0)
export const DEFAULT_LIVESTREAMS: LiveStream[] = [
  {
    id: 'live-creative',
    streamer: DEFAULT_USERS[0],
    title: 'LIVE: Generative Art & Optical Motion Studio',
    viewerCount: 0,
    likesCount: 0,
    isLive: true,
    startedAt: '15m ago',
    category: 'Creative',
    videoUrl: '/videos/clip_1.mp4',
    pinnedComment: 'Welcome everyone! Tap the screen to send likes'
  },
  {
    id: 'live-elena',
    streamer: DEFAULT_USERS[1],
    title: 'LIVE: Street Choreography & Freestyle Session',
    viewerCount: 0,
    likesCount: 0,
    isLive: true,
    startedAt: '8m ago',
    category: 'Dance & Music',
    videoUrl: '/videos/clip_4.mp4',
    pinnedComment: 'Welcome everyone! Tap the screen to send likes'
  }
];

// Storage Keys (Bumped to reset any old cached fake stats)
const STORAGE_KEYS = {
  VIDEOS: 'tivo_videos_v10',
  USERS: 'tivo_users_v10',
  CURRENT_USER: 'tivo_current_user_v10',
  COMMENTS: 'tivo_comments_v10',
  NOTIFICATIONS: 'tivo_notifications_v10',
  CONVERSATIONS: 'tivo_conversations_v10',
  MESSAGES: 'tivo_messages_v10',
  LIVESTREAMS: 'tivo_livestreams_v10',
  SUBSCRIPTIONS: 'tivo_subscriptions_v10'
};

class StorageService {
  public getCurrentUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) {
      try {
        const u = JSON.parse(data);
        u.verified = (u.followersCount || 0) >= 10000;
        return u;
      } catch {}
    }
    const u = { ...CURRENT_USER };
    u.verified = (u.followersCount || 0) >= 10000;
    return u;
  }

  public hasUserLoggedIn(): boolean {
    const status = localStorage.getItem('tivo_is_signed_in');
    if (status === 'false') return false;
    return true;
  }

  public setUserLoggedIn(status: boolean): void {
    if (status) {
      localStorage.setItem('tivo_is_signed_in', 'true');
    } else {
      localStorage.removeItem('tivo_is_signed_in');
    }
  }

  public saveCurrentUser(user: User): void {
    try {
      user.verified = (user.followersCount || 0) >= 10000;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      this.setUserLoggedIn(true);

      // Keep users array in sync
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user };
        this.saveUsers(users);
      } else {
        users.unshift(user);
        this.saveUsers(users);
      }

      // Keep creator avatar in user's videos in sync
      const videos = this.getVideos();
      let updatedVideos = false;
      videos.forEach(v => {
        if (v.creator.id === user.id) {
          v.creator = { ...v.creator, ...user };
          updatedVideos = true;
        }
      });
      if (updatedVideos) {
        this.saveVideos(videos);
      }
    } catch (err) {
      console.warn('LocalStorage saveCurrentUser notice:', err);
    }
  }

  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data) {
      try {
        const users: User[] = JSON.parse(data);
        return users.map(u => ({
          ...u,
          verified: (u.followersCount || 0) >= 10000
        }));
      } catch {}
    }
    return DEFAULT_USERS.map(u => ({
      ...u,
      verified: (u.followersCount || 0) >= 10000
    }));
  }

  public saveUsers(users: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (err) {
      console.warn('LocalStorage saveUsers notice:', err);
    }
  }

  public getUserById(id: string): User | undefined {
    const users = this.getUsers();
    if (id === this.getCurrentUser().id) return this.getCurrentUser();
    return users.find(u => u.id === id);
  }

  public toggleFollowUser(targetUserId: string): { isFollowing: boolean; targetUser: User } {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();

    let targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
      const vid = this.getVideos().find(v => v.creator.id === targetUserId);
      if (vid) {
        targetUser = { ...vid.creator };
        users.push(targetUser);
      } else {
        return { isFollowing: false, targetUser: currentUser };
      }
    }

    targetUser.isFollowing = !targetUser.isFollowing;
    if (targetUser.isFollowing) {
      targetUser.followersCount += 1;
      currentUser.followingCount += 1;

      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'follow',
        actor: currentUser,
        message: 'started following you',
        createdAt: 'Just now',
        read: false
      });
    } else {
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
    }

    targetUser.verified = targetUser.followersCount >= 10000;
    currentUser.verified = currentUser.followersCount >= 10000;

    this.saveUsers(users);
    this.saveCurrentUser(currentUser);

    return { isFollowing: !!targetUser.isFollowing, targetUser };
  }

  // Videos
  public getVideos(): Video[] {
    const data = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 20 && parsed[0].videoUrl.startsWith('/videos/')) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_VIDEOS;
  }

  public saveVideos(videos: Video[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    } catch (err) {
      console.warn('LocalStorage saveVideos notice:', err);
    }
  }

  public addVideo(video: Video): void {
    const videos = this.getVideos();
    videos.unshift(video);
    this.saveVideos(videos);
  }

  public deleteVideo(videoId: string): void {
    let videos = this.getVideos();
    videos = videos.filter(v => v.id !== videoId);
    this.saveVideos(videos);
  }

  public toggleLikeVideo(videoId: string): { isLiked: boolean; likesCount: number } {
    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return { isLiked: false, likesCount: 0 };

    video.isLiked = !video.isLiked;
    video.likesCount += video.isLiked ? 1 : -1;

    if (video.isLiked && video.creator.id !== this.getCurrentUser().id) {
      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'like',
        actor: this.getCurrentUser(),
        message: `liked your video: "${video.caption.substring(0, 30)}..."`,
        videoId: video.id,
        videoThumbnail: video.thumbnailUrl,
        createdAt: 'Just now',
        read: false
      });
    }

    this.saveVideos(videos);
    return { isLiked: !!video.isLiked, likesCount: video.likesCount };
  }

  public toggleBookmarkVideo(videoId: string): { isBookmarked: boolean; bookmarksCount: number } {
    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return { isBookmarked: false, bookmarksCount: 0 };

    video.isBookmarked = !video.isBookmarked;
    video.bookmarksCount += video.isBookmarked ? 1 : -1;
    this.saveVideos(videos);
    return { isBookmarked: !!video.isBookmarked, bookmarksCount: video.bookmarksCount };
  }

  public incrementShareCount(videoId: string): number {
    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return 0;
    video.sharesCount += 1;
    this.saveVideos(videos);
    return video.sharesCount;
  }

  // Virtual Gifts & Monetization
  public hasUserSent100kGift(userId?: string): boolean {
    const user = userId ? this.getUserById(userId) : this.getCurrentUser();
    if (!user) return false;
    if (user.hasSent100kGift) return true;
    return localStorage.getItem(`tivo_sent_100k_gift_${user.id}`) === 'true';
  }

  public getGiftsCatalog(userId?: string): Gift[] {
    const hasSent = this.hasUserSent100kGift(userId);
    if (hasSent) {
      // 100k gift permanently disappears only for this user once sent!
      return GIFTS_CATALOG.filter(g => g.id !== 'gift-100k' && g.coins < 100000);
    }
    return GIFTS_CATALOG;
  }

  public sendGift(gift: Gift, receiverId: string, videoId?: string): { success: boolean; newCoins: number; error?: string } {
    const currentUser = this.getCurrentUser();
    if ((gift.id === 'gift-100k' || gift.coins >= 100000) && this.hasUserSent100kGift(currentUser.id)) {
      return { success: false, newCoins: currentUser.coins, error: 'The 100k gift can only be sent once and is no longer available.' };
    }

    if (currentUser.coins < gift.coins) {
      return { success: false, newCoins: currentUser.coins, error: 'Insufficient coins balance' };
    }

    currentUser.coins -= gift.coins;
    if (gift.id === 'gift-100k' || gift.coins >= 100000) {
      currentUser.hasSent100kGift = true;
      localStorage.setItem(`tivo_sent_100k_gift_${currentUser.id}`, 'true');
    }
    this.saveCurrentUser(currentUser);

    const users = this.getUsers();
    const creator = users.find(u => u.id === receiverId);
    if (creator) {
      creator.creatorEarnings = +(creator.creatorEarnings + gift.coins * 0.01).toFixed(2);
      this.saveUsers(users);

      this.addNotification({
        id: `notif-${Date.now()}`,
        type: 'gift',
        actor: currentUser,
        message: `sent you ${gift.name} (${gift.coins} coins)!`,
        videoId,
        createdAt: 'Just now',
        read: false
      });
    }

    if (videoId) {
      const videos = this.getVideos();
      const video = videos.find(v => v.id === videoId);
      if (video) {
        video.giftsReceivedCount = (video.giftsReceivedCount || 0) + 1;
        this.saveVideos(videos);
      }
    }

    return { success: true, newCoins: currentUser.coins };
  }

  public hasClaimed100kGift(): boolean {
    const currentUser = this.getCurrentUser();
    return !!currentUser.hasClaimed100kGift || localStorage.getItem('tivo_claimed_100k_gift_perm') === 'true';
  }

  public claim100kGift(): User {
    const currentUser = this.getCurrentUser();
    const updated: User = {
      ...currentUser,
      coins: (currentUser.coins || 0) + 100000,
      hasClaimed100kGift: true
    };
    this.saveCurrentUser(updated);
    localStorage.setItem('tivo_claimed_100k_gift_perm', 'true');
    return updated;
  }

  public addCoinsToUser(amount: number): number {
    const currentUser = this.getCurrentUser();
    currentUser.coins += amount;
    this.saveCurrentUser(currentUser);
    return currentUser.coins;
  }

  // Tivi Admin Panel methods (password: tivi.panel)
  public grantCoinsToUser(identifier: string, amount: number): { success: boolean; user?: User; error?: string } {
    const trimmed = identifier.trim().toLowerCase().replace(/^@/, '');
    const users = this.getUsers();
    let target = users.find(u => u.id === identifier || u.username.toLowerCase() === trimmed);
    const currentUser = this.getCurrentUser();

    if (!target && (currentUser.id === identifier || currentUser.username.toLowerCase() === trimmed)) {
      target = currentUser;
    }

    if (!target) {
      return { success: false, error: `User "${identifier}" not found` };
    }

    target.coins = Math.max(0, (target.coins || 0) + amount);
    this.saveUsers(users.map(u => u.id === target!.id ? target! : u));

    if (currentUser.id === target.id || currentUser.username.toLowerCase() === target.username.toLowerCase()) {
      this.saveCurrentUser(target);
    }

    return { success: true, user: target };
  }

  public grantFollowersToUser(identifier: string, amount: number): { success: boolean; user?: User; error?: string } {
    const trimmed = identifier.trim().toLowerCase().replace(/^@/, '');
    const users = this.getUsers();
    let target = users.find(u => u.id === identifier || u.username.toLowerCase() === trimmed);
    const currentUser = this.getCurrentUser();

    if (!target && (currentUser.id === identifier || currentUser.username.toLowerCase() === trimmed)) {
      target = currentUser;
    }

    if (!target) {
      return { success: false, error: `User "${identifier}" not found` };
    }

    target.followersCount = Math.max(0, (target.followersCount || 0) + amount);
    this.saveUsers(users.map(u => u.id === target!.id ? target! : u));

    if (currentUser.id === target.id || currentUser.username.toLowerCase() === target.username.toLowerCase()) {
      this.saveCurrentUser(target);
    }

    return { success: true, user: target };
  }

  // 5-day promotional timer helpers
  public getTopupStartTime(): number {
    let t = localStorage.getItem('tivo_topup_free_start');
    if (!t) {
      t = Date.now().toString();
      localStorage.setItem('tivo_topup_free_start', t);
    }
    return parseInt(t, 10);
  }

  public isTopupExpired(): boolean {
    const start = this.getTopupStartTime();
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    return Date.now() - start >= FIVE_DAYS_MS;
  }

  public resetTopupTimer(): void {
    localStorage.setItem('tivo_topup_free_start', Date.now().toString());
  }

  public expireTopupTimer(): void {
    const past = Date.now() - (6 * 24 * 60 * 60 * 1000);
    localStorage.setItem('tivo_topup_free_start', past.toString());
  }

  public subscribeToCreator(creatorId: string): { success: boolean; creator: User } {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();
    let creator = users.find(u => u.id === creatorId);
    if (!creator) {
      const vid = this.getVideos().find(v => v.creator.id === creatorId);
      if (vid) {
        creator = { ...vid.creator };
        users.push(creator);
      } else {
        return { success: false, creator: currentUser };
      }
    }

    creator.isSubscribedTo = true;
    creator.creatorEarnings = +(creator.creatorEarnings + (creator.subscriptionPrice || 4.99) * 0.85).toFixed(2);
    this.saveUsers(users);

    this.addNotification({
      id: `notif-${Date.now()}`,
      type: 'subscription',
      actor: currentUser,
      message: 'subscribed to your exclusive VIP tier!',
      createdAt: 'Just now',
      read: false
    });

    return { success: true, creator };
  }

  // Live Streams
  public getLiveStreams(): LiveStream[] {
    const data = localStorage.getItem(STORAGE_KEYS.LIVESTREAMS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return DEFAULT_LIVESTREAMS;
  }

  public saveLiveStreams(streams: LiveStream[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIVESTREAMS, JSON.stringify(streams));
    } catch {}
  }

  public startLiveStream(stream: LiveStream): void {
    const streams = this.getLiveStreams();
    streams.unshift(stream);
    this.saveLiveStreams(streams);
  }

  public endLiveStream(streamId: string): void {
    let streams = this.getLiveStreams();
    streams = streams.filter(s => s.id !== streamId);
    this.saveLiveStreams(streams);
    try {
      localStorage.removeItem(`tivo_real_viewers_${streamId}`);
    } catch {}
  }

  // Real Live Stream Viewer Tracking (Only real users counted)
  public joinLiveStream(streamId: string, userId: string): number {
    const streams = this.getLiveStreams();
    const stream = streams.find(s => s.id === streamId);
    const key = `tivo_real_viewers_${streamId}`;
    let viewers: string[] = [];
    try {
      const data = localStorage.getItem(key);
      if (data) viewers = JSON.parse(data);
    } catch {}

    if (!viewers.includes(userId)) {
      viewers.push(userId);
      try {
        localStorage.setItem(key, JSON.stringify(viewers));
      } catch {}
    }

    const count = viewers.length;
    if (stream) {
      stream.viewerCount = count;
      this.saveLiveStreams(streams);
    }
    return count;
  }

  public leaveLiveStream(streamId: string, userId: string): number {
    const streams = this.getLiveStreams();
    const stream = streams.find(s => s.id === streamId);
    const key = `tivo_real_viewers_${streamId}`;
    let viewers: string[] = [];
    try {
      const data = localStorage.getItem(key);
      if (data) viewers = JSON.parse(data);
    } catch {}

    viewers = viewers.filter(id => id !== userId);
    try {
      localStorage.setItem(key, JSON.stringify(viewers));
    } catch {}

    const count = Math.max(0, viewers.length);
    if (stream) {
      stream.viewerCount = count;
      this.saveLiveStreams(streams);
    }
    return count;
  }

  public getRealLiveViewerCount(streamId: string): number {
    const key = `tivo_real_viewers_${streamId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const viewers = JSON.parse(data);
        return Array.isArray(viewers) ? viewers.length : 0;
      }
    } catch {}
    return 0;
  }

  // Comments
  public getComments(videoId: string): Comment[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (data) {
      try {
        const all: Comment[] = JSON.parse(data);
        return all.filter(c => c.videoId === videoId);
      } catch {}
    }
    return [];
  }

  public incrementViewCount(videoId: string): number {
    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return 0;
    video.viewsCount = (video.viewsCount || 0) + 1;
    this.saveVideos(videos);
    return video.viewsCount;
  }

  public addGiftComment(videoId: string, gift: Gift, text?: string): { success: boolean; comment?: Comment; error?: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser.coins < gift.coins) {
      return { success: false, error: 'Insufficient coins for this gift' };
    }

    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    const receiverId = video ? video.creator.id : currentUser.id;

    // Send gift transaction
    const giftResult = this.sendGift(gift, receiverId, videoId);
    if (!giftResult.success) {
      return { success: false, error: giftResult.error };
    }

    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    let all: Comment[] = [];
    if (data) {
      try {
        all = JSON.parse(data);
      } catch {}
    }

    const newComment: Comment = {
      id: `c-gift-${Date.now()}`,
      videoId,
      user: currentUser,
      text: text || `Sent ${gift.name} (${gift.coins} Coins)`,
      likesCount: 0,
      createdAt: 'Just now',
      gift
    };

    all.unshift(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));

    if (video) {
      video.commentsCount = (video.commentsCount || 0) + 1;
      this.saveVideos(videos);
    }

    return { success: true, comment: newComment };
  }
  public addComment(videoId: string, text: string): Comment {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    let all: Comment[] = [];
    if (data) {
      try {
        all = JSON.parse(data);
      } catch {}
    }

    const currentUser = this.getCurrentUser();
    const newComm: Comment = {
      id: `c-${Date.now()}`,
      videoId,
      user: currentUser,
      text,
      likesCount: 0,
      createdAt: 'Just now'
    };

    all.unshift(newComm);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));

    const videos = this.getVideos();
    const video = videos.find(v => v.id === videoId);
    if (video) {
      video.commentsCount += 1;
      this.saveVideos(videos);
    }

    return newComm;
  }

  public toggleLikeComment(commentId: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!data) return;
    try {
      const all: Comment[] = JSON.parse(data);
      const c = all.find(item => item.id === commentId);
      if (c) {
        c.isLiked = !c.isLiked;
        c.likesCount += c.isLiked ? 1 : -1;
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
      }
    } catch {}
  }

  // Notifications
  public getNotifications(): Notification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return [
      {
        id: 'n1',
        type: 'gift',
        actor: DEFAULT_USERS[0],
        message: 'sent you a Diamond  (50 coins)!',
        createdAt: '5m ago',
        read: false
      },
      {
        id: 'n2',
        type: 'subscription',
        actor: DEFAULT_USERS[3],
        message: 'subscribed to your VIP exclusive tier! ⭐',
        createdAt: '25m ago',
        read: false
      },
      {
        id: 'n3',
        type: 'like',
        actor: DEFAULT_USERS[1],
        message: 'liked your monochrome video.',
        createdAt: '1h ago',
        read: true
      }
    ];
  }

  public addNotification(notification: Notification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  public markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  // Conversations
  public getConversations(): Conversation[] {
    return [
      {
        id: 'conv-khaby',
        participant: DEFAULT_USERS[0],
        unreadCount: 0,
        updatedAt: '12m ago',
        lastMessage: {
          id: 'm1',
          conversationId: 'conv-khaby',
          senderId: DEFAULT_USERS[0].id,
          receiverId: CURRENT_USER.id,
          text: 'Loved your new black & white video cut! Collab next week? ',
          createdAt: '12m ago',
          read: true
        }
      },
      {
        id: 'conv-mrbeast',
        participant: DEFAULT_USERS[1],
        unreadCount: 0,
        updatedAt: '1h ago',
        lastMessage: {
          id: 'm2',
          conversationId: 'conv-mrbeast',
          senderId: DEFAULT_USERS[1].id,
          receiverId: CURRENT_USER.id,
          text: 'Great video! The Creator Fund payout was processed today.',
          createdAt: '1h ago',
          read: true
        }
      }
    ];
  }

  public getMessages(convId: string): Message[] {
    const data = localStorage.getItem(`tivo_msgs_${convId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    const conv = this.getConversations().find(c => c.id === convId);
    return conv ? [conv.lastMessage] : [];
  }

  public sendMessage(convId: string, recipient: User, text: string): Message {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: this.getCurrentUser().id,
      receiverId: recipient.id,
      text,
      createdAt: 'Just now',
      read: true
    };
    const msgs = this.getMessages(convId);
    msgs.push(msg);
    localStorage.setItem(`tivo_msgs_${convId}`, JSON.stringify(msgs));
    return msg;
  }
}

export const storage = new StorageService();
