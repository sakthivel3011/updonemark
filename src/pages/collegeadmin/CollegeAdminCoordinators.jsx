import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, Users, Mail, CheckCircle2, XCircle, UserCheck, Clock, ShieldCheck, AlertCircle, Building2, Edit, Trash2, Plus, Search, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CollegeAdminCoordinators() {
  const { collegeId, collegeName, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [coordinatorToUpdate, setCoordinatorToUpdate] = useState(null);
  const [updateClubId, setUpdateClubId] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [clubAction, setClubAction] = useState(''); // 'edit' or 'delete'
  
  // Form states
  const [clubForm, setClubForm] = useState({
    name: ''
  });

  useEffect(() => {
    fetchCoordinators();
    fetchClubs();
  }, [collegeId]);

  const fetchCoordinators = async () => {
    if (!collegeId) return;
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'coordinator'),
        where('collegeId', '==', collegeId)
      );
      const snap = await getDocs(q);
      setCoordinators(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load coordinators");
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    if (!collegeId) return;
    try {
      const snap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const getAssignedClubIds = () => {
    return coordinators
      .filter(c => c.status === 'approved' && c.clubId)
      .map(c => c.clubId);
  };

  const assignedClubIds = getAssignedClubIds();

  const getAvailableClubs = () => {
    return clubs.filter(club => !assignedClubIds.includes(club.id));
  };

  const getAvailableClubsForUpdate = () => {
    return clubs.filter(club => 
      !assignedClubIds.includes(club.id) || club.id === coordinatorToUpdate?.clubId
    );
  };

  const pendingCoordinators = coordinators.filter(c => c.status === 'pending');
  const approvedCoordinators = coordinators.filter(c => c.status === 'approved');

  // Filter coordinators based on search
  const filteredPendingCoordinators = pendingCoordinators.filter(coord =>
    (coord.displayName || coord.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    coord.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coord.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedCoordinators = approvedCoordinators.filter(coord =>
    (coord.displayName || coord.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    coord.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coord.clubName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveClick = (coordinator) => {
    setSelectedCoordinator(coordinator);
    setSelectedClubId('');
    setShowApproveModal(true);
  };

  const handleUpdateCoordinatorClick = (coord) => {
    setCoordinatorToUpdate(coord);
    setUpdateClubId(coord.clubId || '');
    setShowUpdateModal(true);
  };

  const handleDeleteCoordinator = async (coord) => {
    if (!window.confirm(`Are you sure you want to completely delete ${coord.displayName || coord.name || coord.email}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'users', coord.id));
      toast.success("Coordinator deleted successfully");
      fetchCoordinators();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete coordinator");
    }
  };

  const submitUpdateCoordinator = async () => {
    if (!updateClubId) {
      toast.error("Please select a club to assign");
      return;
    }

    const selectedClub = clubs.find(c => c.id === updateClubId);
    
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'users', coordinatorToUpdate.id), {
        clubId: updateClubId,
        clubName: selectedClub?.name || null
      });
      
      toast.success(`Coordinator assigned to ${selectedClub.name}!`);
      setShowUpdateModal(false);
      setCoordinatorToUpdate(null);
      setUpdateClubId('');
      fetchCoordinators();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update coordinator");
    } finally {
      setProcessing(false);
    }
  };

  // Club management functions
  const handleAddClub = () => {
    setClubForm({ name: '' });
    setClubAction('add');
    setShowClubModal(true);
  };

  const handleEditClub = (club) => {
    setClubForm({ 
      name: club.name
    });
    setSelectedClub(club);
    setClubAction('edit');
    setShowClubModal(true);
  };

  const handleDeleteClub = (club) => {
    setSelectedClub(club);
    setClubAction('delete');
    setShowClubModal(true);
  };

  const handleClubSubmit = async () => {
    if (!clubForm.name.trim()) {
      toast.error("Club name is required");
      return;
    }

    setProcessing(true);
    try {
      if (clubAction === 'add') {
        await addDoc(collection(db, `colleges/${collegeId}/clubs`), {
          name: clubForm.name,
          createdAt: new Date()
        });
        toast.success("Club added successfully!");
      } else if (clubAction === 'edit' && selectedClub) {
        await updateDoc(doc(db, `colleges/${collegeId}/clubs`, selectedClub.id), {
          name: clubForm.name,
          updatedAt: new Date()
        });
        toast.success("Club updated successfully!");
      }
      
      setShowClubModal(false);
      setSelectedClub(null);
      setClubForm({ name: '' });
      fetchClubs();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${clubAction} club`);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedClub) return;
    
    setProcessing(true);
    try {
      await deleteDoc(doc(db, `colleges/${collegeId}/clubs`, selectedClub.id));
      toast.success("Club deleted successfully!");
      setShowClubModal(false);
      setSelectedClub(null);
      fetchClubs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete club");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedClubId) {
      toast.error("Please select a club to assign");
      return;
    }

    if (assignedClubIds.includes(selectedClubId)) {
      toast.error("This club already has a coordinator assigned!");
      return;
    }

    const selectedClub = clubs.find(c => c.id === selectedClubId);
    
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'users', selectedCoordinator.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid || null,
        clubId: selectedClubId,
        clubName: selectedClub?.name || null
      });
      
      toast.success(`Coordinator approved and assigned to ${selectedClub.name}!`);
      setShowApproveModal(false);
      setSelectedCoordinator(null);
      setSelectedClubId('');
      fetchCoordinators();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve coordinator");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (coordinator) => {
    if (!window.confirm(`Are you sure you want to reject ${coordinator.displayName || coordinator.email}? They will not be able to access the system.`)) return;
    
    try {
      await updateDoc(doc(db, 'users', coordinator.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.uid || null
      });
      
      toast.success("Coordinator rejected");
      fetchCoordinators();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject coordinator");
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white mr-4">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
              <Building2 className="text-teal" /> Coordinator & Club Management
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
                onClick={() => {
                  fetchCoordinators();
                  fetchClubs();
                  toast.success("Data refreshed successfully!");
                }}
                className="p-2 rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors"
                title="Refresh Data"
                disabled={loading}
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <DarkModeToggle />
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy dark:text-white">Management Center</h1>
            <p className="text-gray-500 text-sm sm:text-base">Manage coordinators and clubs for {collegeName}.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy dark:text-white">{pendingCoordinators.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Pending Approval</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy dark:text-white">{approvedCoordinators.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Approved Coordinators</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy dark:text-white">{clubs.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Clubs</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy dark:text-white">{assignedClubIds.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Assigned Clubs</p>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-navy dark:hover:text-white'
              }`}
            >
              <Clock size={18} className="inline mr-2" />
              Pending ({pendingCoordinators.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-navy dark:hover:text-white'
              }`}
            >
              <UserCheck size={18} className="inline mr-2" />
              Approved ({approvedCoordinators.length})
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'clubs'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-navy dark:hover:text-white'
              }`}
            >
              <ShieldCheck size={18} className="inline mr-2" />
              Clubs ({clubs.length})
            </button>
          </div>

          {/* Search Bar */}
          {(activeTab === 'pending' || activeTab === 'approved') && (
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search coordinators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-navy dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Info Banner */}
          {activeTab === 'pending' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3 sm:p-4 rounded-xl mb-6 flex items-start gap-2 sm:gap-3">
              <AlertCircle className="shrink-0 mt-0.5 w-[18px] h-[18px] sm:w-5 sm:h-5" size={18} />
              <p className="text-xs sm:text-sm">
                New coordinators who signed up will appear here. You must <strong>approve</strong> them and assign a club before they can access the system.
              </p>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-white dark:bg-navy-soft rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
            
            {/* Pending Coordinators */}
            {activeTab === 'pending' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                      <th className="p-4 text-left font-medium">Coordinator</th>
                      <th className="p-4 text-left font-medium">Contact</th>
                      <th className="p-4 text-left font-medium">Department</th>
                      <th className="p-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal mx-auto mb-3"></div>
                          Loading coordinators...
                        </td>
                      </tr>
                    ) : filteredPendingCoordinators.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-500">
                          <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No pending requests</p>
                          <p className="text-sm mt-2">New coordinator registrations will appear here</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPendingCoordinators.map(coord => (
                        <tr key={coord.id} className="hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                                  {(coord.displayName || coord.name || coord.email || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-navy dark:text-white">{coord.displayName || coord.name || 'Unnamed'}</p>
                                <p className="text-xs text-gray-500">Registered {coord.createdAt ? new Date(coord.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={14} />
                                {coord.email}
                              </div>
                              {coord.phone && (
                                <p className="text-xs text-gray-500">{coord.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {coord.department || 'Not specified'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleApproveClick(coord)}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                                title="Approve & Assign Club"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleReject(coord)}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Approved Coordinators */}
            {activeTab === 'approved' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                      <th className="p-4 text-left font-medium">Coordinator</th>
                      <th className="p-4 text-left font-medium">Contact</th>
                      <th className="p-4 text-left font-medium">Assigned Club</th>
                      <th className="p-4 text-left font-medium">Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal mx-auto mb-3"></div>
                          Loading coordinators...
                        </td>
                      </tr>
                    ) : filteredApprovedCoordinators.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-500">
                          <Users size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No approved coordinators yet</p>
                          <p className="text-sm mt-2">Approve pending requests to see them here</p>
                        </td>
                      </tr>
                    ) : (
                      filteredApprovedCoordinators.map(coord => (
                        <tr key={coord.id} className="hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <span className="text-teal-600 dark:text-teal-400 font-bold text-sm">
                                  {(coord.displayName || coord.name || coord.email || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-navy dark:text-white">{coord.displayName || coord.name || 'Unnamed'}</p>
                                <p className="text-xs text-gray-500">Approved {coord.approvedAt ? new Date(coord.approvedAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={14} />
                                {coord.email}
                              </div>
                              {coord.phone && (
                                <p className="text-xs text-gray-500">{coord.phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
                                <ShieldCheck size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-navy dark:text-white">{coord.clubName || 'No Club Assigned'}</p>
                                <p className="text-xs text-gray-500">Club ID: {coord.clubId || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Active
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateCoordinatorClick(coord)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Change Club"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoordinator(coord)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Delete Coordinator"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Clubs Management */}
            {activeTab === 'clubs' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-navy dark:text-white">Club Management</h3>
                  <button
                    onClick={handleAddClub}
                    className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors"
                  >
                    <Plus size={18} />
                    Add Club
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubs.map(club => {
                    const isAssigned = assignedClubIds.includes(club.id);
                    const assignedTo = coordinators.find(c => c.clubId === club.id);
                    
                    return (
                      <div key={club.id} className="bg-gray-50 dark:bg-navy/50 rounded-lg p-4 border border-gray-200 dark:border-white/5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                              <ShieldCheck size={20} className="text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-navy dark:text-white">{club.name}</h4>
                              <p className="text-xs text-gray-500">ID: {club.id}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClub(club)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Edit Club"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClub(club)}
                              className="p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Delete Club"
                              disabled={isAssigned}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                                                
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isAssigned 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            {isAssigned ? 'Assigned' : 'Available'}
                          </span>
                          
                          {isAssigned && assignedTo && (
                            <span className="text-xs text-gray-500">
                              {assignedTo.displayName || assignedTo.name}
                            </span>
                          )}
                        </div>
                        
                        {club.createdAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Created {new Date(club.createdAt.toDate()).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {clubs.length === 0 && (
                  <div className="text-center py-12">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No clubs created yet</p>
                    <p className="text-sm text-gray-400 mt-2">Click "Add Club" to create your first club</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approval Modal */}
        {showApproveModal && selectedCoordinator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => !processing && setShowApproveModal(false)}></div>
            <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
              <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Approve Coordinator</h3>
              <p className="text-gray-500 text-sm mb-6">
                Approve <strong>{selectedCoordinator.displayName || selectedCoordinator.name || selectedCoordinator.email}</strong> and assign a club.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">
                    Select Club to Assign
                  </label>
                  
                  {getAvailableClubs().length === 0 ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                      <AlertCircle size={16} className="inline mr-2" />
                      No available clubs! All clubs already have coordinators assigned.
                    </div>
                  ) : (
                    <select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-navy dark:text-white"
                    >
                      <option value="">Choose a club...</option>
                      {getAvailableClubs().map(club => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-gray-50 dark:bg-navy/50 rounded-lg text-xs text-gray-500">
                  <p className="font-medium mb-1">Club Status:</p>
                  <ul className="space-y-1">
                    {clubs.slice(0, 5).map(club => {
                      const isAssigned = assignedClubIds.includes(club.id);
                      const assignedTo = coordinators.find(c => c.clubId === club.id);
                      return (
                        <li key={club.id} className="flex items-center gap-2">
                          {isAssigned ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>{club.name} - Taken by {assignedTo?.displayName || assignedTo?.name || 'Unknown'}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>{club.name} - Available</span>
                            </>
                          )}
                        </li>
                      );
                    })}
                    {clubs.length > 5 && (
                      <li className="text-gray-400">...and {clubs.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowApproveModal(false)} 
                  disabled={processing}
                  className="flex-1 btn-secondary !py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApprove} 
                  disabled={processing || !selectedClubId || getAvailableClubs().length === 0}
                  className="flex-1 btn-primary !py-3 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve & Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Club Management Modal */}
        {showClubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => !processing && setShowClubModal(false)}></div>
            <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
              {clubAction === 'delete' ? (
                <>
                  <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Delete Club</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{selectedClub?.name}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowClubModal(false)} 
                      disabled={processing}
                      className="flex-1 btn-secondary !py-3"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmDelete} 
                      disabled={processing}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white !py-3 rounded-lg font-medium disabled:opacity-50"
                    >
                      {processing ? 'Deleting...' : 'Delete Club'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-navy dark:text-white mb-2">
                    {clubAction === 'add' ? 'Add New Club' : 'Edit Club'}
                  </h3>
                  <form onSubmit={handleClubSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-navy dark:text-white mb-2">
                        Club Name
                      </label>
                      <input
                        type="text"
                        value={clubForm.name}
                        onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-navy dark:text-white"
                        placeholder="e.g. IEEE, NSS, Robotics Club"
                        required
                      />
                    </div>
                                        <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowClubModal(false)} 
                        disabled={processing}
                        className="flex-1 btn-secondary !py-3"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={processing}
                        className="flex-1 btn-primary !py-3"
                      >
                        {processing ? 'Saving...' : (clubAction === 'add' ? 'Add Club' : 'Update Club')}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
        {/* Update Coordinator Modal */}
        {showUpdateModal && coordinatorToUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => !processing && setShowUpdateModal(false)}></div>
            <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
              <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Change Assigned Club</h3>
              <p className="text-gray-500 text-sm mb-6">
                Update club assignment for <strong>{coordinatorToUpdate.displayName || coordinatorToUpdate.name || coordinatorToUpdate.email}</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">
                    Select New Club
                  </label>
                  
                  {getAvailableClubsForUpdate().length === 0 ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                      <AlertCircle size={16} className="inline mr-2" />
                      No available clubs to switch to!
                    </div>
                  ) : (
                    <select
                      value={updateClubId}
                      onChange={(e) => setUpdateClubId(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-navy dark:text-white"
                    >
                      <option value="">Choose a club...</option>
                      {getAvailableClubsForUpdate().map(club => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateModal(false)} 
                  disabled={processing}
                  className="flex-1 btn-secondary !py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitUpdateCoordinator} 
                  disabled={processing || !updateClubId}
                  className="flex-1 btn-primary !py-3 disabled:opacity-50"
                >
                  {processing ? 'Saving...' : 'Update Coordinator'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
