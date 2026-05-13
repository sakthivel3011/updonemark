import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CalendarDays, BarChart3, LogOut, ShieldCheck, Building2, Users, HardDrive, Mail, X, Activity, FileText, QrCode, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase/config';
import { isSuperAdminAuthenticated, clearSuperAdminAuth } from '../../utils/superAdminAuth';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { userRole, collegeName, clubName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (userRole === 'superadmin' || isSuperAdminAuthenticated()) {
      clearSuperAdminAuth();
      navigate('/');
    } else {
      auth.signOut();
      navigate('/');
    }
  };

  const menuItems = {
    superadmin: [
      { path: '/superadmin/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
      { path: '/superadmin/colleges', label: 'Colleges', icon: <Building2 size={20} /> },
      { path: '/superadmin/admins', label: 'College Admins', icon: <Users size={20} /> },
      { path: '/superadmin/backup', label: 'Backup Center', icon: <HardDrive size={20} /> },
      { path: '/superadmin/messages', label: 'Messages', icon: <Mail size={20} /> },
    ],
    collegeadmin: [
      { path: '/collegeadmin/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
      { path: '/collegeadmin/coordinators', label: 'Coo-Approvals', icon: <Users size={20} /> },
      { path: '/collegeadmin/clubs', label: 'Club Management', icon: <ShieldCheck size={20} /> },
      { path: '/collegeadmin/attendance', label: 'Check-Attendance', icon: <FileText size={20} /> },
      { path: '/collegeadmin/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    ],
    coordinator: [
      { path: '/coordinator/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { path: '/coordinator/event/new', label: 'Add New Event', icon: <PlusCircle size={20} /> },
      { path: '/coordinator/live-attendance', label: 'Live Attendance', icon: <Activity size={20} /> },
      { path: '/coordinator/qr-codes', label: 'QR Codes', icon: <QrCode size={20} /> },
      { path: '/coordinator/attendance-records', label: 'Attendance Records', icon: <FileText size={20} /> },
      { path: '/coordinator/history', label: 'Event History', icon: <CalendarDays size={20} /> },
    ]
  };

  // Check if super admin is authenticated via sessionStorage
  const isSuperAdmin = isSuperAdminAuthenticated();
  const effectiveRole = isSuperAdmin ? 'superadmin' : userRole;
  const items = effectiveRole ? menuItems[effectiveRole] : menuItems['superadmin']; // fallback for superadmin using sessionstorage

  // Determine display role and whether to show college info
  const displayRole = isSuperAdmin ? 'SUPERADMIN' : (userRole || '').toUpperCase();
  const showCollegeInfo = !isSuperAdmin && (collegeName || clubName);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-navy/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
      )}

      {/* Sidebar Container - Right side on mobile, Left on desktop */}
      <aside className={`fixed inset-y-0 right-0 lg:left-0 w-72 bg-white dark:bg-navy-soft border-l lg:border-l-0 lg:border-r border-gray-200 dark:border-white/5 flex flex-col z-50 transition-all duration-500 ease-out cubic-bezier(0.4, 0, 0.2, 1) ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:-translate-x-0'}`}>

        {/* Brand */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="UpDone Mark Icon" className="w-10 h-10 object-contain drop-shadow-md" />
            <div>
              <h1 className="font-bold text-xl text-teal dark:text-teal-light tracking-tight">UpDone Mark</h1>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider">{displayRole}</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold transition-colors"
            aria-label="Close sidebar"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* User Context Info (College/Club) - Only show for non-superadmin users */}
        {showCollegeInfo && (
          <div className="px-6 mb-6">
            <div className="bg-offwhite dark:bg-navy p-4 rounded-xl border border-gray-100 dark:border-white/5">
              {collegeName && <p className="text-sm font-semibold text-navy dark:text-white truncate">{collegeName}</p>}
              {clubName && <p className="text-xs text-teal mt-1 flex items-center gap-1"><ShieldCheck size={12} /> {clubName}</p>}
            </div>
          </div>
        )}

        {/* Navigation with staggered animation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {items.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              end={item.path.endsWith('dashboard')} // Match exact for dashboard
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ease-out transform hover:scale-[1.02] hover:translate-x-1
                ${isActive
                  ? 'bg-gradient-to-r from-teal/20 to-teal/5 text-teal dark:text-teal-light shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white hover:shadow-sm'}
              `}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rust hover:bg-rust/10 transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
