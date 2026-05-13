import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ArrowUpRight, Heart, Sparkles, Globe, ExternalLink, User, GraduationCap, Shield, LogIn } from 'lucide-react';
import InstallAppButton from '../InstallAppButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const webLinks = [
    { icon: Globe, href: "https://updone.vercel.app", label: "Main Website", color: "hover:bg-teal", external: true },
    { icon: ExternalLink, href: "#", label: "UpDone Blog", color: "hover:bg-primary", external: true },
  ];



  const quickLinks = [
    { name: "Home", href: "/" },
   
    { name: "Features", href: "/features" },
    { name: "Contact", href: "/contact" },
  ];

  const portalLinks = [
    { name: "Login Selector", href: "/login-selector" },
    { name: "Coordinator Login", href: "/coordinator-login" },
    { name: "College Admin Login", href: "/collegeadmin-login" },
    
  ];

  return (
    <footer className="relative bg-navy dark:bg-navy-deep text-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8">
        
        {/* Top Section - Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 pb-10 sm:pb-16 border-b border-white/10">
          
          {/* Left Side - Big Branding */}
          <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
            {/* Big Logo */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img 
                  src="/logo.png" 
                  alt="UpDone Mark" 
                  className="h-16 md:h-20 object-contain hidden dark:block drop-shadow-2xl mx-auto lg:mx-0" 
                />
                <img 
                  src="/logo1.png" 
                  alt="UpDone Mark" 
                  className="h-16 md:h-20 object-contain dark:hidden drop-shadow-2xl brightness-0 invert mx-auto lg:mx-0" 
                />
              </Link>
              <p className="text-white/60 text-sm max-w-sm leading-relaxed mx-auto lg:mx-0">
               Our mission is to simplify digital experiences through innovation and technology — Done Right.
              </p>
            </div>

            {/* Web Links */}
            

            

          </div>

          {/* Right Side - Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 text-center">
            
            {/* Quick Links */}
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start gap-2">
                Quick Links
              </h4>
              <ul className="space-y-3 w-full">
                {quickLinks.map((link, index) => (
                  <li key={index} className="flex justify-center sm:justify-start">
                    {link.href.startsWith('#') ? (
                      <button
                        onClick={() => document.getElementById(link.href.slice(1))?.scrollIntoView({behavior:'smooth'})}
                        className="group flex items-center gap-2 text-white/60 hover:text-teal-light transition-all duration-300 text-sm"
                      >
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        {link.name}
                      </button>
                    ) : (
                      <Link
                        to={link.href}
                        className="group flex items-center gap-2 text-white/60 hover:text-teal-light transition-all duration-300 text-sm"
                      >
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start gap-2">
                Portals
              </h4>
              <ul className="space-y-3 w-full">
                {portalLinks.map((link, index) => (
                  <li key={index} className="flex justify-center sm:justify-start">
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-white/60 hover:text-teal-light transition-all duration-300 text-sm"
                    >
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start gap-2">
                Contact Us
              </h4>
              <ul className="space-y-4 w-full">
                <li className="flex justify-center sm:justify-start">
                  <a
                    href="mailto:uppdone@gmail.com"
                    className="group flex items-center gap-3 text-white/60 hover:text-teal-light transition-all duration-300"
                  >
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-sm">uppdone@gmail.com</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-white/40 text-sm">
            © {currentYear} UpDone. <a href="https://updone.vercel.app" target="_blank" rel="noopener noreferrer">
              <span>Developed by <span className="text-teal-light font-semibold">UpDone</span></span>
            </a>
          </p>
          <div className="flex items-center gap-2 text-sm text-white/50">
            
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm">
            <a href="https://updone.vercel.app/privacy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-teal-light transition-colors">
              Privacy Policy
            </a>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block"></span>
            <a href="https://updone.vercel.app/terms" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-teal-light transition-colors">
              Terms of Service
            </a>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block"></span>
            <InstallAppButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

