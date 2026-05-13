import React, { useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  QrCode, MapPin, ShieldCheck, Users, Building2, GraduationCap, 
  UserCog, BarChart3, Database, MessageCircle, Moon, Smartphone,
  Zap, Clock, Lock, Globe, Mail, History, CheckCircle2, Download,
  Bell, Search, PlusCircle, Settings, FileSpreadsheet, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100
    });
  }, []);

  return (
    <div className="min-h-screen bg-offwhite dark:bg-black font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-offwhite dark:bg-black overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal/10 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal-dark dark:text-teal-light text-sm font-medium mb-6">
            <Zap size={16} className="text-teal" />
            <span>Complete Feature Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-navy dark:text-white">
            All <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-primary">Features</span> You Need
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            UpDone Mark is a complete event attendance management system with QR-based check-ins, 
            GPS validation, multi-role access, and powerful analytics.
          </p>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Core Features</h2>
            <p className="text-gray-600 dark:text-gray-400">The heart of UpDone Mark</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="card group hover:shadow-card-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center text-teal mb-4 group-hover:scale-110 transition-transform">
                <QrCode size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy dark:text-white mb-3">Dynamic QR Codes</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Auto-refreshing QR codes every 30 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Prevents proxy attendance and screenshots</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Time-based authentication tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Each QR code is unique and expires automatically</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="card group hover:shadow-card-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <MapPin size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy dark:text-white mb-3">GPS Geofencing</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Set custom radius (50m - 500m) for each event</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Real-time location validation during check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>One-click location capture for coordinators</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Blocks attendance from outside venue</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="card group hover:shadow-card-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy dark:text-white mb-3">Anti-Proxy System</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Device fingerprinting technology</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>One device = One student check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Rate limiting prevents abuse</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-flag suspicious activities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">4 User Roles</h2>
            <p className="text-gray-600 dark:text-gray-400">Separate dashboards for each role</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Super Admin */}
            <div className="card border-t-4 border-t-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <UserCog size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy dark:text-white">Super Admin</h3>
                  <p className="text-xs text-gray-500">Platform Owner</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" />
                  <span>Add/Edit Colleges</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" />
                  <span>Manage College Admins</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" />
                  <span>View All Messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" />
                  <span>Database Backup</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary" />
                  <span>System Overview</span>
                </li>
              </ul>
            </div>

            {/* College Admin */}
            <div className="card border-t-4 border-t-teal">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy dark:text-white">College Admin</h3>
                  <p className="text-xs text-gray-500">College Manager</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-teal" />
                  <span>Manage Coordinators</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-teal" />
                  <span>Create/Manage Clubs</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-teal" />
                  <span>View Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-teal" />
                  <span>Department Stats</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-teal" />
                  <span>Coordinator Status</span>
                </li>
              </ul>
            </div>

            {/* Coordinator */}
            <div className="card border-t-4 border-t-rust">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-rust/10 flex items-center justify-center text-rust">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy dark:text-white">Coordinator</h3>
                  <p className="text-xs text-gray-500">Event Manager</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-rust" />
                  <span>Create Events</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-rust" />
                  <span>Generate QR Codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-rust" />
                  <span>Live Attendance View</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-rust" />
                  <span>Event History</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-rust" />
                  <span>Export Data</span>
                </li>
              </ul>
            </div>

            {/* Student */}
            <div className="card border-t-4 border-t-green-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy dark:text-white">Student</h3>
                  <p className="text-xs text-gray-500">Attendee</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Scan QR to Check-in</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Auto-fill Roll Number</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Department Detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Year Auto-calculation</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-green-500" />
                  <span>Instant Confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Event Management Features */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Event Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Complete event lifecycle management</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <PlusCircle className="text-teal" size={32} />
                <h3 className="text-xl font-bold text-navy dark:text-white">Create Events</h3>
              </div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal mt-0.5" />
                  <span>Set event name, date, and time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal mt-0.5" />
                  <span>Specify venue with location capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal mt-0.5" />
                  <span>Enable/disable GPS validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal mt-0.5" />
                  <span>Custom GPS radius per event</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <QrCode className="text-primary" size={32} />
                <h3 className="text-xl font-bold text-navy dark:text-white">QR Display</h3>
              </div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-primary mt-0.5" />
                  <span>Full-screen QR code display</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-primary mt-0.5" />
                  <span>30-second countdown timer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-primary mt-0.5" />
                  <span>Auto-refresh with animation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-primary mt-0.5" />
                  <span>Live attendance count display</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <History className="text-rust" size={32} />
                <h3 className="text-xl font-bold text-navy dark:text-white">Event History</h3>
              </div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-rust mt-0.5" />
                  <span>View all past and upcoming events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-rust mt-0.5" />
                  <span>Search and filter events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-rust mt-0.5" />
                  <span>Attendance statistics per event</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-rust mt-0.5" />
                  <span>Detailed participant lists</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <BarChart3 className="text-green-600" size={32} />
                <h3 className="text-xl font-bold text-navy dark:text-white">Live Analytics</h3>
              </div>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                  <span>Real-time attendance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                  <span>Department-wise breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                  <span>Year-wise statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                  <span>Export to Excel/CSV</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Additional Features</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything else that makes UpDone Mark great</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Moon className="text-teal flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Dark Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Full black dark theme support with automatic switching and toggle button</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Smartphone className="text-primary flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">PWA Support</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Install as mobile app. Works offline with service workers.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Mail className="text-rust flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Email Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automated emails for event creation and important updates</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Database className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Firebase Backend</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time database, authentication, and cloud storage</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Download className="text-teal flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Data Export</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Export attendance data as Excel or CSV files</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <MessageCircle className="text-primary flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Contact System</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Built-in contact form for support and inquiries</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Lock className="text-rust flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Secure Auth</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role-based authentication with session management</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Clock className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Rate Limiting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prevents abuse with intelligent rate limiting</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-offwhite dark:bg-black">
              <Globe className="text-teal flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-navy dark:text-white mb-1">Responsive Design</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Works perfectly on mobile, tablet, and desktop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">How to Use</h2>
            <p className="text-gray-600 dark:text-gray-400">Step-by-step guide for each role</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Coordinators */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-teal" size={28} />
                <h3 className="text-xl font-bold text-navy dark:text-white">For Coordinators</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Login</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use your coordinator credentials to login</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Create Event</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click "New Event" and fill event details with location</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Generate QR</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open QR display and project/show to students</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Monitor Attendance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Watch live attendance count and view reports</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Students */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="text-primary" size={28} />
                <h3 className="text-xl font-bold text-navy dark:text-white">For Students</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Scan QR Code</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use phone camera or QR scanner to scan displayed code</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Fill Details</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enter your name and roll number (auto-detects dept/year)</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">GPS Check</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Allow location access for venue verification</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium text-navy dark:text-white">Confirm</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Submit and receive instant confirmation</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-teal/10 to-primary/10 dark:from-teal/20 dark:to-primary/20 border-teal/20">
            <h2 className="text-3xl font-bold text-navy dark:text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
              Join thousands of students and coordinators using UpDone Mark for secure, 
              hassle-free event attendance tracking.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/coordinator-signup" className="btn-primary">
                Start as Coordinator
              </Link>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
