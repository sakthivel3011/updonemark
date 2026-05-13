import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, limit, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { logAction } from '../../utils/activityLogger';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, MapPin, Compass, AlertCircle, PlusCircle, Loader2, Share2, CheckCircle, ArrowRight, GraduationCap, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EVENT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateEventIdCandidate(length = 6) {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * EVENT_ID_ALPHABET.length);
    result += EVENT_ID_ALPHABET[index];
  }
  return result;
}

export default function AddEvent() {
  const { user, collegeId, collegeName, clubId, clubName, userStatus, academicYear } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const hasClubAssigned = !!clubId;
  const isApproved = userStatus === 'approved';

  const [formData, setFormData] = useState({
    eventName: '',
    date: new Date().toISOString().split('T')[0],
    timeStartHour: '09',
    timeStartMinute: '00',
    timeStartAmPm: 'AM',
    venue: '',
    radiusMeters: '100'
  });

  // GPS toggle: true = GPS validation enabled, false = simple save (no GPS)
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [createdEventData, setCreatedEventData] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Clear any stale Leaflet state from previous hot-reload
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
        mapRef.current.innerHTML = '';
      }

      const leafletMap = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMap);
      mapInstanceRef.current = leafletMap;
    } catch (err) {
      console.warn('Leaflet init error (safe to ignore on hot-reload):', err.message);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && location) {
      if (marker) {
        marker.setLatLng([location.lat, location.lng]);
      } else {
        const newMarker = L.marker([location.lat, location.lng]).addTo(map);
        setMarker(newMarker);
      }
      map.setView([location.lat, location.lng], 16);
    }
  }, [location, marker]);

  const generateUniqueEventId = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateEventIdCandidate();
      const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
      const existsQuery = query(
        eventsRef,
        where('eventId', '==', candidate),
        limit(1)
      );
      const existsSnap = await getDocs(existsQuery);
      if (existsSnap.empty) {
        return candidate;
      }
    }
    throw new Error('Unable to generate a unique Event ID. Please try again.');
  };

  const captureLocation = () => {
    setLocLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setLocation(newLoc);
          toast.success("Location captured successfully!");
          setLocLoading(false);
        },
        (err) => {
          console.error(err);
          toast.error("Failed to capture location. Please ensure location permissions are granted.");
          setLocLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setLocLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setLocation({ lat, lng });
    toast.success("Location selected on map!");
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.on('click', handleMapClick);
      return () => map.off('click', handleMapClick);
    }
  }, []);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
  };

  const handleShareWhatsApp = () => {
    if (!createdEventId) return;
    const shareUrl = `${window.location.origin}/e/${createdEventId}`;
    const text = encodeURIComponent(`📍 *${createdEventData?.eventName}*\n📅 ${createdEventData?.date} | ⏰ ${createdEventData?.timeStart}\n📍 ${createdEventData?.venue}\n\nScan this QR Code to mark your attendance:\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleGoToQR = () => {
    if (createdEventId) {
      navigate(`/coordinator/event/${createdEventId}/qr`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If GPS is enabled, location is required
    if (gpsEnabled && !location) {
      toast.error("Please capture GPS location first.");
      return;
    }

    setSaving(true);
    try {
      const generatedEventId = await generateUniqueEventId();

      const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${generatedEventId}`);

      // Build base event object
      const newEvent = {
        eventId: generatedEventId,
        eventName: formData.eventName,
        date: formData.date,
        timeStart: `${formData.timeStartHour.toString().padStart(2, '0')}:${formData.timeStartMinute.toString().padStart(2, '0')} ${formData.timeStartAmPm}`,
        venue: formData.venue,
        gpsEnabled: gpsEnabled,
        clubName,
        clubId,
        academicYear: academicYear,
        qrSecret: crypto.randomUUID(),
        qrVersion: 1,
        qrLastRotated: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isActive: true,
        totalScans: 0,
        suspiciousActivity: false
      };

      // Only add GPS fields if GPS is enabled
      if (gpsEnabled && location) {
        newEvent.eventLat = location.lat;
        newEvent.eventLng = location.lng;
        newEvent.eventRadius = parseInt(formData.radiusMeters, 10);
        newEvent.radiusMeters = parseInt(formData.radiusMeters, 10);
        newEvent.gpsLat = location.lat;
        newEvent.gpsLng = location.lng;
      }

      const batch = writeBatch(db);
      batch.set(eventRef, newEvent);
      
      // Add eventDirectory entry for faster student lookups
      const eventDirRef = doc(db, `eventDirectory/${generatedEventId}`);
      batch.set(eventDirRef, {
        eventRefPath: `colleges/${collegeId}/clubs/${clubId}/events/${generatedEventId}`,
        eventId: generatedEventId,
        eventName: formData.eventName,
        createdAt: serverTimestamp()
      });
      
      await batch.commit();

      // Log action
      await logAction(user.uid, collegeId, "CREATE_EVENT", { eventId: generatedEventId, eventName: formData.eventName });

      toast.success("Event created successfully!");
      
      // Store event info for success modal
      setCreatedEventId(generatedEventId);
      setCreatedEventData(newEvent);
      setShowSuccessModal(true);
      setSaving(false);
    } catch (err) {
      console.error(err);
      if (err.code === 'permission-denied') {
        toast.error("Permission denied. Please ensure your account is approved by your College Admin.");
      } else {
        toast.error("Failed to create event: " + (err.message || "Unknown error"));
      }
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 sm:h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
              <PlusCircle size={22} className="text-teal" /> Create New Event
            </h2>
          </div>
          <DarkModeToggle />
        </header>

        <div className="p-3 sm:p-5 md:p-8 flex-1 overflow-auto">
          {isApproved && hasClubAssigned && (
            <div className="max-w-4xl mx-auto mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal rounded-full text-sm font-semibold">
                <GraduationCap size={16} />
                {academicYear ? `${academicYear} Academic Year` : 'Academic Year Event'}
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto card" data-aos="fade-up">

            {!hasClubAssigned ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">No Club Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You don't have a club assigned yet. Please contact your College Admin to assign a club to your account.
                </p>
                <p className="text-sm text-gray-400">
                  College: {collegeName || 'Not set'}
                </p>
              </div>
            ) : !isApproved ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">Account Not Approved</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Your coordinator account is pending approval. Please contact your College Admin to approve your account before creating events.
                </p>
                <p className="text-sm text-gray-400">
                  Current Status: {userStatus || 'pending'}
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">Event Name</label>
                  <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} required className="input-field" placeholder="e.g. Annual Tech Symposium" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">Venue</label>
                  <input type="text" name="venue" value={formData.venue} onChange={handleChange} required className="input-field" placeholder="e.g. Main Auditorium" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">Start Time</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      name="timeStartHour" 
                      value={formData.timeStartHour} 
                      onChange={handleChange}
                      min="1"
                      max="12"
                      placeholder="HH"
                      className="input-field !px-2 text-center w-20"
                    />
                    <span className="flex items-center font-bold text-navy dark:text-white">:</span>
                    <input 
                      type="number"
                      name="timeStartMinute" 
                      value={formData.timeStartMinute} 
                      onChange={handleChange}
                      min="0"
                      max="59"
                      placeholder="MM"
                      className="input-field !px-2 text-center w-20"
                    />
                    <select 
                      name="timeStartAmPm" 
                      value={formData.timeStartAmPm} 
                      onChange={handleChange} 
                      className="input-field !px-2 text-center cursor-pointer appearance-none w-24"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GPS Toggle Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="bg-offwhite dark:bg-navy p-5 rounded-xl border border-gray-200 dark:border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-navy dark:text-white flex items-center gap-2 mb-1">
                        <MapPin size={18} className="text-teal" /> GPS Location Validation
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {gpsEnabled
                          ? 'Students must be within the event radius to mark attendance.'
                          : 'Students can mark attendance from anywhere — no location check.'}
                      </p>
                    </div>
                    {/* Yes / No Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-navy/60 rounded-xl p-1 border border-gray-200 dark:border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGpsEnabled(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          !gpsEnabled
                            ? 'bg-rust text-white shadow-md shadow-rust/30'
                            : 'text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setGpsEnabled(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          gpsEnabled
                            ? 'bg-teal text-white shadow-md shadow-teal/30'
                            : 'text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>

                  {/* GPS controls — only shown when enabled */}
                  {gpsEnabled && (
                    <div className="mt-5 flex flex-col md:flex-row items-center gap-4 justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Click on the map or use GPS to capture event coordinates.</p>
                      </div>
                      <button type="button" onClick={captureLocation} disabled={locLoading} className="w-full md:w-auto btn-secondary flex items-center justify-center gap-2 py-2">
                        {locLoading ? <Loader2 className="animate-spin" size={18} /> : <Compass size={18} />}
                        {location ? 'Recapture GPS' : 'Use GPS'}
                      </button>
                    </div>
                  )}

                  {/* Map div ALWAYS in DOM — hiding it prevents the Leaflet "container already initialized" crash */}
                  <div
                    ref={mapRef}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 mt-4"
                    style={{ height: gpsEnabled ? '300px' : '0px', overflow: 'hidden', border: gpsEnabled ? undefined : 'none', marginTop: gpsEnabled ? undefined : 0 }}
                  ></div>

                  {gpsEnabled && (
                    <div className="mt-3 space-y-4">
                      {location ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900/50">
                          <MapPin size={16} /> Location Captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                          <AlertCircle size={16} /> Select location on map or use GPS before creating event.
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-white mb-2">Allowed Attendance Radius</label>
                        <select name="radiusMeters" value={formData.radiusMeters} onChange={handleChange} className="input-field">
                          <option value="50">50 meters (Strict)</option>
                          <option value="100">100 meters (Standard)</option>
                          <option value="200">200 meters (Large Hall)</option>
                          <option value="300">300 meters (Open Ground)</option>
                          <option value="500">500 meters (Campus Wide)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> Students must be within this distance to mark attendance.</p>
                      </div>
                    </div>
                  )}

                  {/* No-GPS info banner */}
                  {!gpsEnabled && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50">
                      <AlertCircle size={16} /> No GPS required — students can submit from any location.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving || (gpsEnabled && !location)}
                  className="w-full btn-primary flex justify-center items-center gap-2 py-4 text-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={24} /> : 'Create Event & Generate QR'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </main>

      {/* Success Modal with WhatsApp Share */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm"></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
            </div>

            <h3 className="text-2xl font-bold text-navy dark:text-white mb-2">Event Created!</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your event <strong className="text-navy dark:text-white">{createdEventData?.eventName}</strong> is ready.
            </p>

            <div className="bg-gray-50 dark:bg-navy/50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-navy dark:text-white">{createdEventData?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium text-navy dark:text-white">{createdEventData?.timeStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Venue:</span>
                  <span className="font-medium text-navy dark:text-white">{createdEventData?.venue}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-all mb-4"
            >
              <Share2 size={20} /> Share on WhatsApp
            </button>

            <button
              onClick={handleGoToQR}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
            >
              Go to QR Page <ArrowRight size={18} />
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Only you can stop or pause this event from the QR page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
