import React from 'react';
import './AuroraBackgroundResponsive.css';

const AuroraBackground = () => {
  return (
    <div className="aurora-background-wrapper fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background - Blue/Cyan for light, Mint/Green for dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50 to-sky-50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900 transition-colors duration-500" />
      
      {/* Aurora effect 1 - Cyan/Blue tones (light) / Mint tones (dark) */}
      <div 
        className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 via-sky-400/20 to-transparent dark:from-emerald-500/25 dark:via-green-500/15 rounded-full blur-3xl"
        style={{
          animation: 'aurora-1 20s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 2 - Sky/Blue tones (light) / Green tones (dark) */}
      <div 
        className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-sky-400/35 via-cyan-500/25 to-transparent dark:from-green-500/20 dark:via-emerald-600/15 rounded-full blur-3xl"
        style={{
          animation: 'aurora-2 25s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 3 - Bright cyan (light) / Fresh mint (dark) */}
      <div 
        className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-500/25 via-blue-400/20 to-transparent dark:from-emerald-400/20 dark:via-green-500/15 rounded-full blur-3xl"
        style={{
          animation: 'aurora-3 30s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 4 - Accent blue (light) / Jade green (dark) */}
      <div 
        className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 bg-gradient-to-tl from-blue-400/25 via-cyan-500/20 to-transparent dark:from-emerald-400/20 dark:via-green-600/15 rounded-full blur-3xl"
        style={{
          animation: 'aurora-4 22s ease-in-out infinite',
        }}
      />
      
      {/* Additional floating blob for more depth - Turquoise (light) / Mint (dark) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-gradient-to-r from-cyan-400/15 via-sky-400/10 to-transparent dark:from-emerald-500/15 dark:via-green-500/10 rounded-full blur-3xl"
        style={{
          animation: 'aurora-1 35s ease-in-out infinite reverse',
        }}
      />
      
      {/* Subtle grid overlay for depth - cyan tint */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default AuroraBackground;

