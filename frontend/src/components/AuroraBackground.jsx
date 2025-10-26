import React from 'react';

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-500" />
      
      {/* Aurora effect 1 - Purple/Pink */}
      <div 
        className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-400/30 via-pink-400/20 to-transparent dark:from-purple-600/20 dark:via-pink-600/10 rounded-full blur-3xl animate-aurora-1"
        style={{
          animation: 'aurora-1 20s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 2 - Blue/Cyan */}
      <div 
        className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-blue-400/30 via-cyan-400/20 to-transparent dark:from-blue-600/20 dark:via-cyan-600/10 rounded-full blur-3xl animate-aurora-2"
        style={{
          animation: 'aurora-2 25s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 3 - Medical theme */}
      <div 
        className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-medical-400/25 via-indigo-400/15 to-transparent dark:from-medical-600/15 dark:via-indigo-600/10 rounded-full blur-3xl animate-aurora-3"
        style={{
          animation: 'aurora-3 30s ease-in-out infinite',
        }}
      />
      
      {/* Aurora effect 4 - Accent */}
      <div 
        className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 bg-gradient-to-tl from-violet-400/20 via-fuchsia-400/15 to-transparent dark:from-violet-600/15 dark:via-fuchsia-600/10 rounded-full blur-3xl animate-aurora-4"
        style={{
          animation: 'aurora-4 22s ease-in-out infinite',
        }}
      />
      
      {/* Subtle grid overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default AuroraBackground;

