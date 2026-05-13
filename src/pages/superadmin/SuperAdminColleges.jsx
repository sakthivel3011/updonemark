import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Sidebar from '../../components/layout/Sidebar';
import { Menu, Building2, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperAdminColleges() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: '', domain: '', adminEmail: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const colRef = collection(db, "colleges");
      const snap = await getDocs(colRef);
      setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "colleges"), {
        ...newCollege,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast.success("College added successfully. Admin can now login with the provided email.");
      setShowAddModal(false);
      setNewCollege({ name: '', domain: '', adminEmail: '' });
      fetchColleges();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add college");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "colleges", id), {
        isActive: !currentStatus
      });
      toast.success("College status updated");
      fetchColleges();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const deleteCollege = async (id) => {
    if(!window.confirm("Are you sure you want to delete this college? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "colleges", id));
      toast.success("College deleted successfully");
      fetchColleges();
    } catch (error) {
      toast.error("Failed to delete college");
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
            <Building2 className="text-primary" /> Colleges Management
          </h2>
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white">Registered Colleges</h3>
                <p className="text-xs sm:text-sm text-gray-500">Manage all institutions and their admin assignments.</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="btn-primary !py-2 !px-3 sm:!px-4 flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <Plus size={14} className="sm:w-4 sm:h-4" /> Add College
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left min-w-[600px] sm:min-w-0">
                <thead className="bg-gray-50 dark:bg-navy-soft text-gray-500 text-xs sm:text-sm font-semibold uppercase">
                  <tr>
                    <th className="p-3 sm:p-4">College Name</th>
                    <th className="p-3 sm:p-4">Domain</th>
                    <th className="p-3 sm:p-4">Admin Email</th>
                    <th className="p-3 sm:p-4 text-center">Status</th>
                    <th className="p-3 sm:p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    <tr><td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm">Loading...</td></tr>
                  ) : colleges.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm">No colleges registered.</td></tr>
                  ) : (
                    colleges.map(c => (
                      <tr key={c.id} className="text-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy/50">
                        <td className="p-3 sm:p-4 font-semibold text-sm">{c.name}</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">{c.domain}</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm">{c.adminEmail || 'Not Assigned'}</td>
                        <td className="p-3 sm:p-4 text-center">
                          {c.isActive ? 
                            <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-lg">Active</span> : 
                            <span className="text-rust text-xs font-bold px-2 py-1 bg-rust/10 rounded-lg">Inactive</span>
                          }
                        </td>
                        <td className="p-3 sm:p-4 flex justify-center gap-2">
                          <button 
                            onClick={() => toggleStatus(c.id, c.isActive)}
                            className={`p-1.5 rounded-lg ${c.isActive ? 'text-rust hover:bg-rust/10' : 'text-green-600 hover:bg-green-100'}`}
                            title={c.isActive ? "Deactivate" : "Activate"}
                          >
                            {c.isActive ? <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> : <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
                          </button>
                          <button 
                            onClick={() => deleteCollege(c.id)}
                            className="p-1.5 rounded-lg text-rust hover:bg-rust/10"
                            title="Delete"
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

      {/* Add College Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
            <h3 className="text-xl font-bold text-navy dark:text-white mb-6">Add New College</h3>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">College Name</label>
                <input type="text" value={newCollege.name} onChange={e => setNewCollege({...newCollege, name: e.target.value})} required className="input-field" placeholder="e.g. Kongu Engineering College" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Domain (for coordinator filter)</label>
                <input type="text" value={newCollege.domain} onChange={e => setNewCollege({...newCollege, domain: e.target.value})} required className="input-field" placeholder="e.g. kongu.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Admin Email (Assign Admin)</label>
                <input type="email" value={newCollege.adminEmail} onChange={e => setNewCollege({...newCollege, adminEmail: e.target.value})} required className="input-field" placeholder="admin@kongu.edu" />
                <p className="text-xs text-gray-500 mt-1">This user will automatically gain College Admin rights when logging in via Google Auth.</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary !py-3">{saving ? 'Saving...' : 'Add College'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
