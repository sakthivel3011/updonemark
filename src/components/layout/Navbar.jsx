import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, UserPlus } from 'lucide-react';
import DarkModeToggle from '../ui/DarkModeToggle';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, userStatus, loading } = useAuth();

  // Check if user has previously signed up (localStorage check)
  const hasUserSignedUp = () => {
    return localStorage.getItem('has_registered') === 'true' || localStorage.getItem('auth_user') !== null || localStorage.getItem('auth_credentials') !== null;
  };

  // Determine if we should show Signup or Login
  const shouldShowSignup = !user && !hasUserSignedUp();

  const getDashboardLink = () => {
    if (userRole === 'coordinator' && userStatus === 'pending') {
      return '/coordinator/waiting-approval';
    }
    if (userRole === 'coordinator') return '/coordinator/dashboard';
    if (userRole === 'collegeadmin') return '/collegeadmin/dashboard';
    return '/superadmin/dashboard';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-white dark:bg-neutral-900 shadow-xl shadow-black/10 dark:shadow-black/30 py-2 border-b border-gray-100 dark:border-white/10' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50">
          <img src="/logo1.png" alt="UpDone Mark Logo" className="h-9 md:h-11 object-contain dark:hidden" />
          <img src="/logo.png" alt="UpDone Mark Logo" className="h-9 md:h-11 object-contain hidden dark:block" />
        </Link>

        {/* Desktop Menu - Premium Glassmorphism */}
        <div className={`hidden md:flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ${scrolled ? 'bg-gray-100/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-inner border border-gray-200 dark:border-white/10' : 'bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10'}`}>
          <button onClick={() => handleScrollTo('home')} className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 ${scrolled ? 'text-navy dark:text-white hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm' : 'text-navy dark:text-white hover:bg-white/20 dark:hover:bg-white/10'}`}>Home</button>
          <button onClick={() => handleScrollTo('about')} className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 ${scrolled ? 'text-navy dark:text-white hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm' : 'text-navy dark:text-white hover:bg-white/20 dark:hover:bg-white/10'}`}>About</button>
          <Link to="/features" className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 ${scrolled ? 'text-navy dark:text-white hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm' : 'text-navy dark:text-white hover:bg-white/20 dark:hover:bg-white/10'}`}>Features</Link>
          <button onClick={() => { setMobileMenuOpen(false); navigate('/contact'); }} className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 ${scrolled ? 'text-navy dark:text-white hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm' : 'text-navy dark:text-white hover:bg-white/20 dark:hover:bg-white/10'}`}>Contact</button>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <DarkModeToggle />
          
          {!loading && !user && (
            <Link 
              to={shouldShowSignup ? "/coordinator-signup" : "/coordinator-login"}
              className="bg-teal hover:bg-teal-deep text-white font-bold flex items-center gap-2 py-2.5 px-6 rounded-full shadow-lg hover:shadow-teal/30 transition-all transform hover:-translate-y-0.5 text-sm"
            >
              {shouldShowSignup ? <UserPlus size={16} /> : <User size={16} />}
              {shouldShowSignup ? "Signup" : "Login"}
            </Link>
          )}
          
          {!loading && user && (
            <Link 
              to={getDashboardLink()}
              className="bg-teal hover:bg-teal-deep text-white font-bold flex items-center gap-2 py-2.5 px-6 rounded-full shadow-lg hover:shadow-teal/30 transition-all transform hover:-translate-y-0.5 text-sm"
            >
              <User size={16} /> {userRole === 'coordinator' && userStatus === 'pending' ? 'Status' : 'Dashboard'}
            </Link>
          )}
        </div>

        {/* Mobile Toggle - Clean 3 Lines */}
        <button className={`md:hidden z-50 p-2 transition-all duration-300 ${mobileMenuOpen ? 'text-red-600 dark:text-red-400 rotate-90' : 'text-navy dark:text-white hover:scale-110'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} strokeWidth={3} /> : <Menu size={28} strokeWidth={2} />}
        </button>
      </div>

      {/* Premium Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-navy/90 backdrop-blur-lg z-[60] transition-all duration-500 md:hidden ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setMobileMenuOpen(false)}></div>
      
      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-gradient-to-b from-white to-offwhite dark:from-neutral-900 dark:to-navy shadow-2xl z-[70] flex flex-col md:hidden transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header with Dark Mode and Close X */}
        <div className="flex items-center justify-between p-6">
          <DarkModeToggle />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-navy dark:text-white hover:text-teal dark:hover:text-teal transition-all duration-300 transform hover:scale-110 hover:rotate-90"
            aria-label="Close menu"
          >
            <X size={28} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex flex-col gap-6 text-lg font-semibold overflow-y-auto px-8 pb-8 flex-1">
          <button onClick={() => handleScrollTo('home')} className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-white/20 text-navy dark:text-white group">
            Home <span className="opacity-0 group-hover:opacity-100 transition-opacity text-teal">→</span>
          </button>
          <button onClick={() => handleScrollTo('about')} className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-white/20 text-navy dark:text-white group">
            About <span className="opacity-0 group-hover:opacity-100 transition-opacity text-teal">→</span>
          </button>
          <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-white/20 text-navy dark:text-white group">
            Features <span className="opacity-0 group-hover:opacity-100 transition-opacity text-teal">→</span>
          </Link>
          <button onClick={() => { setMobileMenuOpen(false); navigate('/contact'); }} className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-white/20 text-navy dark:text-white group">
            Contact <span className="opacity-0 group-hover:opacity-100 transition-opacity text-teal">→</span>
          </button>
          
          <div className="mt-8 flex flex-col gap-4">
            {!loading && !user && (
              <Link 
                to={shouldShowSignup ? "/coordinator-signup" : "/coordinator-login"} 
                onClick={() => setMobileMenuOpen(false)} 
                className="bg-gradient-to-r from-teal to-teal-deep text-white font-bold py-3.5 px-6 rounded-xl text-center shadow-lg shadow-teal/20 flex items-center justify-center gap-2"
              >
                {shouldShowSignup ? <UserPlus size={18} /> : <User size={18} />}
                {shouldShowSignup ? "Coordinator Signup" : "Coordinator Login"}
              </Link>
            )}
            
            {!loading && user && (
              <Link 
                to={getDashboardLink()} 
                onClick={() => setMobileMenuOpen(false)} 
                className="bg-gradient-to-r from-teal to-teal-deep text-white font-bold py-3.5 px-6 rounded-xl text-center shadow-lg shadow-teal/20 flex items-center justify-center gap-2"
              >
                <User size={18} /> {userRole === 'coordinator' && userStatus === 'pending' ? 'Status' : 'Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
