import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-offwhite/80 dark:bg-navy/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center">
        {/* Simple Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-3 border-teal/20 rounded-full"></div>
          <div className="absolute inset-0 border-3 border-teal rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
      </div>
    </div>
  );
}
