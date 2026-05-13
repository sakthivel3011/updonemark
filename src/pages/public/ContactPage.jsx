import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Mail, Send, CheckCircle, ArrowLeft, Globe, MessageSquare, MapPin, Clock, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('loading');
    try {
      // Save to Firestore
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast.success('Message sent successfully!');
      
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy font-sans selection:bg-teal/30">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 bg-offwhite dark:bg-navy overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal/20 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-rust/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Back Link */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-teal transition-colors mb-8 group" data-aos="fade-down">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal-deep dark:text-teal-light font-medium text-sm mb-6">
              <MessageSquare size={16} />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-navy dark:text-white tracking-tight">
              Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-primary">Connect</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Whether you're interested in deploying UpDone Mark for your college, need technical support, or just want to say hi — we're here to help you succeed.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Email Card */}
            <div className="group relative p-8 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="0">
              <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center text-teal mb-6 group-hover:scale-110 transition-transform">
                  <Mail size={28} />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Email Us</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Our team typically responds within 24 hours</p>
                <a href="mailto:uppdone@gmail.com" className="text-teal font-semibold hover:underline">uppdone@gmail.com</a>
              </div>
            </div>

            {/* Website Card */}
            <div className="group relative p-8 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Globe size={28} />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Main Website</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Explore our complete suite of products</p>
                <a href="https://updone.vercel.app" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">updone.vercel.app</a>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="group relative p-8 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
                  <Clock size={28} />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Fast Response</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Average response time for all inquiries</p>
                <span className="text-green-600 dark:text-green-400 font-semibold">&lt; 24 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(45,212,191,0.15) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
            
            {/* LEFT: Info Panel */}
            <div className="lg:col-span-2 flex flex-col gap-6" data-aos="fade-right">
              {/* Deployment Card */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-navy to-navy-soft dark:from-navy-soft dark:to-navy border border-white/10 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal/20 rounded-full blur-[60px]"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center text-teal-light mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Deploy at Your College</h3>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Get UpDone Mark set up for your institution with full training and support. Free trial available for the first month.
                  </p>
                  <div className="flex items-center gap-2 text-teal-light text-sm">
                    <Zap size={16} />
                    <span>Free first month trial</span>
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <div className="relative p-8 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-lg flex-1">
                <h3 className="text-xl font-bold text-navy dark:text-white mb-4">What We Can Help With</h3>
                <ul className="space-y-3">
                  {[
                    'College deployment & setup',
                    'Technical support & troubleshooting',
                    'Feature requests & feedback',
                    'Training for coordinators',
                    'Integration assistance'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                      <div className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={12} className="text-teal" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT: Form Panel */}
            <div className="lg:col-span-3" data-aos="fade-left">
              <div className="relative p-8 md:p-10 rounded-3xl bg-white dark:bg-navy-soft border border-gray-100 dark:border-white/10 shadow-xl h-full">
                {status === 'success' ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-deep flex items-center justify-center mb-6 shadow-xl shadow-teal/30 animate-bounce">
                      <CheckCircle size={40} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-navy dark:text-white mb-3">Message Sent!</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mb-8">
                      Thank you for reaching out. We've received your message and will get back to you shortly.
                    </p>
                    <button 
                      onClick={() => setStatus('idle')} 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal/10 text-teal font-bold rounded-xl hover:bg-teal/20 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-navy dark:text-white mb-2">Send us a Message</h3>
                      <p className="text-gray-500 dark:text-gray-400">Fill out the form below and we'll respond as soon as possible.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-bold text-navy dark:text-white mb-2">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-navy border-2 border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-navy dark:text-white focus:outline-none focus:border-teal dark:focus:border-teal transition-colors font-medium"
                            placeholder="John Doe"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-navy dark:text-white mb-2">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-navy border-2 border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-navy dark:text-white focus:outline-none focus:border-teal dark:focus:border-teal transition-colors font-medium"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-navy dark:text-white mb-2">What is this regarding?</label>
                        <div className="relative">
                          <select 
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-navy border-2 border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-navy dark:text-white focus:outline-none focus:border-teal dark:focus:border-teal transition-colors font-medium appearance-none cursor-pointer"
                          >
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Deploy at my College">Deploy UpDone Mark at my College</option>
                            <option value="Technical Support">Technical Support</option>
                            <option value="Feedback / Suggestion">Feedback & Suggestions</option>
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-navy dark:text-white mb-2">Message</label>
                        <textarea 
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-navy border-2 border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-navy dark:text-white focus:outline-none focus:border-teal dark:focus:border-teal transition-colors font-medium resize-none"
                          placeholder="Tell us how we can help you..."
                        ></textarea>
                      </div>

                      {status === 'error' && (
                        <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-200 dark:border-red-500/20 font-medium text-sm flex items-center gap-2">
                          <CheckCircle size={16} className="rotate-45" /> Failed to send message. Please try again.
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        className="w-full bg-gradient-to-r from-teal to-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed group"
                      >
                        {status === 'loading' ? (
                          <span>Sending Message...</span>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-primary to-teal-deep text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal/20 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center" data-aos="fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your college events?</h2>
          <p className="text-teal-light text-lg mb-10 max-w-2xl mx-auto">
            Join hundreds of colleges already using UpDone Mark to streamline their event management.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/coordinator-signup" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform">
              Get Started Now
              <ArrowRight size={18} />
            </Link>
            <a href="mailto:uppdone@gmail.com" className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
              <Mail size={20} /> Email Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
