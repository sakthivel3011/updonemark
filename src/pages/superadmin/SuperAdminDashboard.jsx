import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, where, getDoc, collectionGroup, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Sidebar from '../../components/layout/Sidebar';
import { Menu, Building2, Users, Calendar, Activity, Plus, X, Upload, Shield, ShieldOff, CheckCircle2, Edit, Trash2, BookOpen, RefreshCw } from 'lucide-react';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalColleges: 0,
    totalCoordinators: 0,
    totalEvents: 0,
    totalAttendance: 0,
    activeColleges: 0
  });

  // New College Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [newCollege, setNewCollege] = useState({
    name: '',
    code: '',
    logo: null,
    email: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Academic Years Management
  const [academicYears, setAcademicYears] = useState([]);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState(null);
  const [newAcademicYear, setNewAcademicYear] = useState({
    name: '',
    startYear: '',
    endYear: '',
    isActive: false,
    setAsActive: false
  });
  const [academicYearSaving, setAcademicYearSaving] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchAnalytics();
    fetchAcademicYears();
    // Debug: Check database contents
    setTimeout(() => checkDatabaseContents(), 2000);
  }, []);

  const fetchColleges = async () => {
    try {
      const colRef = collection(db, "colleges");
      const snap = await getDocs(colRef);
      const collegesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setColleges(collegesData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseContents = async () => {
    try {
      console.log('🔍 Checking database contents...');
      
      // Check colleges collection
      const collegesTest = await getDocs(collection(db, "colleges"));
      console.log('📊 Colleges collection size:', collegesTest.size);
      collegesTest.docs.forEach(doc => {
        console.log('📊 College doc:', doc.id, doc.data());
      });

      // Check users collection
      const usersTest = await getDocs(collection(db, "users"));
      console.log('👥 Users collection size:', usersTest.size);
      const coordinators = usersTest.docs.filter(d => d.data().role === 'coordinator');
      console.log('👥 Coordinators found:', coordinators.length);

      // Check if events subcollections exist
      const eventsTest = await getDocs(collectionGroup(db, "events"));
      console.log('📅 Events collectionGroup size:', eventsTest.size);

      // Check if attendance subcollections exist
      const attendanceTest = await getDocs(collectionGroup(db, "attendance"));
      console.log('✅ Attendance collectionGroup size:', attendanceTest.size);
      
    } catch (err) {
      console.error('❌ Error checking database:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      console.log('🔄 Fetching analytics data...');
      
      // Get all colleges
      console.log('📊 Fetching colleges...');
      const collegesSnap = await getDocs(collection(db, "colleges"));
      const totalColleges = collegesSnap.size;
      const activeColleges = collegesSnap.docs.filter(d => d.data().isActive !== false).length;
      console.log(`📊 Colleges: ${totalColleges} total, ${activeColleges} active`);

      // Get all coordinators
      console.log('👥 Fetching coordinators...');
      const coordinatorsSnap = await getDocs(collection(db, "users"));
      const coordinators = coordinatorsSnap.docs.filter(d => d.data().role === 'coordinator').length;
      console.log(`👥 Coordinators: ${coordinators}`);

      // Get all events (collectionGroup to get events from all colleges)
      console.log('📅 Fetching events...');
      const eventsSnap = await getDocs(collectionGroup(db, "events"));
      const totalEvents = eventsSnap.size;
      console.log(`📅 Events: ${totalEvents}`);

      // Get total attendance
      console.log('✅ Fetching attendance...');
      const attendanceSnap = await getDocs(collectionGroup(db, "attendance"));
      const totalAttendance = attendanceSnap.docs.filter(d => d.data().status === 'present').length;
      console.log(`✅ Attendance: ${totalAttendance}`);

      const newAnalytics = {
        totalColleges,
        totalCoordinators: coordinators,
        totalEvents,
        totalAttendance,
        activeColleges
      };

      console.log('📈 Setting analytics:', newAnalytics);
      setAnalytics(newAnalytics);
      
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
      toast.error("Failed to load analytics data: " + err.message);
      
      // Set default values on error
      setAnalytics({
        totalColleges: 0,
        totalCoordinators: 0,
        totalEvents: 0,
        totalAttendance: 0,
        activeColleges: 0
      });
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const academicYearsRef = collection(db, "academicYears");
      const snap = await getDocs(academicYearsRef);
      const academicYearsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAcademicYears(academicYearsData.sort((a, b) => b.startYear - a.startYear));
    } catch (err) {
      console.error("Error fetching academic years:", err);
      toast.error("Failed to load academic years");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCollege({ ...newCollege, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create college admin account first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newCollege.adminEmail,
        newCollege.adminPassword
      );

      // Create college document
      const collegeRef = await addDoc(collection(db, "colleges"), {
        name: newCollege.name,
        code: newCollege.code.toUpperCase(),
        email: newCollege.email,
        logo: logoPreview,
        adminName: newCollege.adminName,
        adminEmail: newCollege.adminEmail,
        adminUid: userCredential.user.uid,
        isActive: true,
        createdAt: serverTimestamp()
      });

      // Create user document for college admin
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        email: newCollege.adminEmail,
        name: newCollege.adminName,
        role: 'collegeadmin',
        collegeId: collegeRef.id,
        collegeName: newCollege.name,
        status: 'approved',
        createdAt: serverTimestamp()
      });

      toast.success("College created successfully! College admin account created.");
      setShowAddModal(false);
      setNewCollege({
        name: '',
        code: '',
        logo: null,
        email: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      setLogoPreview(null);
      fetchColleges();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create college: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCollegeStatus = async (collegeId, currentStatus) => {
    try {
      const collegeRef = doc(db, "colleges", collegeId);
      await updateDoc(collegeRef, { isActive: !currentStatus });
      toast.success(`College ${!currentStatus ? 'activated' : 'suspended'}`);
      fetchColleges();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update college status");
    }
  };

  const handleEditCollege = (college) => {
    setEditingCollege(college);
    setNewCollege({
      name: college.name,
      code: college.code || '',
      email: college.email || '',
      adminName: college.adminName || '',
      adminEmail: college.adminEmail || ''
    });
    setLogoPreview(college.logo || null);
    setShowEditModal(true);
  };

  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const collegeRef = doc(db, "colleges", editingCollege.id);
      await updateDoc(collegeRef, {
        name: newCollege.name,
        code: newCollege.code.toUpperCase(),
        email: newCollege.email,
        adminName: newCollege.adminName,
        adminEmail: newCollege.adminEmail
      });
      
      toast.success("College updated successfully!");
      setShowEditModal(false);
      setEditingCollege(null);
      setNewCollege({
        name: '',
        code: '',
        logo: null,
        email: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      setLogoPreview(null);
      fetchColleges();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update college: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Academic Year Management Functions
  const handleAddAcademicYear = async (e) => {
    e.preventDefault();
    setAcademicYearSaving(true);
    try {
      const academicYearData = {
        name: `${newAcademicYear.startYear} - ${newAcademicYear.endYear}`,
        startYear: parseInt(newAcademicYear.startYear),
        endYear: parseInt(newAcademicYear.endYear),
        isActive: academicYears.length === 0, // First academic year is active by default
        createdAt: serverTimestamp()
      };

      // Create the academic year
      const academicYearRef = await addDoc(collection(db, "academicYears"), academicYearData);
      
      // If this is the first academic year or if user wants to set it as active, apply to all colleges
      if (academicYears.length === 0 || newAcademicYear.setAsActive) {
        // Get all colleges and update them with the new academic year
        const collegesRef = collection(db, "colleges");
        const collegesSnap = await getDocs(collegesRef);
        
        const batch = writeBatch(db);
        collegesSnap.docs.forEach(collegeDoc => {
          batch.update(collegeDoc.ref, { 
            academicYear: academicYearData.name,
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        toast.success("Academic year created and applied to all colleges!");
      } else {
        toast.success("Academic year created successfully!");
      }
      
      setShowAcademicYearModal(false);
      setNewAcademicYear({ name: '', startYear: '', endYear: '', isActive: false, setAsActive: false });
      fetchAcademicYears();
      fetchColleges(); // Refresh colleges to show updated academic year
    } catch (err) {
      console.error(err);
      toast.error("Failed to create academic year: " + err.message);
    } finally {
      setAcademicYearSaving(false);
    }
  };

  const handleEditAcademicYear = (academicYear) => {
    setEditingAcademicYear(academicYear);
    setNewAcademicYear({
      name: academicYear.name,
      startYear: academicYear.startYear.toString(),
      endYear: academicYear.endYear.toString(),
      isActive: academicYear.isActive,
      setAsActive: false // Reset to false when editing
    });
    setShowAcademicYearModal(true);
  };

  const handleUpdateAcademicYear = async (e) => {
    e.preventDefault();
    setAcademicYearSaving(true);
    try {
      const academicYearRef = doc(db, "academicYears", editingAcademicYear.id);
      await updateDoc(academicYearRef, {
        name: `${newAcademicYear.startYear} - ${newAcademicYear.endYear}`,
        startYear: parseInt(newAcademicYear.startYear),
        endYear: parseInt(newAcademicYear.endYear)
      });
      
      toast.success("Academic year updated successfully!");
      setShowAcademicYearModal(false);
      setEditingAcademicYear(null);
      setNewAcademicYear({ name: '', startYear: '', endYear: '', isActive: false });
      fetchAcademicYears();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update academic year: " + err.message);
    } finally {
      setAcademicYearSaving(false);
    }
  };

  const handleDeleteAcademicYear = async (academicYearId) => {
    if (!confirm("Are you sure you want to delete this academic year? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "academicYears", academicYearId));
      toast.success("Academic year deleted successfully!");
      fetchAcademicYears();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete academic year: " + err.message);
    }
  };

  const handleSetActiveAcademicYear = async (academicYearId) => {
    try {
      // First, deactivate all academic years
      const academicYearsRef = collection(db, "academicYears");
      const snap = await getDocs(academicYearsRef);
      
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      
      // Then activate the selected one
      const activeYearRef = doc(db, "academicYears", academicYearId);
      batch.update(activeYearRef, { isActive: true });
      
      await batch.commit();
      
      // Update all colleges with the new academic year
      const collegesRef = collection(db, "colleges");
      const collegesSnap = await getDocs(collegesRef);
      const collegeBatch = writeBatch(db);
      
      const selectedYear = academicYears.find(ay => ay.id === academicYearId);
      
      collegesSnap.docs.forEach(collegeDoc => {
        collegeBatch.update(collegeDoc.ref, { 
          academicYear: selectedYear.name,
          updatedAt: serverTimestamp()
        });
      });
      
      await collegeBatch.commit();
      
      toast.success("Active academic year updated for all colleges!");
      fetchAcademicYears();
      fetchColleges();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update active academic year: " + err.message);
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
              <Building2 className="text-primary" /> Super Admin Portal
            </h2>
          </div>
          <DarkModeToggle />
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          {/* Platform Analytics */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-navy dark:text-white">Platform Analytics</h3>
            <div className="flex gap-2">
             
              <button
                onClick={() => fetchAnalytics()}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-navy-soft border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-navy/50 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh Data
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card border-l-4 border-l-primary p-4 sm:p-6">
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Total Colleges</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-navy dark:text-white">{analytics.totalColleges}</h3>
            </div>
            <div className="card border-l-4 border-l-teal p-4 sm:p-6">
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Active Colleges</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-navy dark:text-white">{analytics.activeColleges}</h3>
            </div>
            <div className="card border-l-4 border-l-blue-500 p-4 sm:p-6">
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Total Coordinators</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-navy dark:text-white">{analytics.totalCoordinators}</h3>
            </div>
            <div className="card border-l-4 border-l-purple-500 p-4 sm:p-6">
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Total Events</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-navy dark:text-white">{analytics.totalEvents}</h3>
            </div>
            <div className="card border-l-4 border-l-green-500 p-4 sm:p-6">
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Total Attendance</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-navy dark:text-white">{analytics.totalAttendance}</h3>
            </div>
          </div>

          {/* Academic Years Management */}
          <div className="card p-0 overflow-hidden mb-6 sm:mb-8">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                <BookOpen className="text-primary" /> Academic Years
              </h3>
              <button onClick={() => setShowAcademicYearModal(true)} className="btn-primary !py-2 !px-3 sm:!px-4 flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <Plus size={14} className="sm:w-4 sm:h-4" /> Add Academic Year
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-navy-soft text-gray-500 text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-3">Academic Year</th>
                    <th className="p-3 hidden sm:table-cell">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {academicYears.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-gray-500 text-sm">No academic years found.</td></tr>
                  ) : (
                    academicYears.map(ay => (
                      <tr key={ay.id} className="text-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="font-semibold text-sm">{ay.name}</div>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          {ay.isActive ? (
                            <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-lg">Active</span>
                          ) : (
                            <span className="text-gray-500 text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">Inactive</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditAcademicYear(ay)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Edit Academic Year"
                            >
                              <Edit size={16} />
                            </button>
                            {!ay.isActive && (
                              <button
                                onClick={() => handleSetActiveAcademicYear(ay.id)}
                                className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                                title="Set as Active"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAcademicYear(ay.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete Academic Year"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Colleges List */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white">Registered Colleges</h3>
              <button onClick={() => setShowAddModal(true)} className="btn-primary !py-2 !px-3 sm:!px-4 flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <Plus size={14} className="sm:w-4 sm:h-4" /> Add College
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-navy-soft text-gray-500 text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-3">College</th>
                    <th className="p-3 hidden sm:table-cell">Code</th>
                    <th className="p-3 hidden md:table-cell">Email</th>
                    <th className="p-3 hidden lg:table-cell">Admin</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    <tr><td colSpan="6" className="p-6 text-center text-gray-500 text-sm">Loading...</td></tr>
                  ) : colleges.length === 0 ? (
                    <tr><td colSpan="6" className="p-6 text-center text-gray-500 text-sm">No colleges registered.</td></tr>
                  ) : (
                    colleges.map(c => (
                      <tr key={c.id} className="text-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {c.logo && <img src={c.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                            <div className="font-semibold text-sm">{c.name}</div>
                          </div>
                        </td>
                        <td className="p-3 text-xs hidden sm:table-cell text-gray-500">{c.code}</td>
                        <td className="p-3 text-xs hidden md:table-cell">{c.email || c.adminEmail || 'N/A'}</td>
                        <td className="p-3 text-xs hidden lg:table-cell">{c.adminName || 'N/A'}</td>
                        <td className="p-3 text-center">
                          {c.isActive !== false ? (
                            <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-lg">Active</span>
                          ) : (
                            <span className="text-rust text-xs font-bold px-2 py-1 bg-rust/10 rounded-lg">Suspended</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditCollege(c)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Edit College"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleCollegeStatus(c.id, c.isActive)}
                              className={`p-2 rounded-lg transition-colors ${
                                c.isActive !== false
                                  ? 'text-amber-600 hover:bg-amber-100'
                                  : 'text-green-600 hover:bg-green-100'
                              }`}
                              title={c.isActive !== false ? 'Suspend College' : 'Activate College'}
                            >
                              {c.isActive !== false ? <ShieldOff size={16} /> : <Shield size={16} />}
                            </button>
                          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-navy dark:text-white">Create New College</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-navy dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Name *</label>
                  <input 
                    type="text" 
                    value={newCollege.name} 
                    onChange={e => setNewCollege({...newCollege, name: e.target.value})} 
                    required 
                    className="input-field" 
                    placeholder="e.g. Kongu Engineering College" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Code *</label>
                  <input 
                    type="text" 
                    value={newCollege.code} 
                    onChange={e => setNewCollege({...newCollege, code: e.target.value.toUpperCase()})} 
                    required 
                    className="input-field" 
                    placeholder="e.g. KEC" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Email *</label>
                  <input 
                    type="email" 
                    value={newCollege.email} 
                    onChange={e => setNewCollege({...newCollege, email: e.target.value})} 
                    required 
                    className="input-field" 
                    placeholder="e.g. info@kongu.edu" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Logo</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange} 
                      className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal file:text-white hover:file:bg-teal-dark"
                    />
                  </div>
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="mt-2 w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                <p className="text-sm font-semibold text-navy dark:text-white mb-3">College Admin Account</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Admin Name *</label>
                    <input 
                      type="text" 
                      value={newCollege.adminName} 
                      onChange={e => setNewCollege({...newCollege, adminName: e.target.value})} 
                      required 
                      className="input-field" 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Admin Email *</label>
                    <input 
                      type="email" 
                      value={newCollege.adminEmail} 
                      onChange={e => setNewCollege({...newCollege, adminEmail: e.target.value})} 
                      required 
                      className="input-field" 
                      placeholder="e.g. admin@kongu.edu" 
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Admin Password *</label>
                  <input 
                    type="password" 
                    value={newCollege.adminPassword} 
                    onChange={e => setNewCollege({...newCollege, adminPassword: e.target.value})} 
                    required 
                    minLength="6"
                    className="input-field" 
                    placeholder="Minimum 6 characters" 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Create College
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-navy dark:text-white">Edit College</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-navy dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateCollege} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Name *</label>
                  <input 
                    type="text" 
                    value={newCollege.name} 
                    onChange={e => setNewCollege({...newCollege, name: e.target.value})} 
                    required 
                    className="input-field" 
                    placeholder="e.g. Kongu Engineering College" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">College Code *</label>
                  <input 
                    type="text" 
                    value={newCollege.code} 
                    onChange={e => setNewCollege({...newCollege, code: e.target.value.toUpperCase()})} 
                    required 
                    className="input-field" 
                    placeholder="e.g. KEC" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">College Email *</label>
                <input 
                  type="email" 
                  value={newCollege.email} 
                  onChange={e => setNewCollege({...newCollege, email: e.target.value})} 
                  required 
                  className="input-field" 
                  placeholder="e.g. info@kongu.edu" 
                />
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                <p className="text-sm font-semibold text-navy dark:text-white mb-3">College Admin Account</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Admin Name *</label>
                    <input 
                      type="text" 
                      value={newCollege.adminName} 
                      onChange={e => setNewCollege({...newCollege, adminName: e.target.value})} 
                      required 
                      className="input-field" 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Admin Email *</label>
                    <input 
                      type="email" 
                      value={newCollege.adminEmail} 
                      onChange={e => setNewCollege({...newCollege, adminEmail: e.target.value})} 
                      required 
                      className="input-field" 
                      placeholder="e.g. admin@kongu.edu" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Update College
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Year Modal */}
      {showAcademicYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAcademicYearModal(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-navy dark:text-white">
                {editingAcademicYear ? 'Edit Academic Year' : 'Add Academic Year'}
              </h3>
              <button onClick={() => setShowAcademicYearModal(false)} className="text-gray-500 hover:text-navy dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={editingAcademicYear ? handleUpdateAcademicYear : handleAddAcademicYear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Year *</label>
                <input 
                  type="number" 
                  value={newAcademicYear.startYear} 
                  onChange={e => setNewAcademicYear({...newAcademicYear, startYear: e.target.value})} 
                  required 
                  min="2000"
                  max="2100"
                  className="input-field" 
                  placeholder="e.g. 2026" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">End Year *</label>
                <input 
                  type="number" 
                  value={newAcademicYear.endYear} 
                  onChange={e => setNewAcademicYear({...newAcademicYear, endYear: e.target.value})} 
                  required 
                  min="2000"
                  max="2100"
                  className="input-field" 
                  placeholder="e.g. 2027" 
                />
              </div>
              
              {!editingAcademicYear && (
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="setAsActive"
                    checked={newAcademicYear.setAsActive}
                    onChange={e => setNewAcademicYear({...newAcademicYear, setAsActive: e.target.checked})}
                    className="w-4 h-4 text-teal border-gray-300 rounded focus:ring-teal"
                  />
                  <label htmlFor="setAsActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Set as active academic year for all colleges
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAcademicYearModal(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={academicYearSaving} className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2">
                  {academicYearSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {editingAcademicYear ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      {editingAcademicYear ? 'Update Academic Year' : 'Create Academic Year'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
