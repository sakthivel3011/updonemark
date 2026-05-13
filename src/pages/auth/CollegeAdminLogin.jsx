import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

/* ─── Google SVG ─────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ─── Component ──────────────────────────────────────────────────────── */
export default function CollegeAdminLogin() {
  const [email, setEmail]               = useState(localStorage.getItem('last_login_email') || '');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();
  const { saveCredentials } = useAuth();

  /* ── Shared auth handler ── */
  const handleAuthSuccess = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc    = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Check if user was pre-created by super admin
        const usersRef    = collection(db, 'users');
        const userQuery   = query(usersRef, where('email', '==', user.email), where('role', '==', 'collegeadmin'));
        const existingSnap = await getDocs(userQuery);

        if (!existingSnap.empty) {
          const existingUser = existingSnap.docs[0].data();
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || existingUser.displayName || user.email.split('@')[0],
            name: user.displayName || existingUser.name || user.email.split('@')[0],
            photoURL: user.photoURL || existingUser.photoURL || null,
            role: 'collegeadmin',
            collegeId: existingUser.collegeId,
            collegeName: existingUser.collegeName,
            status: 'approved',
            createdAt: existingUser.createdAt || new Date(),
          });
          toast.success(`Welcome back to ${existingUser.collegeName}!`);
          saveCredentials(email, password);
          localStorage.setItem('last_login_email', email);
          navigate('/collegeadmin/dashboard');
          return;
        }

        // Self-registration via email domain
        const emailDomain  = user.email.split('@')[1];
        const collegesRef  = collection(db, 'colleges');
        const q            = query(collegesRef, where('domain', '==', emailDomain), where('isActive', '==', true));
        const collegeSnap  = await getDocs(q);

        if (collegeSnap.empty) {
          toast.error('No college found for your email domain. Please contact your Super Admin.');
          await auth.signOut();
          return;
        }

        const college     = collegeSnap.docs[0];
        const collegeData = college.data();
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          name: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          role: 'collegeadmin',
          collegeId: college.id,
          collegeName: collegeData.name,
          status: 'approved',
          createdAt: new Date(),
        });
        toast.success(`Account created successfully for ${collegeData.name}!`);
        saveCredentials(email, password);
        localStorage.setItem('last_login_email', email);
        navigate('/collegeadmin/dashboard');
        return;
      }

      const data = userDoc.data();
      if (data.role === 'collegeadmin') {
        saveCredentials(email, password);
        localStorage.setItem('last_login_email', email);
        toast.success(`Welcome back, ${data.displayName || data.name || 'Admin'}!`);
        navigate('/collegeadmin/dashboard');
      } else {
        toast.error('Unauthorized. You are not a college admin.');
        await auth.signOut();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error verifying account: ' + (err.message || 'Unknown error'));
      await auth.signOut();
    }
  };

  /* ── Email login ── */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(cred.user);
    } catch (err) {
      const map = {
        'auth/user-not-found':         'No account found with this email. Please contact your Super Admin.',
        'auth/wrong-password':         'Incorrect password. Please try again.',
        'auth/invalid-email':          'Invalid email format.',
        'auth/user-disabled':          'This account has been disabled.',
        'auth/too-many-requests':      'Too many attempts. Try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      toast.error(map[err.code] || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google login ── */
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes caFadeInLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes caFadeInRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .ca-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── LEFT: dark, 50% ── */
        .ca-left {
          flex: 0 0 50%;
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 32px;
          background: #1a1a1c;
          animation: caFadeInLeft 0.55s ease both;
        }

        .ca-form-box {
          width: 100%;
          max-width: 360px;
        }

        /* ── RIGHT: indigo/blue gradient, 50% ── */
        .ca-right {
          flex: 0 0 50%;
          width: 50%;
          background: linear-gradient(145deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 70%, #1e3a8a 100%);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 64px 60px;
          position: relative;
          animation: caFadeInRight 0.55s ease both;
          overflow: hidden;
        }

        /* subtle dot overlay */
        .ca-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* decorative glow blob */
        .ca-right::after {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          top: -80px;
          right: -80px;
          pointer-events: none;
        }

        /* ── Back button ── */
        .ca-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 13px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-bottom: 40px;
          transition: color 0.2s;
          font-family: inherit;
        }
        .ca-back:hover { color: #ddd; }

        /* ── Welcome line ── */
        .ca-welcome {
          font-size: 13px;
          font-weight: 600;
          color: #4f83f1;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        /* ── Heading ── */
        .ca-heading {
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 10px;
          letter-spacing: -0.6px;
          line-height: 1.15;
        }
        .ca-sub {
          font-size: 14px;
          color: #777;
          margin-bottom: 36px;
        }

        /* ── Google button ── */
        .ca-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px 20px;
          background: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1c;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          margin-bottom: 22px;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .ca-google:hover:not(:disabled) {
          background: #f4f4f4;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .ca-google:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Divider ── */
        .ca-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .ca-divider-line { flex: 1; height: 1px; background: #2e2e30; }
        .ca-divider-text { color: #555; font-size: 12px; white-space: nowrap; }

        /* ── Input ── */
        .ca-input-wrap { position: relative; margin-bottom: 14px; }
        .ca-input {
          width: 100%;
          padding: 13px 16px;
          background: transparent;
          border: 1px solid #303032;
          border-radius: 10px;
          color: #cccccc;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .ca-input::placeholder { color: #484848; }
        .ca-input:focus { border-color: #4f83f1; }
        .ca-input-pw { padding-right: 44px; }

        .ca-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .ca-eye:hover { color: #4f83f1; }

        /* ── Submit ── */
        .ca-submit {
          width: 100%;
          padding: 14px;
          background: #1d4ed8;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.18s, transform 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }
        .ca-submit:hover:not(:disabled) {
          background: #1e40af;
          transform: translateY(-1px);
        }
        .ca-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Spinner ── */
        .ca-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* ── Terms ── */
        .ca-terms {
          margin-top: 20px;
          font-size: 12px;
          color: #555;
          line-height: 1.65;
        }
        .ca-terms a { color: #4f83f1; text-decoration: none; }
        .ca-terms a:hover { text-decoration: underline; }

        /* ── Right content ── */
        .ca-right-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 32px;
          max-width: 460px;
        }

        .ca-right-headline {
          font-size: 46px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .ca-right-quote {
          border-left: 3px solid rgba(255,255,255,0.35);
          padding-left: 20px;
        }
        .ca-right-quote-mark {
          font-size: 36px;
          line-height: 1;
          color: rgba(255,255,255,0.5);
          font-family: Georgia, serif;
          margin-bottom: 6px;
          display: block;
        }
        .ca-right-quote-text {
          font-size: 15px;
          color: rgba(255,255,255,0.82);
          line-height: 1.7;
          font-style: italic;
        }
        .ca-right-quote-author {
          margin-top: 12px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
        }

        /* Pill badge */
        .ca-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 18px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.3px;
          backdrop-filter: blur(6px);
        }

        /* ── Responsive ── */
        @media (max-width: 820px) {
          .ca-right { display: none !important; }
          .ca-left  { flex: 1; width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="ca-page">

        {/* ═══════════ LEFT PANEL ═══════════ */}
        <div className="ca-left">
          <div className="ca-form-box">

            {/* Back */}
            <button className="ca-back" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              Back to Home
            </button>

            {/* Welcome + Heading */}
            <p className="ca-welcome">Welcome back, College Admin 👋</p>
            <h1 className="ca-heading">Sign In to Your Portal</h1>
            <p className="ca-sub">
              Need access?{' '}
              <span style={{ color: '#4f83f1', fontWeight: 500 }}>Contact your Super Admin</span>
            </p>

            {/* Google */}
            <button
              id="ca-google-login-btn"
              className="ca-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="ca-divider">
              <div className="ca-divider-line" />
              <span className="ca-divider-text">Or</span>
              <div className="ca-divider-line" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailLogin}>
              {/* Email */}
              <div className="ca-input-wrap">
                <input
                  id="ca-email"
                  className="ca-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>

              {/* Password */}
              <div className="ca-input-wrap">
                <input
                  id="ca-password"
                  className="ca-input ca-input-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="ca-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Submit */}
              <button
                id="ca-login-submit"
                type="submit"
                className="ca-submit"
                disabled={loading}
              >
                {loading
                  ? <><div className="ca-spinner" /> Signing in…</>
                  : 'Sign In'}
              </button>
            </form>

            {/* Terms */}
            <p className="ca-terms">
              By signing in, you agree to UpDone Mark's{' '}
              <a href="/privacy">Privacy Policy</a> and{' '}
              <a href="/terms">Terms of Service</a>.
            </p>

          </div>{/* end .ca-form-box */}
        </div>

        {/* ═══════════ RIGHT PANEL (indigo/blue) ═══════════ */}
        <div className="ca-right">
          <div className="ca-right-inner">

            {/* Badge */}
            <span className="ca-badge">
             College Admin Portal
            </span>

            {/* Big headline */}
            <h2 className="ca-right-headline">
              Manage Your College with Confidence
            </h2>

            {/* Quote */}
            <div className="ca-right-quote">
              <span className="ca-right-quote-mark">"</span>
              <p className="ca-right-quote-text">
                UpDone Mark gives our college full visibility over attendance,
                coordinators, and events — all in one powerful dashboard.
              </p>
              <p className="ca-right-quote-author">— updone mark</p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
