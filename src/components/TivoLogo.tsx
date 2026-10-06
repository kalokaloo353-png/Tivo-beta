import React from 'react';

interface TivoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const TivoLogo: React.FC<TivoLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = ''
}) => {
  const sizeMap = {
    sm: { text: 'text-xl' },
    md: { text: 'text-2xl' },
    lg: { text: 'text-3xl' },
    xl: { text: 'text-5xl' },
  };

  const { text } = sizeMap[size];

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center">
        {/* Wordmark in Pure High-End Typography - Logo symbol removed */}
        <span className={`font-black tracking-tight text-white font-['Plus_Jakarta_Sans'] ${text}`}>
          TIVO
        </span>
      </div>

      {showTagline && (
        <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-medium mt-0.5">
          Watch · Create · Connect
        </span>
      )}
    </div>
  );
};
