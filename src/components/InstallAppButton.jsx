import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Share2, X, PlusSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSSafari = isIOSDevice && isSafari;
    setIsIOS(isIOSSafari || isIOSDevice);

    // Check if the global prompt is already available
    if (window.deferredPWAInstallPrompt) {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      setIsInstallable(true);
    }

    // Listen for the custom event in case it fires after mount
    const handlePWAInstallable = () => {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      toast.success('App installed successfully!');
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show banner after a delay
    let iosTimer;
    if (isIOSSafari || isIOSDevice) {
      iosTimer = setTimeout(() => {
        if (!bannerDismissed && !isStandalone) {
          setShowIOSBanner(true);
        }
      }, 5000);
    } else {
      // For Android, show button if installable
      const checkInstallable = setTimeout(() => {
        if (!isInstallable && !isStandalone) {
          setIsInstallable(true);
        }
      }, 3000);
      return () => clearTimeout(checkInstallable);
    }

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(iosTimer);
    };
  }, [isInstallable, isInstalled, bannerDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS Safari - show the banner
      if (isIOS) {
        setShowIOSBanner(true);
        return;
      }
      // For other browsers without prompt
      const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      if (isDesktop) {
        toast('To install: click the install icon (monitor with arrow) in your address bar', {
          duration: 6000,
          icon: '💻'
        });
      } else {
        toast('To install: tap your browser menu and select "Add to Home Screen"', {
          duration: 5000,
          icon: '📱'
        });
      }
      return;
    }

    // Show our custom modal first
    setShowModal(true);
  };

  const handleConfirmInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt (Android/Chrome)
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      setIsInstallable(false);
      setShowModal(false);
    } else {
      setShowModal(false);
    }
  };

  const dismissBanner = () => {
    setShowIOSBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('updone_install_banner_dismissed', 'true');
  };

  // Check if banner was previously dismissed
  useEffect(() => {
    if (localStorage.getItem('updone_install_banner_dismissed') === 'true') {
      setBannerDismissed(true);
    }
  }, []);

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle2 size={16} />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <>
      {/* iOS Safari Install Banner - Fixed at bottom */}
      {isIOS && showIOSBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 p-4 animate-slide-up">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="w-14 h-14 bg-teal/20 rounded-2xl flex items-center justify-center shrink-0">
              <img src="/icon.png" alt="App" className="w-10 h-10 rounded-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm">Install UpDone Mark</h4>
              <p className="text-white/70 text-xs mt-0.5">
                Add to Home Screen for quick access
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-teal-light">
                <Share2 size={12} />
                <span>Tap share button</span>
                <span className="text-white/40">→</span>
                <PlusSquare size={12} />
                <span>Add to Home Screen</span>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="p-2 text-white/50 hover:text-white transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Custom Install Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 animate-fade-up">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-teal to-primary rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/icon.png" alt="UpDone Mark" className="w-12 h-12 object-contain" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-navy dark:text-white text-center mb-2">
              Install UpDone Mark
            </h3>

            {/* Description */}
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
              Get quick access to your dashboard and manage events seamlessly. Install the app for a better experience!
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 size={18} className="text-teal flex-shrink-0" />
                <span>Quick access from home screen</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 size={18} className="text-teal flex-shrink-0" />
                <span>Works beautifully offline</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle2 size={18} className="text-teal flex-shrink-0" />
                <span>Full screen experience</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInstall}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal to-primary text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-teal/25 transition-all"
              >
                <Download size={18} />
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Button for Footer */}
      <button
        onClick={handleInstallClick}
        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal to-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        <Download size={18} className="group-hover:animate-bounce" />
        <span>{isIOS ? 'Get App' : 'Install App'}</span>
      </button>
    </>
  );
}
