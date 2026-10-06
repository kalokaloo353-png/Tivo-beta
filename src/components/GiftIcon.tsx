import React from 'react';

interface GiftIconProps {
  iconKey: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const GiftIcon: React.FC<GiftIconProps> = ({
  iconKey,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  }[size];

  switch (iconKey) {
    case 'gift-rose':
    case 'crystal-rose':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="rosePetalGrad" x1="12" y1="8" x2="52" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d8d" />
              <stop offset="40%" stopColor="#ff1744" />
              <stop offset="80%" stopColor="#b71c1c" />
              <stop offset="100%" stopColor="#880e4f" />
            </linearGradient>
            <linearGradient id="roseStemGrad" x1="32" y1="36" x2="32" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00e676" />
              <stop offset="100%" stopColor="#1b5e20" />
            </linearGradient>
            <radialGradient id="roseAura" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ff4081" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff1744" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="26" r="24" fill="url(#roseAura)" />
          <path d="M32 10L39 16L32 24L25 16L32 10Z" fill="url(#rosePetalGrad)" stroke="#ff80ab" strokeWidth="1.2" />
          <path d="M39 16L48 20L44 30L32 24L39 16Z" fill="#d81b60" stroke="#ff4081" strokeWidth="1.2" />
          <path d="M25 16L16 20L20 30L32 24L25 16Z" fill="#c2185b" stroke="#ff4081" strokeWidth="1.2" />
          <path d="M20 30L32 38L44 30L38 42L26 42L20 30Z" fill="url(#rosePetalGrad)" stroke="#ff80ab" strokeWidth="1.2" />
          <path d="M32 38L32 54" stroke="url(#roseStemGrad)" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 46C26 44 24 40 24 40" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 49C38 47 40 43 40 43" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'gift-heart':
    case 'hyper-heart':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="neonHeartGrad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff1744" />
              <stop offset="50%" stopColor="#f50057" />
              <stop offset="100%" stopColor="#651fff" />
            </linearGradient>
            <radialGradient id="heartHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff4081" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#651fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="url(#heartHalo)" />
          <path
            d="M32 52L13 32C7 25 9 14 19 12C26 10 30 16 32 18C34 16 38 10 45 12C55 14 57 25 51 32L32 52Z"
            fill="url(#neonHeartGrad)"
            stroke="#ff80ab"
            strokeWidth="1.5"
          />
          <ellipse cx="23" cy="22" rx="4" ry="7" fill="#ffffff" fillOpacity="0.4" transform="rotate(-30 23 22)" />
        </svg>
      );

    case 'gift-fire':
    case 'plasma-flame':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="plasmaGrad" x1="16" y1="10" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="30%" stopColor="#ff9100" />
              <stop offset="70%" stopColor="#ff3d00" />
              <stop offset="100%" stopColor="#d50000" />
            </linearGradient>
            <radialGradient id="flameGlow" cx="50%" cy="60%" r="45%">
              <stop offset="0%" stopColor="#ff6d00" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="36" r="24" fill="url(#flameGlow)" />
          <path
            d="M32 8C32 8 38 20 34 28C40 22 46 26 48 34C51 44 43 54 32 56C21 54 13 44 16 34C18 26 24 22 30 28C26 20 32 8 32 8Z"
            fill="url(#plasmaGrad)"
            stroke="#ffea00"
            strokeWidth="1.2"
          />
          <path
            d="M32 26C32 26 36 34 33 39C37 35 41 37 42 42C44 48 39 53 32 54C25 53 20 48 22 42C23 37 27 35 31 39C28 34 32 26 32 26Z"
            fill="#ffff55"
          />
        </svg>
      );

