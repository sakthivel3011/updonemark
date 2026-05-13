import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export async function logAction(uid, collegeId, action, metadata = {}) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      uid,
      collegeId,
      action,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
