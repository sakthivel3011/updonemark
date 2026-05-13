import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Mail, Trash2, CheckCircle, Search, Clock, Menu } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Loader from '../../components/ui/Loader';

export default function SuperAdminMessages() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Safety timeout - stop loading after 10 seconds even if data fetch fails
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        clearTimeout(timeoutId);
        const msgs = [];
        snapshot.forEach(doc => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Error fetching messages:', error);
        setLoading(false);
        setMessages([]);
      }
    );
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleMarkAsRead = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: !currentStatus });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen items-center justify-center">
        <Loader />
      </main>
    </div>
  );

  const filteredMessages = messages.filter(msg => 
    msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center px-6 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white mr-4">
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Mail className="text-primary" /> Contact Messages
          </h2>
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-navy dark:text-white flex items-center gap-3">
                  <Mail className="text-primary" size={28} /> Messages
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage inquiries submitted via the public contact form.</p>
              </div>

              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-white dark:bg-navy-soft border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary dark:text-white transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredMessages.length === 0 ? (
                <div className="bg-white dark:bg-navy-soft rounded-2xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                  <Mail size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">No messages found</h3>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`bg-white dark:bg-navy-soft rounded-2xl p-6 border-l-4 shadow-sm transition-all hover:shadow-md ${
                      msg.read ? 'border-gray-300 dark:border-gray-600 opacity-75' : 'border-primary'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`text-lg font-bold ${msg.read ? 'text-gray-700 dark:text-gray-300' : 'text-navy dark:text-white'}`}>
                            {msg.name}
                          </h3>
                          {!msg.read && (
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-md">
                            {msg.subject || 'General Inquiry'}
                          </span>
                          <a href={`mailto:${msg.email}`} className="text-sm font-medium text-teal hover:underline inline-block">{msg.email}</a>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-navy/50 rounded-xl p-4 mt-2">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-between items-end min-w-[140px]">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                          <Clock size={14} />
                          {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => handleMarkAsRead(msg.id, msg.read)}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${
                              msg.read ? 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5' : 'text-primary bg-primary/10 hover:bg-primary/20'
                            }`}
                          >
                            <CheckCircle size={18} /> {msg.read ? 'Mark Unread' : 'Mark Read'}
                          </button>
                          <button 
                            onClick={() => handleDelete(msg.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
