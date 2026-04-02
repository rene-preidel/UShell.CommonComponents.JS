import React from 'react';

// Icon from Heroicons (https://heroicons.com) – MIT License
const RevertIcon: React.FC<{ rotate?: number; size?: number; strokeWidth?: number }> = ({
  rotate,
  size = 1.5,
  strokeWidth = 1.5,
}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={strokeWidth}
      stroke='currentColor'
      className='size-6 transition-all'
      style={{ rotate: `${rotate}deg`, width: `${size}rem`, height: `${size}rem` }}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3'
      />
    </svg>
  )
}

export default RevertIcon;
