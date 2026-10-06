import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  followersCount?: number;
  verified?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  followersCount = 0,
  verified = false,
  size = 'sm',
  className = ''
}) => {
  // STRICT RULE: Creator MUST have at least 10,000 followers (10k+) to get the check mark!
  // If the creator has fewer than 10,000 followers, NEVER show the check mark badge.
  if (followersCount < 10000) {
    return null;
  }
  const isMilestone = true;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-blue-500 to-cyan-400 text-white shadow-[0_0_8px_rgba(14,165,233,0.8)] ring-1 ring-white/50 shrink-0 select-none ${sizeClasses} ${className}`}
      title={isMilestone ? `Verified Creator (${followersCount.toLocaleString()} Followers)` : 'Verified Creator'}
    >
      <Check className={`${iconSizes} stroke-[3.5] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`} />
    </span>
  );
};