    case 'gift-magic-wand':
    case 'magic-wand':
    case 'star-wand':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="wandGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4081" />
              <stop offset="50%" stopColor="#7c4dff" />
              <stop offset="100%" stopColor="#00e5ff" />
            </linearGradient>
            <radialGradient id="starGlow" cx="65%" cy="30%" r="40%">
              <stop offset="0%" stopColor="#ffff00" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ff007f" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="42" cy="22" r="18" fill="url(#starGlow)" />
          <path d="M12 52L36 28" stroke="url(#wandGrad)" strokeWidth="4" strokeLinecap="round" />
          <polygon points="42,10 45,18 54,19 47,25 49,34 42,29 35,34 37,25 30,19 39,18" fill="#ffd700" stroke="#ffffff" strokeWidth="1.2" />
          <circle cx="24" cy="16" r="1.5" fill="#ffffff" />
          <circle cx="50" cy="40" r="1.5" fill="#ffffff" />
        </svg>
      );

    case 'gift-diamond':
    case 'quantum-diamond':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="diaCyanGrad" x1="16" y1="16" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e0f7fa" />
              <stop offset="30%" stopColor="#00e5ff" />
              <stop offset="70%" stopColor="#00b0ff" />
              <stop offset="100%" stopColor="#2979ff" />
            </linearGradient>
            <linearGradient id="diaTopGrad" x1="18" y1="16" x2="46" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#80d8ff" />
            </linearGradient>
            <radialGradient id="diaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2979ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="34" r="25" fill="url(#diaGlow)" />
          <path d="M18 16H46L56 30L32 56L8 30L18 16Z" stroke="#b3e5fc" strokeWidth="1.5" fill="none" />
          <path d="M18 16H46L38 30H26L18 16Z" fill="url(#diaTopGrad)" stroke="#80d8ff" strokeWidth="1" />
          <path d="M8 30L18 16L26 30H8Z" fill="#00b0ff" stroke="#80d8ff" strokeWidth="1" />
          <path d="M56 30L46 16L38 30H56Z" fill="#0091ea" stroke="#80d8ff" strokeWidth="1" />
          <path d="M26 30L32 56L38 30H26Z" fill="url(#diaCyanGrad)" stroke="#00e5ff" strokeWidth="1" />
          <path d="M8 30L26 30L32 56L8 30Z" fill="#0288d1" stroke="#4fc3f7" strokeWidth="1" />
          <path d="M56 30L38 30L32 56L56 30Z" fill="#01579b" stroke="#4fc3f7" strokeWidth="1" />
          <polygon points="50,10 52,14 56,15 52,17 50,21 48,17 44,15 48,14" fill="#ffffff" />
        </svg>
      );

