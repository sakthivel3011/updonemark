import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { auth, db } from '../../firebase/config';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function CoordinatorSignup() {
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    collegeId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const q = query(collection(db, 'colleges'), where('isActive', '==', true));
        const snap = await getDocs(q);
        setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching colleges:', err);
        toast.error('Could not load colleges');
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const selectedCollege = colleges.find(c => c.id === formData.collegeId);

  const createPendingCoordinator = async (user, name) => {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);
    if (existing.exists()) {
      const d = existing.data();
      if (d.status === 'approved') {
        toast.success('You already have an approved account. Please login.');
        navigate('/coordinator-login');
        return false;
      }
      if (d.status === 'pending') {
        localStorage.setItem('pendingCoordinator', JSON.stringify({
          uid: user.uid, email: user.email,
          name: d.displayName || name, collegeName: d.collegeName, collegeId: d.collegeId,
        }));
        navigate('/coordinator/waiting-approval');
        return false;
      }
    }
    await setDoc(userDocRef, {
      uid: user.uid, email: user.email,
      displayName: name, name,
      role: 'coordinator',
      collegeId: formData.collegeId,
      collegeName: selectedCollege?.name || '',
      status: 'pending',
      createdAt: new Date(),
      approvedAt: null, approvedBy: null,
      clubId: null, clubName: null,
    });
    localStorage.setItem('pendingCoordinator', JSON.stringify({
      uid: user.uid, email: user.email,
      name, collegeName: selectedCollege?.name, collegeId: selectedCollege?.id,
    }));
    return true;
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!formData.collegeId) { toast.error('Please select your college'); return; }
    setStep(2);
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all fields'); return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(cred.user, { displayName: formData.name });
      const ok = await createPendingCoordinator(cred.user, formData.name);
      if (ok) {
        toast.success('Registration successful! Awaiting college admin approval.');
        navigate('/coordinator/waiting-approval');
      }
    } catch (err) {
      toast.error('Signup failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!formData.collegeId) {
      toast.error('Please select your college first'); return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email'); provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const ok = await createPendingCoordinator(user, user.displayName || user.email.split('@')[0]);
      if (ok) {
        toast.success('Registration successful! Awaiting college admin approval.');
        navigate('/coordinator/waiting-approval');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google sign-up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes csFadeL { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:translateX(0); } }
        @keyframes csFadeR { from { opacity:0; transform:translateX(28px); } to { opacity:1; transform:translateX(0); } }
        @keyframes csSlideIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }

        .cs-page { display:flex; min-height:100vh; max-height:100vh; overflow:hidden; font-family:'Inter',sans-serif; }

        /* LEFT */
        .cs-left {
          flex: 0 0 50%; width:50%;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:48px 32px; background:#1a1a1c;
          animation: csFadeL 0.55s ease both;
          overflow:hidden;
          max-height:100vh;
        }
        .cs-form-box { width:100%; max-width:380px; }

        /* RIGHT — violet/indigo */
        .cs-right {
          flex: 0 0 50%; width:50%;
          background: linear-gradient(145deg, #1e1b4b 0%, #2e27a0 40%, #4f46e5 70%, #1e1b4b 100%);
          display:flex; flex-direction:column; align-items:flex-start; justify-content:center;
          padding:64px 60px; position:relative;
          animation: csFadeR 0.55s ease both; overflow:hidden;
        }
        .cs-right::before {
          content:''; position:absolute; inset:0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size:28px 28px; pointer-events:none;
        }
        .cs-right::after {
          content:''; position:absolute; width:420px; height:420px;
          background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
          top:-80px; right:-80px; pointer-events:none;
        }

        /* Stepper */
        .cs-stepper { display:flex; align-items:center; gap:0; margin-bottom:32px; }
        .cs-step-item { display:flex; align-items:center; gap:8px; }
        .cs-step-dot {
          width:28px; height:28px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:700; transition:all 0.3s;
        }
        .cs-step-dot.active  { background:#4f46e5; color:#fff; }
        .cs-step-dot.done    { background:#4f46e5; color:#fff; }
        .cs-step-dot.pending { background:#2a2a2c; color:#555; border:1.5px solid #333; }
        .cs-step-label { font-size:12px; font-weight:600; color:#777; }
        .cs-step-label.active { color:#818cf8; }
        .cs-step-line { width:36px; height:1px; background:#2e2e30; margin:0 8px; }

        /* Back btn */
        .cs-back {
          display:inline-flex; align-items:center; gap:6px;
          color:#666; font-size:13px; cursor:pointer;
          background:none; border:none; padding:0; margin-bottom:32px;
          transition:color 0.2s; font-family:inherit;
        }
        .cs-back:hover { color:#ddd; }

        /* Welcome */
        .cs-welcome { font-size:13px; font-weight:600; color:#818cf8; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:4px; }
        .cs-heading { font-size:30px; font-weight:800; color:#fff; margin-bottom:8px; letter-spacing:-0.5px; line-height:1.15; }
        .cs-sub { font-size:14px; color:#777; margin-bottom:28px; }
        .cs-sub a { color:#818cf8; font-weight:500; text-decoration:none; }
        .cs-sub a:hover { text-decoration:underline; }

        /* College card grid */
        .cs-college-grid { display:flex; flex-direction:column; gap:10px; max-height:280px; overflow:hidden; margin-bottom:22px; }
        .cs-college-card {
          display:flex; align-items:center; gap:14px;
          padding:14px 16px; border-radius:10px;
          border:1.5px solid #2e2e30; cursor:pointer;
          background:transparent; transition:all 0.18s; font-family:inherit; text-align:left;
        }
        .cs-college-card:hover { border-color:#4f46e5; background:rgba(79,70,229,0.06); }
        .cs-college-card.selected { border-color:#4f46e5; background:rgba(79,70,229,0.12); }
        .cs-college-icon {
          width:36px; height:36px; border-radius:8px;
          background:rgba(79,70,229,0.15); display:flex; align-items:center; justify-content:center;
          font-size:18px; flex-shrink:0;
        }
        .cs-college-name { font-size:14px; font-weight:600; color:#ddd; }
        .cs-college-city { font-size:12px; color:#666; margin-top:2px; }
        .cs-college-check { margin-left:auto; width:18px; height:18px; border-radius:50%; border:2px solid #2e2e30; flex-shrink:0; transition:all 0.18s; }
        .cs-college-card.selected .cs-college-check { background:#4f46e5; border-color:#4f46e5; display:flex; align-items:center; justify-content:center; }
        .cs-college-empty { font-size:14px; color:#555; text-align:center; padding:20px 0; }

        /* Input */
        .cs-input-wrap { position:relative; margin-bottom:14px; }
        .cs-input {
          width:100%; padding:13px 16px;
          background:transparent; border:1px solid #303032; border-radius:10px;
          color:#ccc; font-size:14px; outline:none;
          transition:border-color 0.2s; font-family:inherit;
        }
        .cs-input::placeholder { color:#484848; }
        .cs-input:focus { border-color:#4f46e5; }
        .cs-input-pw { padding-right:44px; }
        .cs-eye {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:#555; cursor:pointer; display:flex; align-items:center; padding:0;
        }
        .cs-eye:hover { color:#4f46e5; }

        /* Google btn */
        .cs-google {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; padding:13px 20px; background:#fff; border:none; border-radius:10px;
          font-size:14px; font-weight:600; color:#1a1a1c; cursor:pointer;
          transition:background 0.18s, transform 0.12s, box-shadow 0.18s;
          margin-bottom:18px; font-family:inherit; box-shadow:0 2px 8px rgba(0,0,0,0.08);
        }
        .cs-google:hover:not(:disabled) { background:#f4f4f4; transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,0.12); }
        .cs-google:disabled { opacity:0.6; cursor:not-allowed; }

        /* Divider */
        .cs-divider { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .cs-divider-line { flex:1; height:1px; background:#2e2e30; }
        .cs-divider-text { color:#555; font-size:12px; white-space:nowrap; }

        /* Submit */
        .cs-submit {
          width:100%; padding:14px; background:#4f46e5; border:none; border-radius:10px;
          color:#fff; font-size:15px; font-weight:700; cursor:pointer; margin-top:4px;
          transition:background 0.18s, transform 0.12s;
          display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit;
        }
        .cs-submit:hover:not(:disabled) { background:#3730a3; transform:translateY(-1px); }
        .cs-submit:disabled { opacity:0.6; cursor:not-allowed; }

        /* Spinner */
        .cs-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }

        /* Terms */
        .cs-terms { margin-top:18px; font-size:12px; color:#555; line-height:1.65; }
        .cs-terms a { color:#818cf8; text-decoration:none; }
        .cs-terms a:hover { text-decoration:underline; }

        /* Step animation */
        .cs-step-content { animation: csSlideIn 0.3s ease both; }

        /* Right panel */
        .cs-right-inner { position:relative; z-index:1; display:flex; flex-direction:column; align-items:flex-start; gap:32px; max-width:460px; }
        .cs-badge { display:inline-flex; align-items:center; gap:6px; padding:7px 18px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:100px; font-size:12px; font-weight:600; color:rgba(255,255,255,0.85); letter-spacing:0.3px; backdrop-filter:blur(6px); }
        .cs-headline { font-size:44px; font-weight:800; color:#fff; line-height:1.1; letter-spacing:-1px; }
        .cs-steps-list { display:flex; flex-direction:column; gap:16px; }
        .cs-steps-list-item { display:flex; align-items:flex-start; gap:14px; }
        .cs-steps-num { width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; margin-top:2px; }
        .cs-steps-text h4 { font-size:14px; font-weight:700; color:#fff; margin-bottom:3px; }
        .cs-steps-text p { font-size:13px; color:rgba(255,255,255,0.6); line-height:1.5; }
        .cs-quote { border-left:3px solid rgba(255,255,255,0.35); padding-left:20px; }
        .cs-quote-mark { font-size:36px; line-height:1; color:rgba(255,255,255,0.5); font-family:Georgia,serif; margin-bottom:6px; display:block; }
        .cs-quote-text { font-size:15px; color:rgba(255,255,255,0.82); line-height:1.7; font-style:italic; }
        .cs-quote-author { margin-top:12px; font-size:13px; font-weight:600; color:rgba(255,255,255,0.55); }

        @media (max-width: 820px) {
          .cs-right { display:none !important; }
          .cs-left { flex:1; width:100%; padding:36px 24px; }
        }
      `}</style>

      <div className="cs-page">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="cs-left">
          <div className="cs-form-box">

            {/* Back */}
            <button className="cs-back" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
              <ArrowLeft size={14} />
              {step === 2 ? 'Back to College Selection' : 'Back to Home'}
            </button>

            {/* Stepper */}
            <div className="cs-stepper">
              <div className="cs-step-item">
                <div className={`cs-step-dot ${step === 1 ? 'active' : 'done'}`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className={`cs-step-label ${step === 1 ? 'active' : ''}`}>Select College</span>
              </div>
              <div className="cs-step-line" />
              <div className="cs-step-item">
                <div className={`cs-step-dot ${step === 2 ? 'active' : 'pending'}`}>2</div>
                <span className={`cs-step-label ${step === 2 ? 'active' : ''}`}>Your Account</span>
              </div>
            </div>

            {/* Welcome */}
            <p className="cs-welcome">Create Account 👋</p>
            <h1 className="cs-heading">
              {step === 1 ? 'Select Your College' : 'Account Details'}
            </h1>
            <p className="cs-sub">
              {step === 1
                ? 'Choose the college you coordinate for'
                : <>Already have an account? <Link to="/coordinator-login">Sign In</Link></>
              }
            </p>

            {/* ── STEP 1: College Selection ── */}
            {step === 1 && (
              <div className="cs-step-content">
                <form onSubmit={handleStep1Next}>
                  <div className="cs-college-grid">
                    {collegesLoading
                      ? <p className="cs-college-empty">Loading colleges…</p>
                      : colleges.length === 0
                        ? <p className="cs-college-empty">No colleges available. Contact your Super Admin.</p>
                        : colleges.map(col => (
                          <button
                            key={col.id}
                            type="button"
                            className={`cs-college-card ${formData.collegeId === col.id ? 'selected' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, collegeId: col.id }))}
                          >

                            <div>
                              <div className="cs-college-name">{col.name}</div>
                              {col.city && <div className="cs-college-city">{col.city}</div>}
                            </div>
                            <div className="cs-college-check">
                              {formData.collegeId === col.id && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))
                    }
                  </div>
                  <button type="submit" className="cs-submit" disabled={!formData.collegeId || collegesLoading}>
                    Continue <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 2: Account Details ── */}
            {step === 2 && (
              <div className="cs-step-content">
                {/* Selected college pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 8, fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 20 }}>
                  {selectedCollege?.name}
                </div>

                {/* Google signup */}
                <button className="cs-google" onClick={handleGoogleSignup} disabled={loading} type="button">
                  <GoogleIcon />
                  Sign up with Google
                </button>

                <div className="cs-divider">
                  <div className="cs-divider-line" />
                  <span className="cs-divider-text">Or</span>
                  <div className="cs-divider-line" />
                </div>

                <form onSubmit={handleEmailSignup}>
                  {/* Full Name */}
                  <div className="cs-input-wrap">
                    <input id="cs-name" className="cs-input" type="text" value={formData.name}
                      onChange={set('name')} placeholder="Full name" required />
                  </div>

                  {/* Email */}
                  <div className="cs-input-wrap">
                    <input id="cs-email" className="cs-input" type="email" value={formData.email}
                      onChange={set('email')} placeholder="Email address" required />
                  </div>

                  {/* Password */}
                  <div className="cs-input-wrap">
                    <input id="cs-password" className="cs-input cs-input-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={set('password')}
                      placeholder="Password (min 6 chars)" required minLength={6} />
                    <button type="button" className="cs-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <button id="cs-register-submit" type="submit" className="cs-submit" disabled={loading}>
                    {loading ? <><div className="cs-spinner" /> Creating account…</> : 'Create Account'}
                  </button>
                </form>

                <p className="cs-terms">
                  By registering, you agree to UpDone Mark's{' '}
                  <a href="/privacy">Privacy Policy</a> and{' '}
                  <a href="/terms">Terms of Service</a>.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ═══ RIGHT PANEL (teal) ═══ */}
        <div className="cs-right">
          <div className="cs-right-inner">
            <span className="cs-badge">Coordinator Portal</span>

            <h2 className="cs-headline">
              Join Your College's Coordination Team
            </h2>

            <div className="cs-steps-list">
              <div className="cs-steps-list-item">
                <div className="cs-steps-num">1</div>
                <div className="cs-steps-text">
                  <h4>Select Your College</h4>
                  <p>Choose the institution you're registering under.</p>
                </div>
              </div>
              <div className="cs-steps-list-item">
                <div className="cs-steps-num">2</div>
                <div className="cs-steps-text">
                  <h4>Create Your Account</h4>
                  <p>Sign up with email or Google — quick and secure.</p>
                </div>
              </div>
              <div className="cs-steps-list-item">
                <div className="cs-steps-num">3</div>
                <div className="cs-steps-text">
                  <h4>Await Approval</h4>
                  <p>Your college admin reviews and activates your account.</p>
                </div>
              </div>
            </div>

            <div className="cs-quote">
              <span className="cs-quote-mark">"</span>
              <p className="cs-quote-text">
                UpDone Mark has completely transformed how we manage events. It's reliable,
                efficient, and ensures attendance is always tracked perfectly.
              </p>
              <p className="cs-quote-author">— updone mark</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
