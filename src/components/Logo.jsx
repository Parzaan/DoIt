import React from 'react';

export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* Outer Glow Circle */}
      <circle cx="50" cy="50" r="48" stroke="url(#logoGradient)" strokeWidth="4" strokeDasharray="200 100" />
      {/* The "D" Symbol */}
      <path d="M35 30V70H50C62 70 70 60 70 50C70 40 62 30 50 30H35Z" fill="url(#logoGradient)" />
      {/* Precision Dot */}
      <circle cx="75" cy="75" r="6" fill="#22d3ee" />
    </svg>
  );
}