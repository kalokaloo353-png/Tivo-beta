import React from 'react';

interface TakoMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isThinking?: boolean;
}

export const TakoMascot: React.FC<TakoMascotProps> = ({
  size = 'md',
  className = '',
  isThinking = false
}) => {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Subtle outer pulse aura */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 opacity-60 blur-sm ${
          isThinking ? 'animate-ping' : 'animate-pulse'
        }`} 
      />

      {/* Tako Mascot SVG */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 transition-transform ${isThinking ? 'animate-bounce' : 'hover:scale-110'}`}
      >
        <defs>
          <linearGradient id="tako-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="tako-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Mascot Body (Smooth dome octopus shape) */}
        <path
          d="M32 8C19 8 10 18 10 32C10 40 14 46 17 48C18.5 49 20 48 21 46.5C22.5 44 24.5 44 26 46.5C27.5 49 29.5 49 31 46.5C32.5 44 34.5 44 36 46.5C37.5 49 39.5 49 41 46.5C42.5 44 44.5 44 46 46.5C47 48 48.5 49 50 48C53 46 57 40 57 32C57 18 45 8 32 8Z"
          fill="url(#tako-gradient)"
        />

        {/* Top Highlight Glaze */}
        <path
          d="M32 11C21 11 14 19 14 28C17 21 24 16 32 16C40 16 47 21 50 28C50 19 43 11 32 11Z"
          fill="url(#tako-glow)"
        />

        {/* Cheerful Friendly Eyes */}
        {isThinking ? (
          <>
            {/* Thinking / Processing Eyes (Curved sparks) */}
            <path d="M22 28C24 26 27 26 29 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M35 28C37 26 40 26 42 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Big friendly glossy anime eyes */}
            <ellipse cx="24" cy="29" rx="4" ry="5.5" fill="#0F172A" />
            <ellipse cx="40" cy="29" rx="4" ry="5.5" fill="#0F172A" />

            {/* Eye sparkle highlights */}
            <circle cx="23" cy="27" r="1.8" fill="white" />
            <circle cx="25.5" cy="31" r="0.9" fill="white" />

            <circle cx="39" cy="27" r="1.8" fill="white" />
            <circle cx="41.5" cy="31" r="0.9" fill="white" />

            {/* Rosy Cheeks */}
            <ellipse cx="17" cy="35" rx="2.5" ry="1.2" fill="#F472B6" opacity="0.75" />
            <ellipse cx="47" cy="35" rx="2.5" ry="1.2" fill="#F472B6" opacity="0.75" />

            {/* Cute Smile */}
            <path d="M29 33.5C30.5 35.5 33.5 35.5 35 33.5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Sparkle Star on Top Right */}
        <path
          d="M48 10L49 14L53 15L49 16L48 20L47 16L43 15L47 14L48 10Z"
          fill="#FDE047"
          className="animate-spin-slow origin-center"
        />
      </svg>
    </div>
  );
};
