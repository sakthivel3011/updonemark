import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { exportAttendanceToExcel } from '../../utils/excelExport';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, FileText, Calendar, Clock, Users, CheckCircle, XCircle, Loader2, ArrowLeft, Search, Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AttendanceRecords() {
  const { user, collegeId, clubId } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, present, absent
  const [searchRollNumber, setSearchRollNumber] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [collegeId, clubId]);

  const fetchAttendanceRecords = async () => {
    if (!collegeId || !clubId) {
      setLoading(false);
      return;
    }

    try {
      // First fetch all events for this club
      const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
      const eventsSnapshot = await getDocs(eventsRef);
      
      const allRecords = [];
      
      // For each event, fetch its attendance records
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const attendanceRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventDoc.id}/attendance`);
        const attendanceSnapshot = await getDocs(attendanceRef);
        
        attendanceSnapshot.forEach((doc) => {
          allRecords.push({
            id: doc.id,
            ...doc.data(),
            eventId: eventDoc.id,
            eventName: eventData.eventName
          });
        });
      }
      
      // Sort by timestamp
      allRecords.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.seconds - a.timestamp.seconds;
      });
      
      setRecords(allRecords);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    // Filter by status
    if (filter === 'all') return true;
    if (filter === 'present') return record.status === 'present';
    if (filter === 'absent') return record.status === 'absent' || record.status === 'late';
    return true;
  }).filter(record => {
    // Filter by roll number search
    if (!searchRollNumber.trim()) return true;
    return (record.rollNumber || '').toLowerCase().includes(searchRollNumber.toLowerCase().trim());
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceRecords();
    setRefreshing(false);
  };

  const handleDownload = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to download');
      return;
    }
    exportAttendanceToExcel(filteredRecords, 'Attendance Records', new Date().toISOString().split('T')[0]);
    toast.success('Download started');
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent' || r.status === 'late').length
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
           
            <h2 className="text-xl font-bold text-navy dark:text-white">Attendance Records</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="text-gray-500 hover:text-teal font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /> 
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-2"
            >
              <Download size={16} /> Download
            </button>
            <DarkModeToggle />
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
                    <p className="text-2xl font-bold text-navy dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                    <p className="text-2xl font-bold text-navy dark:text-white">{stats.present}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Absent/Late</p>
                    <p className="text-2xl font-bold text-navy dark:text-white">{stats.absent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by roll number..." 
                  value={searchRollNumber}
                  onChange={(e) => setSearchRollNumber(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-navy-soft border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy dark:text-white text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' ? 'bg-teal text-white' : 'bg-white dark:bg-navy-soft text-navy dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  All Records
                </button>
                <button
                  onClick={() => setFilter('present')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'present' ? 'bg-teal text-white' : 'bg-white dark:bg-navy-soft text-navy dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setFilter('absent')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'absent' ? 'bg-teal text-white' : 'bg-white dark:bg-navy-soft text-navy dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  Absent/Late
                </button>
              </div>
            </div>

            {/* Records Table */}
            <div className="card">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-teal" size={32} />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-4 px-4 text-sm font-semibold text-navy dark:text-white">Student Name</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-navy dark:text-white">Roll Number</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-navy dark:text-white">Event</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-navy dark:text-white">Date</th>
                        <th className="text-left py-4 px-4 text-sm font-semibold text-navy dark:text-white">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 text-sm text-navy dark:text-white">{record.studentName || 'Unknown'}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">{record.rollNumber || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm text-navy dark:text-white">{record.eventName || 'Unknown Event'}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.timestamp ? new Date(record.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.timestamp ? new Date(record.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
