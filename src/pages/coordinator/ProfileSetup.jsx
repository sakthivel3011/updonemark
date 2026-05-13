import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Users, ChevronRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfileSetup() {
  const { user, collegeId } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [assignedClubIds, setAssignedClubIds] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!collegeId) return;
      try {
        // Fetch clubs
        const clubsRef = collection(db, `colleges/${collegeId}/clubs`);
        const clubsSnap = await getDocs(clubsRef);
        const clubsData = clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClubs(clubsData);

        // Fetch coordinators to find which clubs are already assigned
        const coordinatorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'coordinator'),
          where('collegeId', '==', collegeId),
          where('status', '==', 'approved')
        );
        const coordSnap = await getDocs(coordinatorsQuery);
        const assignedIds = coordSnap.docs
          .map(d => d.data().clubId)
          .filter(id => id); // Filter out null/undefined
        setAssignedClubIds(assignedIds);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load clubs.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collegeId]);

  // Check if a club is already assigned to another coordinator
  const isClubAssigned = (clubId) => assignedClubIds.includes(clubId);

  // Get available clubs
  const availableClubs = clubs.filter(club => !isClubAssigned(club.id));

  const handleSave = async () => {
    if (!selectedClubId) {
      toast.error("Please select a club.");
      return;
    }

    // Double-check if club is still available
    if (isClubAssigned(selectedClubId)) {
      toast.error("This club is already assigned to another coordinator!");
      return;
    }

    setSaving(true);
    try {
      const selectedClub = clubs.find(c => c.id === selectedClubId);
      const userRef = doc(db, "users", user.uid);
      
      await updateDoc(userRef, {
        clubId: selectedClub.id,
        clubName: selectedClub.name
      });

      toast.success("Profile setup complete!");
      // Force reload to update auth context state
      window.location.href = '/coordinator/dashboard';
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile.");
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-offwhite"><Loader2 className="animate-spin text-teal" size={40} /></div>;

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-navy-soft rounded-[2rem] shadow-xl p-8 border border-white/20 dark:border-white/5" data-aos="fade-up">
        <div className="w-16 h-16 bg-teal/10 text-teal rounded-2xl flex items-center justify-center mb-6">
          <Users size={32} />
        </div>
        
        <h2 className="text-3xl font-bold text-navy dark:text-white mb-2">Welcome!</h2>
        <p className="text-gray-500 mb-8">Please select your club or department to continue setup.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-navy dark:text-white mb-2 ml-1">Select Club / Department</label>
            {clubs.length > 0 ? (
              <>
                {availableClubs.length === 0 ? (
                  <div className="p-4 bg-rust/10 border border-rust/20 text-rust rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">All clubs are assigned!</p>
                      <p className="mt-1">All available clubs already have coordinators. Please contact your College Admin to either:</p>
                      <ul className="mt-2 ml-4 list-disc">
                        <li>Create a new club for you</li>
                        <li>Reassign an existing coordinator</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <select 
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full px-4 py-3 bg-offwhite dark:bg-navy border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-teal text-navy dark:text-white outline-none cursor-pointer"
                  >
                    <option value="" disabled>Choose an option...</option>
                    {clubs.map(c => (
                      <option 
                        key={c.id} 
                        value={c.id}
                        disabled={isClubAssigned(c.id)}
                      >
                        {c.name} {isClubAssigned(c.id) ? ' (Already has coordinator)' : ''}
                      </option>
                    ))}
                  </select>
                )}

                {/* Club availability legend */}
                <div className="mt-3 p-3 bg-gray-50 dark:bg-navy/50 rounded-lg text-xs">
                  <p className="font-medium text-gray-500 mb-2">Club Availability:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {clubs.slice(0, 6).map(club => (
                      <div key={club.id} className="flex items-center gap-2">
                        {isClubAssigned(club.id) ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-gray-400 line-through">{club.name}</span>
                            <span className="text-red-500 text-[10px]">Taken</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} className="text-green-500" />
                            <span className="text-green-600 dark:text-green-400">{club.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                    {clubs.length > 6 && (
                      <p className="text-gray-400 text-[10px]">...and {clubs.length - 6} more</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-rust/10 text-rust rounded-xl text-sm">
                No clubs found for your college. Please contact your College Admin.
              </div>
            )}
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving || !selectedClubId || availableClubs.length === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save & Continue'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
