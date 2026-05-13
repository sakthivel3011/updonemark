import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../firebase/config';
import { generateQRUrl } from '../../utils/qrGenerator';
import { StopCircle, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PublicQRDisplay() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Get college and club from query params (for shared links)
  const collegeId = searchParams.get('college');
  const clubId = searchParams.get('club');

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // QR URL for scanning (this is what students scan to mark attendance)
  const qrVersion = 1;
  const qrUrl = generateQRUrl(window.location.host, eventId, collegeId, clubId, qrVersion);

  // Load Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !collegeId || !clubId) {
        toast.error('Invalid link. Missing event information.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setEventData(snap.data());
        } else {
          toast.error('Event not found or has been deleted');
        }
      } catch (err) {
        console.error('Failed to load event:', err);
        toast.error('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, collegeId, clubId]);

  // Listen for real-time event updates (isActive, isPaused changes)
  useEffect(() => {
    if (!eventId || !collegeId || !clubId) return;

    const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
    const unsubscribe = onSnapshot(eventRef, (snap) => {
      if (snap.exists()) {
        setEventData(snap.data());
      }
    });

    return () => unsubscribe();
  }, [eventId, collegeId, clubId]);

  // Countdown timer for QR refresh indication
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <div className="animate-spin text-teal">
          <StopCircle size={40} />
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center p-4">
        <div className="text-center">
          <StopCircle size={64} className="text-rust mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Event Not Found</h2>
          <p className="text-gray-500">This event may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const isPaused = eventData?.isPaused || false;
  const isActive = eventData?.isActive !== false; // default to true if not set

  return (
    <div className="min-h-screen bg-offwhite text-navy flex flex-col items-center justify-center p-4">
      {/* Event Header */}
      <div className="w-full max-w-md mb-6 text-center">
        <h1 className="text-xl font-bold text-navy mb-2">{eventData?.eventName}</h1>
        <p className="text-sm text-gray-500">{eventData?.date} • {eventData?.venue}</p>
        
        {/* Status Badge */}
        {!isActive ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rust/10 text-rust rounded-full text-xs font-bold mt-2">
            <StopCircle size={12} /> Event Ended
          </span>
        ) : isPaused ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mt-2">
            <Pause size={12} /> Paused
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mt-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
          </span>
        )}
      </div>

      {/* QR Code Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgb(0,0,0,0.08)] border border-gray-100 max-w-sm w-full">
        
        {/* Status Messages */}
        {!isActive ? (
          <div className="mb-4 p-3 bg-rust/10 text-rust rounded-xl text-center text-sm font-medium">
            This event has ended. QR code is no longer active.
          </div>
        ) : isPaused ? (
          <div className="mb-4 p-3 bg-amber-100 text-amber-700 rounded-xl text-center text-sm font-medium">
            <Pause size={16} className="inline mr-1" /> Attendance is temporarily paused.
          </div>
        ) : null}
        
        {/* QR Label */}
        <div className="text-center mb-4">
          <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Scan to Mark Attendance</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className={`relative inline-block transition-opacity duration-300 ${!isActive || isPaused ? 'opacity-40' : 'opacity-100'}`}>
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-50 inline-block">
              <QRCodeSVG 
                value={qrUrl} 
                size={260}
                level="H"
                includeMargin={false}
                fgColor="#040F16"
              />
            </div>
            
            {/* Paused Overlay */}
            {isActive && isPaused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-navy/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                  <Pause size={24} />
                  <span>PAUSED</span>
                </div>
              </div>
            )}
            
            {/* Ended Overlay */}
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-rust/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                  <StopCircle size={24} />
                  <span>ENDED</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Timer */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 tracking-wider uppercase">
            <span>Refresh</span>
            <span className="text-teal font-black">{countdown}s</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal to-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Event Details */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium text-navy">{eventData?.date}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Time:</span>
            <span className="font-medium text-navy">{eventData?.timeStart || 'All Day'}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Venue:</span>
            <span className="font-medium text-navy">{eventData?.venue}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Powered by UpDone Mark</p>
        <p className="text-xs text-gray-400 mt-1">Scan the QR code with your phone to mark attendance</p>
      </div>
    </div>
  );
}
