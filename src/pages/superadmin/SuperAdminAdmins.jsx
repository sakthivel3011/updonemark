import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import app, { db } from '../../firebase/config';
import Sidebar from '../../components/layout/Sidebar';
import { Menu, Users, Trash2, Mail, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperAdminAdmins() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', collegeId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchColleges();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      console.log('Fetching admins with role: collegeadmin');
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "collegeadmin"));
      const snap = await getDocs(q);
      console.log('Admins fetched:', snap.size, 'documents');
      
      const adminsData = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      console.log('Admins data:', adminsData);
      setAdmins(adminsData);
    } catch (err) {
      console.error('Error fetching admins:', err);
      toast.error("Failed to load college admins: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const snap = await getDocs(collection(db, "colleges"));
      const collegesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('Colleges fetched:', collegesData.length);
      setColleges(collegesData);
    } catch (err) {
      console.error("Failed to fetch colleges:", err);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.collegeId) {
      toast.error("Please select a college");
      return;
    }

    setCreating(true);
    const selectedCollege = colleges.find(c => c.id === newAdmin.collegeId);

    try {
      // 1. Initialize a secondary Firebase app to create user without signing out the current SuperAdmin
      const secondaryApp = initializeApp(app.options, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newAdmin.email, newAdmin.password);
      
      // 3. Add user document in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email: newAdmin.email,
        displayName: newAdmin.name,
        role: "collegeadmin",
        collegeId: selectedCollege.id,
        collegeName: selectedCollege.name,
        createdAt: new Date()
      });

      // 4. Sign out the secondary app and clean up
      await signOut(secondaryAuth);
      
      toast.success("College Admin created successfully!");
      setShowAddModal(false);
      setNewAdmin({ name: '', email: '', password: '', collegeId: '' });
      fetchAdmins();

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        // Check if the user document exists in Firestore
        toast.error("Firebase Auth account exists, but Firestore document may be missing. Please check Firestore rules or use 'Forgot Password' to reset access.");
        console.log("Email already in use:", newAdmin.email);
        console.log("The user may exist in Firebase Auth but not in Firestore 'users' collection.");
        console.log("This can happen if Firestore rules blocked the document creation.");
      } else if (error.code === 'permission-denied') {
        toast.error("Firestore permission denied. Check your security rules.");
      } else {
        toast.error(error.message || "Failed to create admin");
      }
    } finally {
      setCreating(false);
    }
  };

  const removeAdminAccess = async (id) => {
    if(!window.confirm("Are you sure you want to delete this admin account?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Admin deleted");
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center px-6 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white mr-4">
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
            <Users className="text-primary" /> College Admins
          </h2>
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white">Active Administrators</h3>
                <p className="text-xs sm:text-sm text-gray-500">Manage login credentials for college admins.</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="btn-primary !py-2 !px-3 sm:!px-4 flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <Plus size={14} className="sm:w-4 sm:h-4" /> Create Admin
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left min-w-[600px] sm:min-w-0">
                <thead className="bg-gray-50 dark:bg-navy-soft text-gray-500 text-xs sm:text-sm font-semibold uppercase">
                  <tr>
                    <th className="p-3 sm:p-4">Name</th>
                    <th className="p-3 sm:p-4">Email</th>
                    <th className="p-3 sm:p-4">Assigned College</th>
                    <th className="p-3 sm:p-4">Joined Date</th>
                    <th className="p-3 sm:p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    <tr><td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm">Loading...</td></tr>
                  ) : admins.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm">No active admins found. Click "Create Admin" to add one.</td></tr>
                  ) : (
                    admins.map(admin => (
                      <tr key={admin.id} className="text-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy/50">
                        <td className="p-3 sm:p-4 font-semibold text-sm">{admin.displayName || 'N/A'}</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">{admin.email}</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-primary">{admin.collegeName || 'Unknown'}</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">
                          {admin.createdAt ? new Date(admin.createdAt.seconds ? admin.createdAt.seconds * 1000 : admin.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 sm:p-4 flex justify-center gap-2">
                          <button 
                            onClick={() => removeAdminAccess(admin.id)}
                            className="p-1.5 rounded-lg text-rust hover:bg-rust/10"
                            title="Remove Account"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
            <h3 className="text-xl font-bold text-navy dark:text-white mb-6">Create College Admin</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Admin Full Name</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} required className="input-field" placeholder="admin@college.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required minLength="6" className="input-field" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assign to College</label>
                <select value={newAdmin.collegeId} onChange={e => setNewAdmin({...newAdmin, collegeId: e.target.value})} required className="input-field">
                  <option value="">Select a college...</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 btn-primary !py-3">{creating ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
