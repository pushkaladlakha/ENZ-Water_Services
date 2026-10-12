import React from 'react';

interface TaumataArowaiLogoProps {
  className?: string;
  theme?: 'dark' | 'light'; // dark = for #071A35 background (white typography), light = for white/light background (#071A35 typography)
  compact?: boolean;
}

export const TaumataArowaiLogo: React.FC<TaumataArowaiLogoProps> = ({
  className = 'h-9 w-auto',
  theme = 'dark',
  compact = false,
}) => {
  const isLight = theme === 'light';
  const textColor = isLight ? '#071A35' : '#FFFFFF';
  const lineColor = isLight ? '#071A35' : '#7DD3FC';
  const subtextColor = isLight ? '#071A35' : '#E2E8F0';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Geometric Diamond Emblem */}
      <svg
        viewBox="0 0 54 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0 select-none"
        aria-label="Taumata Arowai Emblem"
      >
        {/* Top Triangle (#071A35 on light, or #38BDF8 on navy background for contrast) */}
        <polygon points="27,2 53,36 1,36" fill={isLight ? '#071A35' : '#38BDF8'} />
        {/* Mosaic Lattice (Row 1) */}
        <polygon points="1,37 14,37 7.5,45" fill="#003B5C" />
        <polygon points="14,37 27,37 20.5,45" fill="#005B7F" />
        <polygon points="27,37 40,37 33.5,45" fill="#005B7F" />
        <polygon points="40,37 53,37 46.5,45" fill="#003B5C" />
        <polygon points="7.5,45 20.5,45 14,37" fill="#007A87" />
        <polygon points="20.5,45 33.5,45 27,37" fill="#008E9B" />
        <polygon points="33.5,45 46.5,45 40,37" fill="#007A87" />
        {/* Row 2 */}
        <polygon points="7.5,45 20.5,45 14,53" fill="#008E9B" />
        <polygon points="20.5,45 33.5,45 27,53" fill="#00A3A6" />
        <polygon points="33.5,45 46.5,45 40,53" fill="#008E9B" />
        <polygon points="14,53 27,53 20.5,45" fill="#00B2A9" />
        <polygon points="27,53 40,53 32.5,45" fill="#00B2A9" />
        {/* Row 3 */}
        <polygon points="14,53 27,53 20.5,61" fill="#00C1D5" />
        <polygon points="27,53 40,53 33.5,61" fill="#00C1D5" />
        <polygon points="20.5,61 33.5,61 27,53" fill="#4DD0E1" />
        {/* Row 4 Tip */}
        <polygon points="20.5,61 33.5,61 27,69" fill="#80DEEA" />
      </svg>

      {/* Official Typography */}
      {!compact && (
        <div className="flex flex-col justify-center leading-none">
          <span 
            className="text-[11px] font-medium tracking-tight"
            style={{ color: subtextColor }}
          >
            Water Services Authority
          </span>
          <div 
            className="my-[2.5px] h-[1px] w-full max-w-[150px]"
            style={{ backgroundColor: lineColor, opacity: isLight ? 0.8 : 0.6 }}
          />
          <span 
            className="text-[13px] font-bold tracking-tight"
            style={{ color: textColor }}
          >
            Taumata Arowai
          </span>
        </div>
      )}
    </div>
  );
};
