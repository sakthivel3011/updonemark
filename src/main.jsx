import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './index.css';

// Global handler to catch the beforeinstallprompt event early
window.deferredPWAInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  window.deferredPWAInstallPrompt = e;
  // Dispatch a custom event so React components know it's ready
  window.dispatchEvent(new Event('pwa-installable'));
});

// Register Service Worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('SW registered: ', registration);
    })
    .catch((error) => {
      console.log('SW registration failed: ', error);
    });
}

AOS.init({
  duration: 800,
  once: true,
  offset: 100,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'dark:bg-navy-soft dark:text-offwhite',
            style: {
              borderRadius: '8px',
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #e5e5e5',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
            error: {
              iconTheme: {
                primary: '#ff8c00',
                secondary: '#ffffff',
              },
              style: {
                borderRadius: '8px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                padding: '12px 16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
              style: {
                borderRadius: '8px',
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                padding: '12px 16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
