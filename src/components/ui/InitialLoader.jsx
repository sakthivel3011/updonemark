import React, { useState, useEffect } from 'react';

export default function InitialLoader({ onComplete }) {
  const [loadingText, setLoadingText] = useState('Initializing System...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const texts = [
      'Initializing System...',
      'Waking up servers...',
      'Preparing your experience...',
      'Almost there...'
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 800);

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Wait for fade out animation
    }, 3000); // Total loading time reduced slightly

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-white dark:bg-navy flex flex-col items-center justify-center transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center animate-fade-in-simple">
        {/* Simple Icon */}
        <img src="/icon.png" alt="UpDone Icon" className="w-20 h-20 md:w-24 md:h-24 object-contain mb-6" />

        {/* Simple Text */}
        <div 
          className="text-4xl md:text-5xl font-bold text-navy dark:text-white mb-6 flex gap-3 tracking-wide"
          style={{ fontFamily: "'Comfortaa', cursive" }}
        >
          <span>updone</span>
          <span className="text-teal">mark</span>
        </div>

        {/* Auto changing text */}
        <div className="h-6 overflow-hidden relative w-64 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-opacity duration-300">
            {loadingText}
          </p>
        </div>
      </div>
      
      {/* Simple Progress Bar */}
      

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap');
        
        @keyframes fade-in-simple {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-fade-in-simple {
          animation: fade-in-simple 0.8s ease-out forwards;
        }
        .animate-progress {
          animation: progress 3s cubic-bezier(0.1, 0.7, 0.1, 1) forwards;
        }
      `}</style>
    </div>
  );
}
