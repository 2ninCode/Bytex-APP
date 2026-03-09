import React from 'react';

export const BytexIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} fill="none">
    <defs>
      <linearGradient id="bx-left" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="bx-right" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <polygon points="5,8 28,8 50,42 72,8 95,8 62,52 95,96 72,96 50,62 28,96 5,96 38,52" fill="url(#bx-left)" />
    <clipPath id="bx-right-clip"><rect x="50" y="0" width="50" height="100" /></clipPath>
    <polygon points="5,8 28,8 50,42 72,8 95,8 62,52 95,96 72,96 50,62 28,96 5,96 38,52"
      fill="url(#bx-right)" clipPath="url(#bx-right-clip)" />
    {[{ cx: 78, cy: 6, r: 2.5 }, { cx: 85, cy: 10, r: 2 }, { cx: 91, cy: 15, r: 1.6 }, { cx: 82, cy: 2, r: 1.8 },
    { cx: 88, cy: 6, r: 1.4 }, { cx: 93, cy: 10, r: 1.1 }, { cx: 95, cy: 3, r: 1.6 }, { cx: 89, cy: 0, r: 1.2 }]
      .map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#38bdf8" opacity={0.8 - i * 0.06} />)}
  </svg>
);
