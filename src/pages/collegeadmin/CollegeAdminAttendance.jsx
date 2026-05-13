import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, Calendar, Users, Download, Filter, Search, Clock, CheckCircle2, XCircle, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CollegeAdminAttendance() {
  const { collegeId, collegeName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClub, setFilterClub] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [clubs, setClubs] = useState([]);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    presentCount: 0,
    rejectedCount: 0,
    uniqueEvents: 0
  });

  useEffect(() => {
    fetchAttendanceData();
    fetchClubs();
  }, [collegeId]);

  const fetchClubs = async () => {
    if (!collegeId) return;
    try {
      const snap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceData = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const allAttendance = [];
      const eventSet = new Set();
      let totalPresent = 0;
      let totalRejected = 0;
      
      // Get all clubs for this college
      const clubsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      
      // Fetch attendance for each club's events
      for (const clubDoc of clubsSnap.docs) {
        const clubData = clubDoc.data();
        const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubDoc.id}/events`);
        const eventsSnap = await getDocs(eventsRef);
        
        for (const eventDoc of eventsSnap.docs) {
          const eventData = eventDoc.data();
          eventSet.add(eventDoc.id);
          
          const attendanceRef = collection(db, `colleges/${collegeId}/clubs/${clubDoc.id}/events/${eventDoc.id}/attendance`);
          const attendanceSnap = await getDocs(attendanceRef);
          
          attendanceSnap.forEach(attDoc => {
            const attData = attDoc.data();
            if (attData.status === 'present') totalPresent++;
            else if (attData.status === 'rejected') totalRejected++;
            
            allAttendance.push({
              id: attDoc.id,
              eventId: eventDoc.id,
              clubId: clubDoc.id,
              clubName: clubData.name,
              eventName: eventData.eventName || 'Untitled Event',
              eventDate: eventData.eventDate?.toDate(),
              eventTime: eventData.eventTime,
              venue: eventData.venue,
              studentName: attData.studentName || 'Unknown',
              studentEmail: attData.studentEmail || 'Unknown',
              rollNumber: attData.rollNumber || 'N/A',
              department: attData.department || 'N/A',
              status: attData.status,
              timestamp: attData.timestamp?.toDate(),
              scannedBy: attData.scannedBy || 'Unknown'
            });
          });
        }
      }
      
      // Sort by timestamp (newest first)
      allAttendance.sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeB - timeA;
      });
      
      setAttendanceData(allAttendance);
      setStats({
        totalAttendance: allAttendance.length,
        presentCount: totalPresent,
        rejectedCount: totalRejected,
        uniqueEvents: eventSet.size
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = 
      record.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.clubName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClub = filterClub === 'all' || record.clubId === filterClub;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate && record.eventDate) {
      const recordDate = record.eventDate.toISOString().split('T')[0];
      matchesDate = recordDate === filterDate;
    }
    
    return matchesSearch && matchesClub && matchesStatus && matchesDate;
  });

  const exportToCSV = () => {
    const headers = [
      'Student Name', 'Email', 'Roll Number', 'Department',
      'Event Name', 'Club', 'Event Date', 'Event Time', 'Venue',
      'Status', 'Timestamp', 'Scanned By'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredAttendance.map(record => [
        `"${record.studentName}"`,
        `"${record.studentEmail}"`,
        `"${record.rollNumber}"`,
        `"${record.department}"`,
        `"${record.eventName}"`,
        `"${record.clubName}"`,
        record.eventDate ? record.eventDate.toLocaleDateString() : '',
        record.eventTime || '',
        `"${record.venue || ''}"`,
        record.status,
        record.timestamp ? record.timestamp.toLocaleString() : '',
        `"${record.scannedBy}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Attendance report downloaded successfully!");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
              <Calendar className="text-teal" /> Attendance History
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchAttendanceData();
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
            <h1 className="text-2xl sm:text-3xl font-bold text-navy dark:text-white">Attendance Records</h1>
            <p className="text-gray-500 text-sm sm:text-base">Complete attendance history across all events in {collegeName}.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-navy-soft p-4 rounded-xl border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Users size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy dark:text-white">{stats.totalAttendance}</p>
                  <p className="text-xs text-gray-500">Total Scans</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-navy-soft p-4 rounded-xl border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy dark:text-white">{stats.presentCount}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-navy-soft p-4 rounded-xl border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy dark:text-white">{stats.rejectedCount}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-navy-soft p-4 rounded-xl border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy dark:text-white">{stats.uniqueEvents}</p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-navy-soft rounded-xl p-4 mb-6 border border-gray-200 dark:border-white/5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, roll number, event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-navy dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-navy dark:text-white"
                />
                <select
                  value={filterClub}
                  onChange={(e) => setFilterClub(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-navy dark:text-white"
                >
                  <option value="all">All Clubs</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-navy dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-navy-soft rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal mx-auto mb-4"></div>
                Loading attendance records...
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No attendance records found</p>
                <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                      <th className="p-4 text-left font-medium">Student Information</th>
                      <th className="p-4 text-left font-medium">Event Information</th>
                      <th className="p-4 text-left font-medium">Date & Time</th>
                      <th className="p-4 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredAttendance.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-navy dark:text-white">{record.studentName}</p>
                            {record.studentEmail && record.studentEmail !== 'Unknown' && (
                              <p className="text-sm text-gray-500">{record.studentEmail}</p>
                            )}
                            <div className="flex gap-2 mt-1">
                              {record.rollNumber && record.rollNumber !== 'N/A' && (
                                <span className="text-xs text-gray-500">Roll: {record.rollNumber}</span>
                              )}
                              {record.department && record.department !== 'N/A' && (
                                <span className="text-xs text-gray-500">Dept: {record.department}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-navy dark:text-white">{record.eventName}</p>
                            <p className="text-sm text-teal">{record.clubName}</p>
                            {record.venue && (
                              <p className="text-xs text-gray-500"> {record.venue}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {record.eventDate && (
                              <p className="text-navy dark:text-white">
                                {record.eventDate.toLocaleDateString()}
                              </p>
                            )}
                            {record.eventTime && (
                              <p className="text-gray-500">{record.eventTime}</p>
                            )}
                            {record.timestamp && (
                              <p className="text-xs text-gray-500">
                                Scanned: {record.timestamp.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
