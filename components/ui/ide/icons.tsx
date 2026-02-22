import React from 'react';

export const TSIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <defs>
      <linearGradient id="tsGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4FA3FF"/>
        <stop offset="100%" stopColor="#3178C6"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="22" fill="url(#tsGrad)"/>
    <rect x="6" y="6" width="116" height="116" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="3"/>
    <text x="64" y="88" textAnchor="middle" fontSize="56" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="2">TS</text>
  </svg>
);

export const JSIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <defs>
      <linearGradient id="jsGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF176"/>
        <stop offset="100%" stopColor="#F7DF1E"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="22" fill="url(#jsGrad)"/>
    <rect x="6" y="6" width="116" height="116" rx="18" fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="3"/>
    <text x="64" y="88" textAnchor="middle" fontSize="58" fontWeight="900" fill="#111" fontFamily="Arial" letterSpacing="2">JS</text>
  </svg>
);

export const PythonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <path fill="#306998" d="M63 12c-25 0-23 11-23 11v12h23v4H31s-15-1-15 23 13 23 13 23h8v-12s0-13 13-13h23s13 0 13-12V23s2-11-23-11z"/>
    <circle cx="52" cy="25" r="4" fill="#fff"/>
    <path fill="#FFD43B" d="M65 116c25 0 23-11 23-11V93H65v-4h32s15 1 15-23-13-23-13-23h-8v12s0 13-13 13H55s-13 0-13 12v25s-2 11 23 11z"/>
    <circle cx="76" cy="103" r="4" fill="#fff"/>
  </svg>
);

export const HTMLIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <path fill="#E44D26" d="M19 3l9 100 36 10 36-10 9-100z"/>
    <path fill="#F16529" d="M64 113l29-8 8-90H64z"/>
    <text x="64" y="70" textAnchor="middle" fontSize="38" fontWeight="bold" fill="white" fontFamily="Arial">HTML</text>
    <text x="64" y="98" textAnchor="middle" fontSize="32" fontWeight="bold" fill="white" fontFamily="Arial">5</text>
  </svg>
);

export const CSSIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <path fill="#1572B6" d="M19 3l9 100 36 10 36-10 9-100z"/>
    <path fill="#33A9DC" d="M64 113l29-8 8-90H64z"/>
    <text x="64" y="78" textAnchor="middle" fontSize="42" fontWeight="bold" fill="white" fontFamily="Arial">CSS</text>
  </svg>
);

export const ReactIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <rect width="128" height="128" fill="#20232a" rx="15"/>
    <circle cx="64" cy="64" r="11" fill="#61DAFB"/>
    <g fill="none" stroke="#61DAFB" strokeWidth="6">
      <ellipse cx="64" cy="64" rx="54" ry="24"/>
      <ellipse cx="64" cy="64" rx="54" ry="24" transform="rotate(60 64 64)"/>
      <ellipse cx="64" cy="64" rx="54" ry="24" transform="rotate(120 64 64)"/>
    </g>
  </svg>
);

export const JSONIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 128 128" className={className}>
    <rect width="128" height="128" fill="#292929" rx="15"/>
    <path fill="#F0DB4F" d="M2,64c0-34.2,27.8-62,62-62s62,27.8,62,62s-27.8,62-62,62S2,98.2,2,64z" transform="scale(0.8) translate(16,16)"/>
    <text x="64" y="80" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#F0DB4F" fontFamily="Arial">JSON</text>
  </svg>
);
