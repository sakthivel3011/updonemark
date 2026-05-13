import { useEffect, useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export function useQRRotate(collegeId, clubId, eventId, isActive) {
  const [qrVersion, setQrVersion] = useState(0);
  const [qrSecret, setQrSecret] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isPaused, setIsPaused] = useState(false);

  // Listen to Firestore for current QR state
  useEffect(() => {
    if (!eventId || !collegeId || !clubId) return;
    
    const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
    const unsub = onSnapshot(eventRef, (snap) => {
      if (snap.exists()) {
        setQrVersion(snap.data().qrVersion || 0);
        setQrSecret(snap.data().qrSecret || "");
      }
    });
    return unsub;
  }, [eventId, collegeId, clubId]);

  // Rotation interval
  useEffect(() => {
    if (!isActive || isPaused || !eventId || !collegeId || !clubId) return;

    const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);

    const rotateInterval = setInterval(async () => {
      const newSecret = crypto.randomUUID();
      try {
        await updateDoc(eventRef, {
          qrSecret: newSecret,
          qrVersion: qrVersion + 1,
          qrLastRotated: serverTimestamp()
        });
        setCountdown(30);
      } catch (err) {
        console.error("QR Rotation failed:", err);
      }
    }, 30000);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(rotateInterval);
      clearInterval(countdownInterval);
    };
  }, [isActive, isPaused, qrVersion, eventId, collegeId, clubId]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return { qrVersion, qrSecret, countdown, isPaused, pause, resume };
}
