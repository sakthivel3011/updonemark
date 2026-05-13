import React from 'react';

export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-offwhite dark:bg-navy">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-teal/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-teal rounded-full border-t-transparent animate-spin-slow"></div>
        <div className="absolute inset-2 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-2 border-4 border-primary rounded-full border-b-transparent animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
      </div>
    </div>
  );
}
