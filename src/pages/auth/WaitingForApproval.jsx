import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Mail, GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function WaitingForApproval() {
  const { user, userRole, userStatus, loading: authLoading, collegeName, clubName, clearAuth } = useAuth();
  const navigate = useNavigate();
  const toastShown = useRef(false);
  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole !== 'coordinator') {
        navigate('/coordinator-login');
      } else if (userStatus === 'approved' && !toastShown.current) {
        toastShown.current = true;
        toast.success('Your account has been approved!');
        const timer = setTimeout(() => {
          navigate('/coordinator/dashboard');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, userRole, userStatus, authLoading, navigate]);

  const handleGoBack = () => {
    clearAuth();
    localStorage.removeItem('pendingCoordinator');
    navigate('/coordinator-login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1c]">
        <Loader2 className="animate-spin text-[#0b7a75]" size={40} />
      </div>
    );
  }

  const status = userStatus || 'pending';
  const displayEmail = user?.email || '';
  const displayCollege = collegeName || '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }

        .wa-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── LEFT: dark, 50% ── */
        .wa-left {
          flex: 0 0 50%;
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 32px;
          background: #1a1a1c;
          animation: fadeInLeft 0.55s ease both;
        }
        .wa-content-box {
          width: 100%;
          max-width: 400px;
        }

        /* ── RIGHT: teal gradient, 50% ── */
        .wa-right {
          flex: 0 0 50%;
          width: 50%;
          background: linear-gradient(145deg, #0b7a75 0%, #065e59 40%, #053d3a 100%);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 64px 60px;
          position: relative;
          animation: fadeInRight 0.55s ease both;
          overflow: hidden;
        }
        .wa-right::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none;
        }
        .wa-right::after {
          content: ''; position: absolute; width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
          top: -80px; right: -80px; pointer-events: none;
        }

        /* Back Button */
        .wa-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #666; font-size: 13px; cursor: pointer;
          background: none; border: none; padding: 0; margin-bottom: 32px;
          transition: color 0.2s; font-family: inherit;
        }
        .wa-back:hover { color: #ddd; }

        /* Status Icon */
        .wa-icon-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }
        .wa-icon-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .wa-icon-approved { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        /* Headings */
        .wa-welcome { font-size: 13px; font-weight: 600; color: #0d9488; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
        .wa-heading { font-size: 30px; font-weight: 800; color: #ffffff; margin-bottom: 12px; letter-spacing: -0.5px; line-height: 1.15; }
        .wa-sub { font-size: 14px; color: #777; margin-bottom: 32px; line-height: 1.5; }

        /* Details Box */
        .wa-details-box {
          background: #232325;
          border: 1px solid #303032;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .wa-detail-item {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 16px;
        }
        .wa-detail-item:last-child { margin-bottom: 0; }
        .wa-detail-icon {
          width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .wa-icon-email { background: rgba(11, 122, 117, 0.15); color: #0b7a75; }
        .wa-icon-college { background: rgba(13, 148, 136, 0.15); color: #0d9488; }
        .wa-icon-club { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .wa-icon-status-p { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .wa-icon-status-a { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .wa-detail-text h4 { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 2px; }
        .wa-detail-text p { font-size: 14px; font-weight: 600; color: #ddd; }
        
        .wa-status-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600;
        }
        .wa-badge-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .wa-badge-approved { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .wa-footer-text { font-size: 12px; color: #555; text-align: center; }

        /* Right Content */
        .wa-right-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 32px; max-width: 460px; }
        .wa-right-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 18px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 100px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); letter-spacing: 0.3px; backdrop-filter: blur(6px); }
        .wa-right-headline { font-size: 46px; font-weight: 800; color: #ffffff; line-height: 1.1; letter-spacing: -1px; }
        
        .wa-right-quote { border-left: 3px solid rgba(255,255,255,0.35); padding-left: 20px; }
        .wa-right-quote-mark { font-size: 36px; line-height: 1; color: rgba(255,255,255,0.5); font-family: Georgia, serif; margin-bottom: 6px; display: block; }
        .wa-right-quote-text { font-size: 15px; color: rgba(255,255,255,0.82); line-height: 1.7; font-style: italic; }
        .wa-right-quote-author { margin-top: 12px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.55); }

        @media (max-width: 820px) {
          .wa-right { display: none !important; }
          .wa-left { flex: 1; width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="wa-page">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="wa-left">
          <div className="wa-content-box">
            <button className="wa-back" onClick={handleGoBack}>
              <ArrowLeft size={14} /> Back to Login
            </button>

            <div className={`wa-icon-wrap ${status === 'pending' ? 'wa-icon-pending' : 'wa-icon-approved'}`}>
              {status === 'pending' ? <Clock size={40} /> : <CheckCircle2 size={40} />}
            </div>

            <p className="wa-welcome">Account Status</p>
            <h1 className="wa-heading">
              {status === 'pending' ? 'Waiting for Approval' : 'Account Approved!'}
            </h1>
            <p className="wa-sub">
              {status === 'pending' 
                ? 'Your registration request is under review by your college admin. Please wait for approval.'
                : 'Your account has been approved! Redirecting to dashboard...'}
            </p>

            <div className="wa-details-box">
              <div className="wa-detail-item">
                <div className="wa-detail-icon wa-icon-email"><Mail size={18} /></div>
                <div className="wa-detail-text">
                  <h4>Email</h4>
                  <p>{displayEmail}</p>
                </div>
              </div>

              <div className="wa-detail-item">
                <div className="wa-detail-icon wa-icon-college"><GraduationCap size={18} /></div>
                <div className="wa-detail-text">
                  <h4>College</h4>
                  <p>{displayCollege}</p>
                </div>
              </div>

              {clubName && (
                <div className="wa-detail-item">
                  <div className="wa-detail-icon wa-icon-club"><CheckCircle2 size={18} /></div>
                  <div className="wa-detail-text">
                    <h4>Assigned Club</h4>
                    <p>{clubName}</p>
                  </div>
                </div>
              )}

              <div className="wa-detail-item">
                <div className={`wa-detail-icon ${status === 'pending' ? 'wa-icon-status-p' : 'wa-icon-status-a'}`}>
                  {status === 'pending' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="wa-detail-text">
                  <h4>Status</h4>
                  <div className={`wa-status-badge ${status === 'pending' ? 'wa-badge-pending' : 'wa-badge-approved'}`}>
                    {status === 'pending' ? ' Pending Approval' : ' Approved'}
                  </div>
                </div>
              </div>
            </div>

            {status === 'pending' && (
              <p className="wa-footer-text">
                This page will automatically update when your status changes.
              </p>
            )}

          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="wa-right">
          <div className="wa-right-inner">
            <span className="wa-right-badge">Coordinator Portal</span>

            <h2 className="wa-right-headline">
              Your Application is Under Review
            </h2>

            <div className="wa-right-quote">
              <span className="wa-right-quote-mark">“</span>
              <p className="wa-right-quote-text">
                We're currently verifying your details with the college administration. 
                Once approved, you'll gain full access to coordinate and manage events seamlessly.
              </p>
              <p className="wa-right-quote-author">— updone mark</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