    case 'gift-rainbow-heart':
    case 'rainbow-heart':
    case 'prism-heart':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="rainbowHeart" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff0055" />
              <stop offset="25%" stopColor="#ff9900" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="75%" stopColor="#00ff66" />
              <stop offset="100%" stopColor="#9d00ff" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="26" ry="24" fill="#ff0055" fillOpacity="0.2" />
          <path
            d="M32 54L11 33C5 25 7 12 19 10C27 8 30 15 32 17C34 15 37 8 45 10C57 12 59 25 53 33L32 54Z"
            fill="url(#rainbowHeart)"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
          <circle cx="22" cy="20" r="3" fill="#ffffff" fillOpacity="0.7" />
        </svg>
      );

    case 'gift-cyber-car':
    case 'cyber-supercar':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="carGrad" x1="8" y1="24" x2="56" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff007f" />
              <stop offset="50%" stopColor="#7928ca" />
              <stop offset="100%" stopColor="#00dfd8" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="40" rx="26" ry="12" fill="#00dfd8" fillOpacity="0.25" />
          <path d="M8 38L16 28L28 22H42L52 30L58 36L56 44H8L8 38Z" fill="url(#carGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M20 28L28 24H38L44 28H20Z" fill="#111111" stroke="#00dfd8" strokeWidth="1" />
          <circle cx="18" cy="44" r="6" fill="#111111" stroke="#00dfd8" strokeWidth="2" />
          <circle cx="18" cy="44" r="2.5" fill="#ff007f" />
          <circle cx="46" cy="44" r="6" fill="#111111" stroke="#00dfd8" strokeWidth="2" />
          <circle cx="46" cy="44" r="2.5" fill="#ff007f" />
          <path d="M54 36L62 38" stroke="#00dfd8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'gift-dragon':
    case 'neon-dragon':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="dragonGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="50%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#7c4dff" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="25" fill="#00e5ff" fillOpacity="0.2" />
          <path d="M32 10L38 20L48 14L44 26L52 32L42 36L44 48L32 40L20 48L22 36L12 32L20 26L16 14L26 20L32 10Z" fill="url(#dragonGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="27" cy="30" r="2.5" fill="#ffff00" stroke="#ff3d00" strokeWidth="0.8" />
          <circle cx="37" cy="30" r="2.5" fill="#ffff00" stroke="#ff3d00" strokeWidth="0.8" />
          <polygon points="32,32 30,37 34,37" fill="#ffffff" />
        </svg>
      );

    case 'gift-laser-sword':
    case 'laser-sword':
    case 'cyber-katana':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="katanaBeam" x1="48" y1="10" x2="20" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#0055ff" />
            </linearGradient>
          </defs>
          <path d="M50 10L24 36" stroke="url(#katanaBeam)" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 10L24 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="18" y="38" width="6" height="4" rx="1" fill="#ffd700" transform="rotate(-45 21 40)" />
          <path d="M19 41L11 49" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          <circle cx="48" cy="12" r="3" fill="#00e5ff" />
        </svg>
      );

    case 'gift-trophy':
    case 'platinum-trophy':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="goldTrophyGrad" x1="14" y1="8" x2="50" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="35%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#ffab00" />
              <stop offset="100%" stopColor="#ff6f00" />
            </linearGradient>
            <radialGradient id="trophyGoldAura" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff6f00" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="24" r="24" fill="url(#trophyGoldAura)" />
          <path d="M18 8H46V24C46 32 39.5 38 32 38C24.5 38 18 32 18 24V8Z" fill="url(#goldTrophyGrad)" stroke="#ffe082" strokeWidth="1.5" />
          <path d="M18 14H10C8.5 14 7 15.5 7 17.5C7 24 12 28 18 28V24C14 24 10 21 10 17.5C10 16.5 11 16 12 16H18V14Z" fill="#ffc107" stroke="#ffd54f" strokeWidth="1" />
          <path d="M46 14H54C55.5 14 57 15.5 57 17.5C57 24 52 28 46 28V24C50 24 54 21 54 17.5C54 16.5 53 16 52 16H46V14Z" fill="#ffc107" stroke="#ffd54f" strokeWidth="1" />
          <path d="M28 38H36V48H28V38Z" fill="#ff8f00" stroke="#ffa000" strokeWidth="1.2" />
          <path d="M20 48H44V56H20V48Z" fill="#4e342e" stroke="#ffd700" strokeWidth="1.8" />
          <polygon points="32,16 34,21 39,21 35,24 36.5,29 32,26 27.5,29 29,24 25,21 30,21" fill="#ffffff" />
        </svg>
      );

    case 'gift-phoenix':
    case 'phoenix-wings':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="phoenixGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff500" />
              <stop offset="35%" stopColor="#ff5722" />
              <stop offset="70%" stopColor="#e91e63" />
              <stop offset="100%" stopColor="#9c27b0" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="#ff5722" fillOpacity="0.2" />
          <path d="M32 18C28 8 16 8 8 18C4 28 14 36 24 38L32 54L40 38C50 36 60 28 56 18C48 8 36 8 32 18Z" fill="url(#phoenixGrad)" stroke="#ffe082" strokeWidth="1.5" />
          <path d="M22 28L32 14L42 28L32 22L22 28Z" fill="#ffffff" />
          <circle cx="32" cy="20" r="3" fill="#ffeb3b" />
        </svg>
      );

    case 'gift-castle':
    case 'diamond-castle':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="castleGrad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#00e5ff" />
              <stop offset="80%" stopColor="#7c4dff" />
              <stop offset="100%" stopColor="#ff007f" />
            </linearGradient>
          </defs>
          <rect x="14" y="30" width="36" height="24" rx="2" fill="url(#castleGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M12 20L18 30H12V20Z" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
          <path d="M52 20L46 30H52V20Z" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
          <path d="M32 14L24 28H40L32 14Z" fill="#ffd700" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M28 42C28 38 36 38 36 42V54H28V42Z" fill="#111111" stroke="#ffffff" strokeWidth="1" />
          <circle cx="32" cy="22" r="2.5" fill="#ffffff" />
        </svg>
      );

    case 'gift-rocket':
    case 'cosmic-rocket':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="rocketBodyGrad" x1="20" y1="8" x2="52" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#e0e0e0" />
              <stop offset="70%" stopColor="#d32f2f" />
              <stop offset="100%" stopColor="#b71c1c" />
            </linearGradient>
            <linearGradient id="rocketFire" x1="20" y1="44" x2="8" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#ff6d00" />
              <stop offset="100%" stopColor="#ff1744" />
            </linearGradient>
          </defs>
          <path d="M46 8C46 8 34 11 26 19C20 25 19 33 20 39L25 44C31 45 39 44 45 38C53 30 56 18 56 18C56 18 52 8 46 8Z" fill="url(#rocketBodyGrad)" stroke="#ff8a80" strokeWidth="1.5" />
          <path d="M20 39L10 42L14 50L22 47L20 39Z" fill="#00e5ff" stroke="#80d8ff" strokeWidth="1.2" />
          <path d="M39 20L42 10L50 14L47 22L39 20Z" fill="#00e5ff" stroke="#80d8ff" strokeWidth="1.2" />
          <circle cx="38" cy="26" r="5" fill="#0288d1" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M20 44L11 53C10 54 12 57 14 55L22 47" stroke="url(#rocketFire)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'gift-crown':
    case 'celestial-crown':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="crownGold" x1="8" y1="16" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="35%" stopColor="#ffd700" />
              <stop offset="75%" stopColor="#ffab00" />
              <stop offset="100%" stopColor="#e65100" />
            </linearGradient>
            <radialGradient id="crownAura" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffab00" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="30" r="26" fill="url(#crownAura)" />
          <path
            d="M8 20L16 48H48L56 20L42 30L32 12L22 30L8 20Z"
            fill="url(#crownGold)"
            stroke="#ffecb3"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 48H50V54H14V48Z" fill="#b71c1c" stroke="#ffd700" strokeWidth="1.5" />
          <circle cx="32" cy="12" r="3.5" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
          <circle cx="8" cy="20" r="3" fill="#ff1744" stroke="#ffffff" strokeWidth="1" />
          <circle cx="56" cy="20" r="3" fill="#00e676" stroke="#ffffff" strokeWidth="1" />
        </svg>
      );

    case 'gift-meteor':
    case 'meteor-shower':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="meteorTail" x1="48" y1="8" x2="16" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff007f" />
              <stop offset="40%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#ffff00" />
            </linearGradient>
          </defs>
          <path d="M52 12L18 46" stroke="url(#meteorTail)" strokeWidth="6" strokeLinecap="round" />
          <path d="M42 6L22 26" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 26L38 46" stroke="#ffd700" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="46" r="7" fill="#ff3d00" stroke="#ffffff" strokeWidth="1.8" />
          <circle cx="18" cy="46" r="3" fill="#ffff55" />
        </svg>
      );

    case 'gift-lion':
    case 'gold-lion':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="lionGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffe57f" />
              <stop offset="40%" stopColor="#ffb300" />
              <stop offset="80%" stopColor="#ff6f00" />
              <stop offset="100%" stopColor="#bf360c" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="#ffb300" fillOpacity="0.25" />
          <path d="M32 6L38 16L48 10L46 22L56 22L50 32L58 38L48 44L52 54L40 50L36 60L32 52L28 60L24 50L12 54L16 44L6 38L14 32L8 22L18 22L16 10L26 16L32 6Z" fill="url(#lionGrad)" stroke="#ffe082" strokeWidth="1.2" />
          <circle cx="32" cy="34" r="14" fill="#ffecb3" stroke="#ff8f00" strokeWidth="1.5" />
          <ellipse cx="27" cy="32" rx="2" ry="3" fill="#212121" />
          <ellipse cx="37" cy="32" rx="2" ry="3" fill="#212121" />
          <polygon points="32,38 29,42 35,42" fill="#d84315" />
        </svg>
      );

    case 'gift-black-hole':
    case 'black-hole':
    case 'quantum-singularity':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="bhAccretion" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff0055" />
              <stop offset="35%" stopColor="#ff9900" />
              <stop offset="70%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#7928ca" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="28" ry="12" stroke="url(#bhAccretion)" strokeWidth="4" transform="rotate(-25 32 32)" />
          <circle cx="32" cy="32" r="14" fill="#000000" stroke="#ffffff" strokeWidth="2" />
          <circle cx="32" cy="32" r="18" stroke="#ff007f" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );

    case 'gift-galaxy':
    case 'galaxy-planet':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="galPurpleGrad" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ea80fc" />
              <stop offset="40%" stopColor="#aa00ff" />
              <stop offset="80%" stopColor="#4a148c" />
              <stop offset="100%" stopColor="#1a237e" />
            </linearGradient>
            <radialGradient id="galCosmicAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#aa00ff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#galCosmicAura)" />
          <circle cx="32" cy="32" r="16" fill="url(#galPurpleGrad)" stroke="#e1bee7" strokeWidth="1.5" />
          <ellipse cx="32" cy="32" rx="29" ry="9" stroke="#00e5ff" strokeWidth="2.8" transform="rotate(-30 32 32)" />
          <ellipse cx="32" cy="32" rx="24" ry="7" stroke="#ff4081" strokeWidth="1.5" strokeDasharray="4 2" transform="rotate(-30 32 32)" />
          <circle cx="48" cy="16" r="2.5" fill="#ffffff" />
        </svg>
      );

    case 'gift-portal':
    case 'interstellar-portal':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="portalGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00ffff" />
              <stop offset="35%" stopColor="#d500f9" />
              <stop offset="70%" stopColor="#ff007f" />
              <stop offset="100%" stopColor="#651fff" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" stroke="url(#portalGrad)" strokeWidth="3" strokeDasharray="6 3" />
          <circle cx="32" cy="32" r="21" stroke="#00ffff" strokeWidth="2.5" strokeDasharray="4 2" />
          <circle cx="32" cy="32" r="14" fill="#000000" stroke="#ff007f" strokeWidth="2" />
          <polygon points="32,22 36,32 32,42 28,32" fill="#ffffff" />
        </svg>
      );

    case 'gift-universe':
    case 'multiverse-matrix':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="univMatrix" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00ffcc" />
              <stop offset="25%" stopColor="#0066ff" />
              <stop offset="50%" stopColor="#cc00ff" />
              <stop offset="75%" stopColor="#ff0066" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" stroke="url(#univMatrix)" strokeWidth="2" />
          <circle cx="32" cy="32" r="20" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5 3" />
          <polygon points="32,8 54,48 10,48" fill="none" stroke="url(#univMatrix)" strokeWidth="2" />
          <polygon points="32,56 10,16 54,16" fill="none" stroke="#00e5ff" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="6" fill="#ffffff" />
        </svg>
      );

    case 'gift-100k':
    case 'universe-100k':
    case 'cosmic-supernova':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClasses} ${className}`}>
          <defs>
            <linearGradient id="supCosmicGold" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#00e5ff" />
              <stop offset="40%" stopColor="#d500f9" />
              <stop offset="65%" stopColor="#ff1744" />
              <stop offset="85%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ff6d00" />
            </linearGradient>
            <radialGradient id="supSuperGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#00e5ff" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#d500f9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff1744" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#supSuperGlow)" />
          <polygon points="32,4 37,23 56,23 41,34 47,53 32,42 17,53 23,34 8,23 27,23" fill="url(#supCosmicGold)" stroke="#ffffff" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="32,14 35,27 48,27 38,34 42,47 32,39 22,47 26,34 16,27 29,27" fill="#ffffff" fillOpacity="0.8" />
          <circle cx="32" cy="32" r="7" fill="#ffffff" stroke="#00e5ff" strokeWidth="2" />
        </svg>
      );
  }
};
