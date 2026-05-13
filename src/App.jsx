import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginSelectorPage from './pages/public/LoginSelectorPage';
import ContactPage from './pages/public/ContactPage';
import FeaturesPage from './pages/public/FeaturesPage';
import PublicQRDisplay from './pages/public/PublicQRDisplay';

// Auth Pages
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import CollegeAdminLogin from './pages/auth/CollegeAdminLogin';
import CoordinatorLogin from './pages/auth/CoordinatorLogin';
import CoordinatorSignup from './pages/auth/CoordinatorSignup';
import WaitingForApproval from './pages/auth/WaitingForApproval';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminColleges from './pages/superadmin/SuperAdminColleges';
import SuperAdminAdmins from './pages/superadmin/SuperAdminAdmins';
import SuperAdminBackup from './pages/superadmin/SuperAdminBackup';
import SuperAdminMessages from './pages/superadmin/SuperAdminMessages';

// College Admin
import CollegeAdminDashboard from './pages/collegeadmin/CollegeAdminDashboard';
import CollegeAdminCoordinators from './pages/collegeadmin/CollegeAdminCoordinators';
import CollegeAdminClubs from './pages/collegeadmin/CollegeAdminClubs';
import CollegeAdminAnalytics from './pages/collegeadmin/CollegeAdminAnalytics';
import CollegeAdminAttendance from './pages/collegeadmin/CollegeAdminAttendance';

// Coordinator
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import AddEvent from './pages/coordinator/AddEvent';
import QRDisplay from './pages/coordinator/QRDisplay';
import EventHistory from './pages/coordinator/EventHistory';
import LiveAttendance from './pages/coordinator/LiveAttendance';
import AttendanceRecords from './pages/coordinator/AttendanceRecords';
import QRCodes from './pages/coordinator/QRCodes';
import ProfileSetup from './pages/coordinator/ProfileSetup';

// Student
import StudentScan from './pages/student/StudentScan';

// UI
import Loader from './components/ui/Loader';
import InitialLoader from './components/ui/InitialLoader';
import ScrollToTopButton from './components/ui/ScrollToTopButton';
import PageLoader from './components/ui/PageLoader';
import InstallBanner from './components/ui/InstallBanner';
import { isSuperAdminAuthenticated } from './utils/superAdminAuth';

// Route Guards
function SuperAdminRoute() {
  const isAuth = isSuperAdminAuthenticated();
  return isAuth ? <Outlet /> : <Navigate to="/superadmin-login" replace />;
}

function AuthRoute({ children }) {
  const { user, userRole, userStatus, loading } = useAuth();

  if (loading) return <Loader />;

  if (user) {
    if (userRole === 'coordinator') {
      if (userStatus === 'pending') {
        return <Navigate to="/coordinator/waiting-approval" replace />;
      }
      return <Navigate to="/coordinator/dashboard" replace />;
    } else if (userRole === 'collegeadmin') {
      return <Navigate to="/collegeadmin/dashboard" replace />;
    } else if (userRole === 'superadmin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
  }

  return children;
}

function ProtectedRoute({ role }) {
  const { user, userRole, userStatus, loading } = useAuth();

  // Wait for auth initialization to complete before making decisions
  if (loading) return <Loader />;

  // After auth is initialized, check authentication
  if (!user || userRole !== role) {
    return <Navigate to={`/${role === "coordinator" ? "coordinator" : "collegeadmin"}-login`} replace />;
  }

  // Prevent pending coordinators from accessing dashboard
  if (role === 'coordinator' && userStatus === 'pending') {
    return <Navigate to="/coordinator/waiting-approval" replace />;
  }

  return <Outlet />;
}

function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  if (showInitialLoader) {
    return <InitialLoader onComplete={() => setShowInitialLoader(false)} />;
  }

  return (
    <>
      <ScrollToTop />
      <PageLoader />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        
        <Route path="/login-selector" element={<AuthRoute><LoginSelectorPage /></AuthRoute>} />
        <Route path="/superadmin-login" element={<AuthRoute><SuperAdminLogin /></AuthRoute>} />
        <Route path="/collegeadmin-login" element={<AuthRoute><CollegeAdminLogin /></AuthRoute>} />
        <Route path="/coordinator-login" element={<AuthRoute><CoordinatorLogin /></AuthRoute>} />
        <Route path="/coordinator-signup" element={<AuthRoute><CoordinatorSignup /></AuthRoute>} />
        <Route path="/coordinator/waiting-approval" element={<WaitingForApproval />} />
        <Route path="/e/:eventId" element={<StudentScan />} />
        <Route path="/qr/:eventId" element={<PublicQRDisplay />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin/*" element={<SuperAdminRoute />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="colleges" element={<SuperAdminColleges />} />
          <Route path="admins" element={<SuperAdminAdmins />} />
          <Route path="backup" element={<SuperAdminBackup />} />
          <Route path="messages" element={<SuperAdminMessages />} />
        </Route>

        {/* College Admin Routes */}
        <Route path="/collegeadmin/*" element={<ProtectedRoute role="collegeadmin" />}>
          <Route path="dashboard" element={<CollegeAdminDashboard />} />
          <Route path="attendance" element={<CollegeAdminAttendance />} />
          <Route path="coordinators" element={<CollegeAdminCoordinators />} />
          <Route path="clubs" element={<CollegeAdminClubs />} />
          <Route path="analytics" element={<CollegeAdminAnalytics />} />
        </Route>

        {/* Coordinator Routes */}
        <Route path="/coordinator/*" element={<ProtectedRoute role="coordinator" />}>
          <Route path="profile-setup" element={<ProfileSetup />} />
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="event/new" element={<AddEvent />} />
          <Route path="event/:eventId/qr" element={<QRDisplay />} />
          <Route path="history" element={<EventHistory />} />
          <Route path="live-attendance" element={<LiveAttendance />} />
          <Route path="attendance-records" element={<AttendanceRecords />} />
          <Route path="qr-codes" element={<QRCodes />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScrollToTopButton />
      <InstallBanner />
    </>
  );
}

export default App;
