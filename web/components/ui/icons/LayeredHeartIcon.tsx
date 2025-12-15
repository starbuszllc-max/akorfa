'use client';

interface LayeredHeartIconProps {
  isActive?: boolean;
  className?: string;
}

export default function LayeredHeartIcon({ isActive = false, className = '' }: LayeredHeartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} layered-heart-icon`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
        transition: 'all 0.2s cubic-bezier(0.05, 0, 0, 1)'
      }}
    >
      {/* Bottom layer: Black stroke outline (2px) */}
      <path
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        stroke="black"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Middle layer: White fill background */}
      <path
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        fill="white"
        opacity={0.95}
      />
      
      {/* Top layer: Colored fill */}
      <path
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        fill={isActive ? '#FF0000' : 'currentColor'}
        opacity={isActive ? 1 : 1}
        style={{
          transition: 'fill 0.2s cubic-bezier(0.05, 0, 0, 1), opacity 0.2s cubic-bezier(0.05, 0, 0, 1)'
        }}
      />
    </svg>
  );
}
