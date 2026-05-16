import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Monitor, Smartphone, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { isSuperAdminAuthenticated } from '../../utils/superAdminAuth';
import { toast } from 'react-hot-toast';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const toastShownRef = useRef(false); // guard: show success toast only once
  const { user, userRole } = useAuth();
  const location = useLocation();

  // Don't show on student scan pages or specific internal auth pages
  const isExcludedPage = 
    location.pathname === '/scan' || 
    location.pathname.startsWith('/e/') || 
    location.pathname === '/coordinator/waiting-approval';

  // Check if app is already installed
  useEffect(() => {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Only proceed if not already installed and not on an excluded page
    if (isExcludedPage || isInstalled) return;

    // Check if the prompt is already available globally
    if (window.deferredPWAInstallPrompt) {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      if (!localStorage.getItem('updone_install_dismissed')) {
        setShowBanner(true);
      }
    }

    const handlePWAInstallable = () => {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      // Show banner reminder
      if (!localStorage.getItem('updone_install_dismissed')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);

    // Check if already installed
    const handleAppInstalled = () => {
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      window.deferredPWAInstallPrompt = null;
      localStorage.setItem('updone_install_dismissed', 'true');
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast.success('UpDone Mark installed successfully! 🎉');
      }
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isExcludedPage, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setShowModal(false);
      localStorage.setItem('updone_install_dismissed', 'true');
      window.deferredPWAInstallPrompt = null;
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowModal(false);
    localStorage.setItem('updone_install_dismissed', 'true');
  };

  const handleModalDismiss = () => {
    setShowModal(false);
    // Don't permanently dismiss, show banner instead
    setShowBanner(true);
  };

  // Don't render if on excluded pages or already installed
  if (isExcludedPage || isInstalled) return null;

  // Show Modal Popup for first-time install prompt
  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 animate-fade-up">
          {/* Close button */}
          <button
            onClick={handleModalDismiss}
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
              <CheckCircle size={18} className="text-teal flex-shrink-0" />
              <span>Quick access to dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle size={18} className="text-teal flex-shrink-0" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle size={18} className="text-teal flex-shrink-0" />
              <span>Instant notifications</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleModalDismiss}
              className="flex-1 btn-secondary !py-3 text-sm"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 btn-primary !py-3 text-sm flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Install Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Small banner for persistent reminder
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white dark:bg-navy-soft rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 border border-teal/20 flex gap-4 items-center animate-fade-up">
      <div className="w-12 h-12 bg-gradient-to-br from-teal to-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
        <Smartphone size={24} className="text-white" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-navy dark:text-white flex items-center gap-2">
          <Monitor size={14} className="text-teal" />
          Install App
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">Get quick access to your dashboard</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleInstall} className="bg-teal hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40">
          Install
        </button>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
