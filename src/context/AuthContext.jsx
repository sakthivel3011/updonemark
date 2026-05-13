import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { isSuperAdminAuthenticated } from "../utils/superAdminAuth";

const AuthContext = createContext();

// Clear all localStorage except auth data
function clearLocalStorageExceptAuth() {
  const authData = localStorage.getItem('auth_user');
  const authCredentials = localStorage.getItem('auth_credentials');
  const hasRegistered = localStorage.getItem('has_registered');
  localStorage.clear();
  if (authData) {
    localStorage.setItem('auth_user', authData);
  }
  if (authCredentials) {
    localStorage.setItem('auth_credentials', authCredentials);
  }
  if (hasRegistered) {
    localStorage.setItem('has_registered', hasRegistered);
  }
}

// Save auth data to localStorage
function saveAuthToLocalStorage(userData) {
  clearLocalStorageExceptAuth();
  localStorage.setItem('auth_user', JSON.stringify(userData));
  localStorage.setItem('has_registered', 'true');
}

// Save auth credentials to localStorage for auto-login
function saveAuthCredentials(email, password) {
  clearLocalStorageExceptAuth();
  localStorage.setItem('auth_credentials', JSON.stringify({ email, password }));
  localStorage.setItem('has_registered', 'true');
}

// Save Google auth flag for auto-login
function saveGoogleAuthFlag() {
  clearLocalStorageExceptAuth();
  localStorage.setItem('auth_google', 'true');
}

// Load auth data from localStorage
function loadAuthFromLocalStorage() {
  const authData = localStorage.getItem('auth_user');
  if (authData) {
    try {
      return JSON.parse(authData);
    } catch (e) {
      console.error('Error parsing auth data from localStorage:', e);
      localStorage.removeItem('auth_user');
    }
  }
  return null;
}

// Load auth credentials from localStorage
function loadAuthCredentials() {
  const authCredentials = localStorage.getItem('auth_credentials');
  if (authCredentials) {
    try {
      return JSON.parse(authCredentials);
    } catch (e) {
      console.error('Error parsing auth credentials from localStorage:', e);
      localStorage.removeItem('auth_credentials');
    }
  }
  return null;
}

// Clear auth data from localStorage
function clearAuthFromLocalStorage() {
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_credentials');
  localStorage.removeItem('auth_token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [collegeId, setCollegeId] = useState(null);
  const [collegeName, setCollegeName] = useState(null);
  const [clubId, setClubId] = useState(null);
  const [clubName, setClubName] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userUnsubscribe = null;
    let loadingTimeout = null;
    
    // Check if super admin is authenticated via localStorage
    if (isSuperAdminAuthenticated()) {
      console.log('Super admin authenticated via localStorage');
      setUserRole('superadmin');
      setCollegeId(null);
      setCollegeName(null);
      setClubId(null);
      setClubName(null);
      setUserStatus(null);
      setAcademicYear('');
      setUser({ uid: 'superadmin', email: 'superadmin@updone.com' });
      setLoading(false);
      return;
    }
    
    // Timeout to ensure loading is always cleared (safety net)
    loadingTimeout = setTimeout(() => {
      console.log('Auth timeout - forcing loading to false');
      setLoading(false);
    }, 5000);
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User logged in: ${firebaseUser.uid}` : 'No user');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Use onSnapshot for real-time updates to user data
        const docRef = doc(db, "users", firebaseUser.uid);
        userUnsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRole(data.role);
            setCollegeId(data.collegeId);
            setCollegeName(data.collegeName);
            if (data.role === 'coordinator') {
              setClubId(data.clubId || null);
              setClubName(data.clubName || null);
            } else {
              setClubId(null);
              setClubName(null);
            }
            setUserStatus(data.status || 'pending');
            
            // Fetch college data for academic year
            if (data.collegeId) {
              const collegeRef = doc(db, 'colleges', data.collegeId);
              getDoc(collegeRef).then(collegeSnap => {
                if (collegeSnap.exists()) {
                  setAcademicYear(collegeSnap.data().academicYear || '');
                }
              }).catch(err => {
                console.error("Error fetching college data:", err);
              });
            }

            // Save to localStorage
            saveAuthToLocalStorage({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: data.role,
              collegeId: data.collegeId,
              collegeName: data.collegeName,
              clubId: data.clubId,
              clubName: data.clubName,
              status: data.status
            });

            // Get and save JWT token to localStorage
            firebaseUser.getIdToken().then((token) => {
              localStorage.setItem('auth_token', token);
            }).catch(err => {
              console.error('Error getting ID token:', err);
            });
          } else {
            // User document doesn't exist - user might be newly created
            console.warn("User document not found for UID:", firebaseUser.uid);
            setUserRole(null);
            setCollegeId(null);
            setCollegeName(null);
            setClubId(null);
            setClubName(null);
            setUserStatus(null);
            setAcademicYear('');
            clearAuthFromLocalStorage();
          }
          // Clear timeout and set loading to false
          if (loadingTimeout) clearTimeout(loadingTimeout);
          setLoading(false);
        }, (error) => {
          console.error("Error in user data listener:", error);
          // If permission denied, set default values and continue
          if (error.code === 'permission-denied') {
            console.warn("Permission denied reading user document, user may need to complete registration");
            setUserRole(null);
            setCollegeId(null);
            setCollegeName(null);
            setClubId(null);
            setClubName(null);
            setUserStatus(null);
            setAcademicYear('');
          }
          if (loadingTimeout) clearTimeout(loadingTimeout);
          setLoading(false);
        });
        
      } else {
        console.log('No Firebase user detected. Clearing state...');
        setUser(null);
        setUserRole(null);
        setCollegeId(null);
        setCollegeName(null);
        setClubId(null);
        setClubName(null);
        setUserStatus(null);
        setAcademicYear('');
        clearAuthFromLocalStorage();
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setLoading(false);
      }
    });

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      unsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  const value = {
    user,
    userRole,
    collegeId,
    collegeName,
    clubId,
    clubName,
    userStatus,
    academicYear,
    loading,
    saveCredentials: saveAuthCredentials,
    clearAuth: () => {
      auth.signOut();
      clearAuthFromLocalStorage();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
