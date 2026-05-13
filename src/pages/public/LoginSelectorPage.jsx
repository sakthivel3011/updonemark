import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Building2, ClipboardList } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function LoginSelectorPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-offwhite dark:bg-navy selection:bg-teal/30">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 mt-20">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/coordinator-login" className="card group hover:-translate-y-2 transition-transform text-center py-12" data-aos="fade-up" data-aos-delay="100">
            <div className="w-16 h-16 bg-teal/10 text-teal rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-navy dark:text-white">Coordinator</h3>
            <p className="text-gray-500 text-sm">Create events, manage QR codes, and track attendance.</p>
          </Link>
          
          <Link to="/collegeadmin-login" className="card group hover:-translate-y-2 transition-transform text-center py-12" data-aos="fade-up" data-aos-delay="200">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-navy dark:text-white">College Admin</h3>
            <p className="text-gray-500 text-sm">Manage clubs, coordinators, and college-wide analytics.</p>
          </Link>
          
          <Link to="/superadmin-login" className="card group hover:-translate-y-2 transition-transform text-center py-12" data-aos="fade-up" data-aos-delay="300">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-navy dark:text-white">Super Admin</h3>
            <p className="text-gray-500 text-sm">System management and global configurations.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
