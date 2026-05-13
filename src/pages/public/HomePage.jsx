import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ArrowRight, QrCode, MapPin, ShieldCheck, Download, Smartphone, Zap, MessageCircle, Globe, CheckCircle2, XCircle, Lock, Key, UserCheck, BarChart3, Sparkles, Clock, FileSpreadsheet, Bell, Users, ScanLine, Fingerprint, Wifi, ChevronRight, Grid } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy font-sans selection:bg-teal/30">
      <Navbar />

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-screen flex items-center pt-20 sm:pt-24 overflow-hidden">
        {/* Animated Mesh Gradient Background (CSS approximation using radial gradients) */}
        <div className="absolute inset-0 bg-offwhite dark:bg-navy overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal/20 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-rust/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 w-full">
          <div data-aos="fade-up" className="text-center md:text-left">

            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-4 sm:mb-6 text-navy dark:text-white tracking-tight">
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal to-primary">UpDone Mark</span>. <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-primary">Smart Attendance.</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
              Eliminate proxy attendance and messy spreadsheets. UpDone Mark uses dynamic 30s rotating QR codes and GPS validation to secure your college events instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link to="/coordinator-signup" className="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base">
                Get Started <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary text-sm sm:text-base">
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero Visual Guide */}
          <div className="relative flex flex-col justify-center items-center gap-4 sm:gap-5 lg:gap-6 w-full mt-8 md:mt-0" data-aos="fade-up" data-aos-delay="200">

            {/* Connecting dashed line behind cards */}
            <div className="absolute top-10 bottom-10 left-12 md:left-1/2 w-0.5 border-l-2 border-dashed border-teal/30 z-0 hidden md:block"></div>

            {/* Card 1: Create Event */}
            <div className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] bg-white dark:bg-navy-soft p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 animate-float self-center md:self-start md:mr-12">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal shadow-inner shrink-0"><MapPin size={20} className="sm:w-6 sm:h-6" /></div>
                <div>
                  <h4 className="font-bold text-navy dark:text-white text-sm sm:text-base">1. Geofence Event</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set 50m radius GPS boundary</p>
                </div>
              </div>
            </div>

            {/* Card 2: Dynamic QR */}
            <div className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] bg-white dark:bg-navy-soft p-4 sm:p-5 md:p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-float self-center md:self-end md:ml-12" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0"><QrCode size={20} className="sm:w-6 sm:h-6" /></div>
                <div>
                  <h4 className="font-bold text-navy dark:text-white text-sm sm:text-base">2. Display Smart QR</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Refreshes every 30 seconds</p>
                </div>
              </div>
              <div className="w-full bg-gray-50 dark:bg-navy p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500">Live Code Active</span>
                </div>
                <div className="w-1/2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3 animate-progress"></div>
                </div>
              </div>
            </div>

            {/* Card 3: Secure Attendance */}
            <div className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] bg-white dark:bg-navy-soft p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 animate-float self-center md:self-start md:mr-12" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-inner shrink-0"><ShieldCheck size={20} className="sm:w-6 sm:h-6" /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-navy dark:text-white text-sm sm:text-base">3. 100% Secure Sync</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Zero proxies. Sheet updated.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-teal">248</span>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Present</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



    

      {/* FEATURES SECTION - Full Page */}
      <section id="features" className="min-h-screen py-16 sm:py-20 md:py-24 bg-offwhite dark:bg-navy px-4 sm:px-6 relative overflow-hidden flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-teal/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-rust/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16" data-aos="fade-up">

            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy dark:text-white tracking-tight mb-4 sm:mb-6">
              Everything You <br className="hidden sm:block" />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal to-primary">Need & More</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg px-4">
              Built specifically for college event coordinators. Secure, fast, and incredibly easy to use.
            </p>
          </div>

          {/* Features Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {/* Large Feature Card - QR Code */}
            <div className="sm:col-span-2 lg:row-span-2 group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal/10 to-teal/5 dark:from-teal/20 dark:to-navy-soft border border-teal/20 dark:border-teal/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden" data-aos="fade-up">
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-teal/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4 sm:mb-6">
                  <ScanLine size={32} className="text-teal sm:w-10 sm:h-10" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-navy dark:text-white">Dynamic QR Codes</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 flex-1">
                  QR codes automatically rotate every 30 seconds, making screenshot sharing and proxy attendance impossible. Real-time synchronization across all devices.
                </p>
                <div className="flex items-center gap-3 text-teal font-medium">
                  <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">Auto-refreshes every 30s</span>
                </div>
              </div>
            </div>

            {/* GPS Feature */}
            <div className="group relative p-6 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-4">
                <MapPin size={32} className="text-primary" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-navy dark:text-white">GPS Validation</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Precise location checking within 50m radius of event hall.</p>
            </div>

            {/* Security Feature */}
            <div className="group relative p-6 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="150">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-4">
                <Fingerprint size={32} className="text-green-500" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-navy dark:text-white">Anti-Fraud</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Device fingerprinting prevents multiple submissions.</p>
            </div>

            {/* No Login Feature */}
            <div className="group relative p-6 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-4">
                <Smartphone size={32} className="text-purple-500" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-navy dark:text-white">No App Required</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Students just scan QR. No downloads or registration needed.</p>
            </div>

            {/* Large Feature Card - Analytics */}
            <div className="sm:col-span-2 group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy to-navy-soft dark:from-navy-soft dark:to-navy border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="250">
              <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary/20 rounded-full blur-[60px]"></div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0">
                  <BarChart3 size={28} className="text-primary sm:w-9 sm:h-9" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 text-white">Real-Time Analytics</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mb-4">
                    Live attendance dashboard with department-wise breakdown, arrival times, and instant statistics.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-teal-light">
                      <CheckCircle2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>Live Count</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-teal-light">
                      <CheckCircle2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>Dept Split</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-teal-light">
                      <CheckCircle2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>Export Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Feature */}
            <div className="group relative p-6 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-4">
                <FileSpreadsheet size={32} className="text-orange-500" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-navy dark:text-white">Excel Export</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Download clean reports or sync to Google Sheets.</p>
            </div>

            {/* Notifications Feature */}
            <div className="group relative p-6 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="350">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-4">
                <Bell size={32} className="text-pink-500" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-navy dark:text-white">Auto Reports</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Automatic email reports when events end.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - New Modern Design */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 relative overflow-hidden bg-white dark:bg-navy-soft">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(45,212,191,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs sm:text-sm mb-4 sm:mb-6">
              <Zap size={14} className="sm:w-4 sm:h-4" />
              <span>Simple Process</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-navy dark:text-white mb-3 sm:mb-4">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal">Works</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg px-4">
              Four simple steps to secure, seamless event attendance
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12">
            {/* Step 1 */}
            <div className="group relative" data-aos="fade-up" data-aos-delay="0">
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-offwhite dark:bg-navy border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 sm:hover:-translate-y-3 overflow-hidden h-full">
                <div className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-teal/10 rounded-full blur-2xl group-hover:bg-teal/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="mb-4 sm:mb-6">
                    <MapPin size={32} className="text-teal sm:w-10 sm:h-10" />
                  </div>
                  <div className="text-teal font-bold text-xs sm:text-sm mb-2">STEP 01</div>
                  <h4 className="text-lg sm:text-xl font-bold text-navy dark:text-white mb-2 sm:mb-3">Create Event</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                    Set event details, date, time, and capture the hall's GPS location for geofencing.
                  </p>
                </div>
              </div>
              {/* Connector Arrow - Hidden on mobile */}

            </div>

            {/* Step 2 */}
            <div className="group relative" data-aos="fade-up" data-aos-delay="100">
              <div className="relative p-8 rounded-3xl bg-offwhite dark:bg-navy border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden h-full">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <QrCode size={40} className="text-primary" />
                  </div>
                  <div className="text-primary font-bold text-sm mb-2">STEP 02</div>
                  <h4 className="text-xl font-bold text-navy dark:text-white mb-3">Display QR</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Project the dynamic QR code on screen. It automatically refreshes every 30 seconds.
                  </p>
                </div>
              </div>

            </div>

            {/* Step 3 */}
            <div className="group relative" data-aos="fade-up" data-aos-delay="200">
              <div className="relative p-8 rounded-3xl bg-offwhite dark:bg-navy border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden h-full">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <Smartphone size={40} className="text-purple-500" />
                  </div>
                  <div className="text-purple-500 font-bold text-sm mb-2">STEP 03</div>
                  <h4 className="text-xl font-bold text-navy dark:text-white mb-3">Students Scan</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Students scan the QR and enter their roll number within 20 seconds window.
                  </p>
                </div>
              </div>

            </div>

            {/* Step 4 */}
            <div className="group relative" data-aos="fade-up" data-aos-delay="300">
              <div className="relative p-8 rounded-3xl bg-offwhite dark:bg-navy border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden h-full">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <BarChart3 size={40} className="text-green-500" />
                  </div>
                  <div className="text-green-500 font-bold text-sm mb-2">STEP 04</div>
                  <h4 className="text-xl font-bold text-navy dark:text-white mb-3">Get Analytics</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    View real-time attendance, department splits, and export reports instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center" data-aos="fade-up" data-aos-delay="400">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-teal to-primary text-white rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group text-sm sm:text-base"
            >
              <span>See All Features</span>
              <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section id="contact" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-primary to-teal-deep text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-white/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] sm:w-[450px] md:w-[600px] h-[300px] sm:h-[450px] md:h-[600px] bg-teal/20 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center px-4" data-aos="fade-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Ready to upgrade your college events?</h2>
          <p className="text-teal-light text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
            Get in touch with us to deploy UpDone Mark at your institution. Free trial available for the first month.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link to="/contact" className="bg-white text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform flex items-center justify-center text-sm sm:text-base">
              Contact Sales
            </Link>
            <a href="mailto:uppdone@gmail.com" className="bg-transparent border-2 border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              <MessageCircle size={18} className="sm:w-5 sm:h-5" /> Email Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
