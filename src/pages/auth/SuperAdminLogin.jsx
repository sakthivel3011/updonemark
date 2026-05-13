import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { validateSuperAdmin, setSuperAdminAuthenticated, isSuperAdminAuthenticated } from '../../utils/superAdminAuth';
import { auth } from '../../firebase/config';

/* ─── Component ──────────────────────────────────────────────────────── */
export default function SuperAdminLogin() {
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem('superadmin_credentials');
    return saved ? JSON.parse(saved).email : '';
  });
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuperAdminAuthenticated()) {
      navigate('/superadmin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (validateSuperAdmin(email, password)) {
      try {
        await auth.signOut();
      } catch (err) {
        console.log('No existing session to sign out');
      }
      setSuperAdminAuthenticated(true);
      localStorage.setItem('superadmin_credentials', JSON.stringify({ email, password }));
      localStorage.setItem('last_login_email', email);
      toast.success('Welcome back, Super Admin!');
      navigate('/superadmin/dashboard');
    } else {
      toast.error('Invalid credentials');
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
        @keyframes saFadeInLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes saFadeInRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .sa-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── LEFT: dark, 50% ── */
        .sa-left {
          flex: 0 0 50%;
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 32px;
          background: #1a1a1c;
          animation: saFadeInLeft 0.55s ease both;
        }

        .sa-form-box {
          width: 100%;
          max-width: 360px;
        }

        /* ── RIGHT: purple/violet gradient, 50% ── */
        .sa-right {
          flex: 0 0 50%;
          width: 50%;
          background: linear-gradient(145deg, #4c1d95 0%, #5b21b6 40%, #6d28d9 70%, #4c1d95 100%);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 64px 60px;
          position: relative;
          animation: saFadeInRight 0.55s ease both;
          overflow: hidden;
        }

        /* subtle dot overlay */
        .sa-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* decorative glow blob */
        .sa-right::after {
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
        .sa-back {
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
        .sa-back:hover { color: #ddd; }

        /* ── Welcome line ── */
        .sa-welcome {
          font-size: 13px;
          font-weight: 600;
          color: #a78bfa;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        /* ── Heading ── */
        .sa-heading {
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 10px;
          letter-spacing: -0.6px;
          line-height: 1.15;
        }
        .sa-sub {
          font-size: 14px;
          color: #777;
          margin-bottom: 36px;
        }

        /* ── Input ── */
        .sa-input-wrap { position: relative; margin-bottom: 14px; }
        .sa-input {
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
        .sa-input::placeholder { color: #484848; }
        .sa-input:focus { border-color: #a78bfa; }
        .sa-input-pw { padding-right: 44px; }

        .sa-eye {
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
        .sa-eye:hover { color: #a78bfa; }

        /* ── Submit ── */
        .sa-submit {
          width: 100%;
          padding: 14px;
          background: #5b21b6;
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
        .sa-submit:hover {
          background: #4c1d95;
          transform: translateY(-1px);
        }

        /* ── Spinner ── */
        .sa-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* ── Terms ── */
        .sa-terms {
          margin-top: 20px;
          font-size: 12px;
          color: #555;
          line-height: 1.65;
        }
        .sa-terms a { color: #a78bfa; text-decoration: none; }
        .sa-terms a:hover { text-decoration: underline; }

        /* ── Right content ── */
        .sa-right-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 32px;
          max-width: 460px;
        }

        .sa-right-headline {
          font-size: 46px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .sa-right-quote {
          border-left: 3px solid rgba(255,255,255,0.35);
          padding-left: 20px;
        }
        .sa-right-quote-mark {
          font-size: 36px;
          line-height: 1;
          color: rgba(255,255,255,0.5);
          font-family: Georgia, serif;
          margin-bottom: 6px;
          display: block;
        }
        .sa-right-quote-text {
          font-size: 15px;
          color: rgba(255,255,255,0.82);
          line-height: 1.7;
          font-style: italic;
        }
        .sa-right-quote-author {
          margin-top: 12px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
        }

        /* Pill badge */
        .sa-badge {
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

        /* restricted banner */
        .sa-restricted {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.3);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #a78bfa;
          letter-spacing: 0.3px;
          margin-bottom: 24px;
        }

        /* ── Responsive ── */
        @media (max-width: 820px) {
          .sa-right { display: none !important; }
          .sa-left  { flex: 1; width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="sa-page">

        {/* ═══════════ LEFT PANEL ═══════════ */}
        <div className="sa-left">
          <div className="sa-form-box">

            {/* Back */}
            <button className="sa-back" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              Back to Home
            </button>

            {/* Restricted notice */}
            <div className="sa-restricted">
               Restricted Access — Authorised Personnel Only
            </div>

            {/* Welcome + Heading */}
            <p className="sa-welcome">Welcome back, Super Admin 👋</p>
            <h1 className="sa-heading">Sign In to Your Portal</h1>
            <p className="sa-sub">
              Full system control. Handle with care.
            </p>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="sa-input-wrap">
                <input
                  id="sa-email"
                  className="sa-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>

              {/* Password */}
              <div className="sa-input-wrap">
                <input
                  id="sa-password"
                  className="sa-input sa-input-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="sa-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Submit */}
              <button
                id="sa-login-submit"
                type="submit"
                className="sa-submit"
              >
                Secure Sign In
              </button>
            </form>

            {/* Terms */}
            <p className="sa-terms">
              By signing in, you agree to UpDone Mark's{' '}
              <a href="/privacy">Privacy Policy</a> and{' '}
              <a href="/terms">Terms of Service</a>.
            </p>

          </div>{/* end .sa-form-box */}
        </div>

        {/* ═══════════ RIGHT PANEL (purple/violet) ═══════════ */}
        <div className="sa-right">
          <div className="sa-right-inner">

            {/* Badge */}
            <span className="sa-badge">
              Super Admin Portal
            </span>

            {/* Big headline */}
            <h2 className="sa-right-headline">
              Total Control. Full Visibility. Zero Compromise.
            </h2>

            {/* Quote */}
            <div className="sa-right-quote">
              <span className="sa-right-quote-mark">"</span>
              <p className="sa-right-quote-text">
                As Super Admin, you have complete oversight of all colleges,
                coordinators, and events — ensuring the platform runs flawlessly.
              </p>
              <p className="sa-right-quote-author">— UpDone Mark </p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
