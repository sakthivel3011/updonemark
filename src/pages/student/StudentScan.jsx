import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collectionGroup, doc, getDoc, collection, addDoc, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { haversineDistance } from '../../utils/gpsValidate';
import { CheckCircle2, AlertTriangle, Loader2, Navigation, MapPin, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StudentScan() {
  const { eventId } = useParams();

  const departmentCodes = {
    'AD': 'AIDS', 'AL': 'AIML', 'CS': 'CSE', 'AU': 'AUTO', 'CH': 'CHEM',
    'FT': 'FOOD', 'CE': 'CIVIL', 'CD': 'CSD', 'IT': 'IT', 'EE': 'EEE',
    'EI': 'EIE', 'EC': 'ECE', 'ME': 'MECH', 'MT': 'MTS', 'IS': 'MSC',
    'MC': 'MCA', 'MB': 'MBA', 'BI': 'BSC', 'AR': 'ARCH'
  };

  const getYearFromRollNo = (rollNo) => {
    if (!rollNo || rollNo.length < 2) return '';
    const y = parseInt(rollNo.substring(0, 2));
    if (y === 22) return '5th Year';
    if (y === 23) return '4th Year';
    if (y === 24) return '3rd Year';
    if (y === 25) return '2nd Year';
    if (y === 26) return '1st Year';
    return '1st Year';
  };

  const getDepartmentFromRollNo = (rollNo) => {
    if (!rollNo || rollNo.length < 4) return '';
    return departmentCodes[rollNo.substring(2, 4)] || '';
  };

  const getYearCodeFromRollNo = (rollNo) => {
    if (!rollNo || rollNo.length < 2) return null;
    return parseInt(rollNo.substring(0, 2));
  };

  const [step, setStep] = useState('loading_event');
  const [eventData, setEventData] = useState(null);
  const [eventRefPath, setEventRefPath] = useState(null);
  const [fatalError, setFatalError] = useState('');
  const [gpsData, setGpsData] = useState(null);
  const [name, setName] = useState(() => localStorage.getItem('student_name') || '');
  const [rollNumber, setRollNumber] = useState(() => localStorage.getItem('student_rollNumber') || '');
  const [department, setDepartment] = useState(() => localStorage.getItem('student_department') || '');
  const [year, setYear] = useState(() => localStorage.getItem('student_year') || '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(40);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    fetchInitialEvent();
    return () => {
      if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [eventId, gpsWatchId]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('student_name', name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem('student_rollNumber', rollNumber);
  }, [rollNumber]);

  useEffect(() => {
    localStorage.setItem('student_department', department);
  }, [department]);

  useEffect(() => {
    localStorage.setItem('student_year', year);
  }, [year]);

  // Auto-fill department and year when roll number changes
  useEffect(() => {
    if (rollNumber && rollNumber.length >= 4) {
      const autoDept = getDepartmentFromRollNo(rollNumber);
      const autoYear = getYearFromRollNo(rollNumber);
      
      if (autoDept && !department) {
        setDepartment(autoDept);
      }
      if (autoYear && !year) {
        setYear(autoYear);
      }
    }
  }, [rollNumber]);

  // Timer effect - counts down from 40 seconds when form is shown
  useEffect(() => {
    if (step === 'form') {
      setTimeLeft(40);
      setTimerExpired(false);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const resolveEventDoc = async (incomingEventId) => {
    const id = (incomingEventId || '').trim().toUpperCase();
    if (!id) return null;

    const directPath = doc(db, `eventDirectory/${id}`);
    const directorySnap = await getDoc(directPath);
    if (directorySnap.exists()) {
      const data = directorySnap.data();
      if (data?.eventRefPath) {
        return { id, refPath: data.eventRefPath };
      }
    }

    const eventLookupQuery = query(
      collectionGroup(db, 'events'),
      where('eventId', '==', id),
      limit(1)
    );
    const eventLookupSnap = await getDocs(eventLookupQuery);
    if (eventLookupSnap.empty) return null;

    const matchedDoc = eventLookupSnap.docs[0];
    return { id, refPath: matchedDoc.ref.path };
  };

  const fetchInitialEvent = async () => {
    try {
      console.log('Fetching event for ID:', eventId);
      const resolvedEvent = await resolveEventDoc(eventId);
      console.log('Resolved event:', resolvedEvent);
      
      if (!resolvedEvent) {
        setFatalError('Invalid event link. Event not found.');
        setStep('error');
        return;
      }

      const eventRef = doc(db, resolvedEvent.refPath);
      const snap = await getDoc(eventRef);
      if (!snap.exists()) {
        setFatalError('Invalid event link. Event data not found.');
        setStep('error');
        return;
      }
      
      const data = snap.data();
      console.log('Event data:', data);
      setEventRefPath(resolvedEvent.refPath);
      setEventData({ ...data, eventId: resolvedEvent.id });

      if (!data.isActive) {
        setFatalError('Attendance is closed for this event');
        setStep('error');
        return;
      }

      // If GPS is disabled for this event, go straight to form
      if (data.gpsEnabled !== true) {
        console.log('GPS disabled, going to form');
        setStep('form');
      } else {
        console.log('GPS enabled, going to intro');
        setStep('intro');
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setFatalError('Error loading event: ' + (err.message || 'Please try again.'));
      setStep('error');
    }
  };

  const requestGps = () => {
    // If GPS data already exists, go directly to form
    if (gpsData) {
      setStep('form');
      return;
    }

    setStep('fetching_gps');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        
        const watchId = navigator.geolocation.watchPosition(
          (watchPos) => {
            setGpsData({
              lat: watchPos.coords.latitude,
              lng: watchPos.coords.longitude,
              accuracy: watchPos.coords.accuracy,
            });
          },
          (err) => console.log("Watch position error:", err),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
        setGpsWatchId(watchId);
        setStep('form');
      },
      (err) => {
        console.error("GPS Error:", err);
        let errorMsg = 'Unable to verify location. Please turn on GPS and allow permissions.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (err.code === 2) {
          errorMsg = 'Unable to determine your location. Please ensure GPS is enabled.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setFatalError(errorMsg);
        setStep('error');
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !rollNumber.trim() || !department.trim() || !year.trim()) {
      setFormError('Please fill all fields');
      return;
    }

    setSubmitting(true);

    try {
      const currentGps = gpsData;
      const isGpsEvent = eventData?.gpsEnabled === true; // Only treat as GPS event if explicitly enabled

      console.log('Submission details:', { isGpsEvent, gpsEnabled: eventData?.gpsEnabled, hasGpsData: !!currentGps });

      const eventRef = doc(db, eventRefPath);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        setFormError('Invalid event link');
        setSubmitting(false);
        return;
      }
      const currentEventData = eventSnap.data();

      if (!currentEventData.isActive) {
        setFormError('Attendance is closed for this event');
        setSubmitting(false);
        return;
      }

      if (currentEventData.isPaused) {
        setFormError('The event is currently paused. Please try again later.');
        setSubmitting(false);
        return;
      }

      const attendanceRef = collection(db, `${eventRefPath}/attendance`);
      const normalizedRoll = rollNumber.trim().toUpperCase();
      
      // One-phone-one-time submission per event
      // Check if this phone has already submitted for this event (regardless of roll number)
      const phoneSubmissionKey = `phone_submitted_${eventData.eventId}`;
      if (localStorage.getItem(phoneSubmissionKey)) {
        setFormError('Attendance already submitted from this device for this event. One device can only submit once per event.');
        setSubmitting(false);
        return;
      }
      
      // Also check for duplicate roll number submissions (additional check)
      const localAttendanceKey = `attendance_submitted_${eventData.eventId}_${normalizedRoll}`;
      if (localStorage.getItem(localAttendanceKey)) {
        setFormError('Attendance already submitted for this roll number from this device.');
        setSubmitting(false);
        return;
      }

      // --- GPS-enabled path: validate radius ---
      if (isGpsEvent) {
        if (!currentGps) {
          setFormError('GPS data required for this event. Please enable GPS and try again.');
          setSubmitting(false);
          return;
        }

        let eventLat = currentEventData.eventLat ?? currentEventData.gpsLat ?? currentEventData.venueLat;
        let eventLng = currentEventData.eventLng ?? currentEventData.gpsLng ?? currentEventData.venueLng;
        let eventRadius = currentEventData.eventRadius ?? currentEventData.radiusMeters;

        eventLat = parseFloat(eventLat);
        eventLng = parseFloat(eventLng);
        eventRadius = parseFloat(eventRadius);

        if (isNaN(eventLat) || isNaN(eventLng) || isNaN(eventRadius) || eventRadius <= 0) {
          setFormError('Invalid event configuration (missing location/radius). Contact coordinator.');
          setSubmitting(false);
          return;
        }

        const distance = haversineDistance(currentGps.lat, currentGps.lng, eventLat, eventLng);
        const isInside = distance <= eventRadius;

        await addDoc(attendanceRef, {
          eventId: eventData.eventId,
          studentName: name.trim(),
          rollNumber: normalizedRoll,
          department: department.trim(),
          year: year,
          gpsLat: currentGps.lat,
          gpsLng: currentGps.lng,
          gpsAccuracy: currentGps.accuracy,
          distanceFromEvent: Math.round(distance),
          timestamp: serverTimestamp(),
          attemptType: isInside ? 'success' : 'outside',
          status: isInside ? 'present' : 'rejected'
        });

        if (isInside) {
          localStorage.setItem(localAttendanceKey, 'true');
          localStorage.setItem(phoneSubmissionKey, 'true');
          toast.success('Attendance marked successfully');
          setStep('success');
        } else {
          setFormError('You are not inside the event area. Please go near the event and try again.');
          toast.error('You are not inside the event area.');
          setSubmitting(false);
        }

      } else {
        // --- GPS-disabled path: simple save, always present ---
        console.log('Saving attendance without GPS validation');
        await addDoc(attendanceRef, {
          eventId: eventData.eventId,
          studentName: name.trim(),
          rollNumber: normalizedRoll,
          department: department.trim(),
          year: year,
          timestamp: serverTimestamp(),
          attemptType: 'success',
          status: 'present'
        });
        localStorage.setItem(localAttendanceKey, 'true');
        localStorage.setItem(phoneSubmissionKey, 'true');
        toast.success('Attendance marked successfully');
        setStep('success');
      }

    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setFormError('An error occurred during submission. Please try again.');
      setSubmitting(false);
    }
  };

  if (step === 'loading_event') {
    return (
      <div className="min-h-screen bg-offwhite dark:bg-navy flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-teal mb-4" size={40} />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Validating QR Code...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-offwhite dark:bg-navy flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg bg-rust/10 text-rust">
          <AlertTriangle size={36} />
        </div>
        <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md whitespace-pre-line">{fatalError}</p>
        {(fatalError.toLowerCase().includes('location') || fatalError.toLowerCase().includes('gps')) && (
          <button onClick={() => setStep('intro')} className="bg-navy dark:bg-teal text-white px-6 py-3 rounded-xl font-bold hover:bg-teal transition-colors">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-offwhite dark:bg-navy flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-navy dark:text-white mb-2">
          Attendance Marked Successfully
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          Your attendance for {eventData?.eventName} has been confirmed.
        </p>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-black mb-2">{eventData?.eventName}</h2>
            <p className="text-sm text-gray-600">{eventData?.date} • {eventData?.venue}</p>
          </div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation size={32} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Location Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              We need to verify your location to mark attendance.
            </p>
          </div>
          <button 
            onClick={requestGps}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  if (step === 'fetching_gps') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="animate-spin text-gray-600" size={32} />
          </div>
          <p className="text-black font-semibold text-lg">Getting your location...</p>
          <p className="text-gray-500 text-sm mt-2">Please allow permissions if asked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black mb-2">{eventData?.eventName}</h2>
          <p className="text-sm text-gray-600">{eventData?.date} • {eventData?.venue}</p>
        </div>

        {/* Timer Bar */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full h-2 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${
                timerExpired ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${(timeLeft / 40) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {timerExpired ? 'Time expired' : 'Time remaining'}
            </span>
            <span className={`text-sm font-bold ${timerExpired ? 'text-orange-500' : 'text-green-500'}`}>
              {timerExpired ? '0s' : `${timeLeft}s`}
            </span>
          </div>
                  </div>

        <div className="p-6">
          {gpsData && (
            <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 ${
              gpsData.accuracy <= 50 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <MapPin size={18} />
              <div>
                <p className="text-xs font-medium uppercase">GPS Accuracy</p>
                <p className="font-semibold text-sm">{gpsData.accuracy.toFixed(0)}m {gpsData.accuracy <= 50 ? '✓ Good' : '⚠ Need ≤50m'}</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm font-medium flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black transition-all placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input 
                type="text" 
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter your roll number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black uppercase font-semibold text-black transition-all placeholder-gray-400"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input 
                  type="text" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Dept"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black transition-all placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>
            </div>
            
            {(name || rollNumber || department || year) && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('student_name');
                  localStorage.removeItem('student_rollNumber');
                  localStorage.removeItem('student_department');
                  localStorage.removeItem('student_year');
                  setName('');
                  setRollNumber('');
                  setDepartment('');
                  setYear('');
                  toast.success('Form data cleared');
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-rust dark:hover:text-rust underline"
              >
                Clear saved data
              </button>
            )}
            <button 
              type="submit" 
              disabled={submitting || timerExpired || (eventData?.gpsEnabled === true && (!gpsData || gpsData.accuracy > 50))}
              className="w-full mt-6 bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin inline mr-2" size={18} />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Attendance'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

