import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
 
const panelStyle = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  fontFamily: 'DM Sans, sans-serif',
};
 
const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  background: 'var(--bg3)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'DM Sans',
  boxSizing: 'border-box',
};
 
// ── LEFT DECORATIVE PANEL (shared) ────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{ background: 'var(--accent)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
      {[{ s: 300, t: '10%', l: '-10%', o: .08 }, { s: 200, t: '50%', r: '-5%', o: .06 }, { s: 150, t: '75%', l: '20%', o: .05 }].map((c, i) => (
        <div key={i} style={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', background: '#fff', top: c.t, left: c.l, right: c.r, opacity: c.o }} />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌿</div>
        <span style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: '#fff' }}>MindEase</span>
      </div>
      <div style={{ zIndex: 1, animation: 'fadeUp .8s ease both' }}>
        <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 38, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
          It's okay<br /><em>to forget</em>
        </h2>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 15, lineHeight: 1.75, maxWidth: 340 }}>
          We'll help you get back to your wellness journey. Enter your email and we'll send you a secure reset link.
        </p>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', zIndex: 1 }}>
        Crisis helpline: iCall 9152987821
      </div>
    </div>
  );
}
 
// ── FORGOT PASSWORD PAGE ──────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success
  const [error, setError]     = useState('');
  const navigate              = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };
 
  return (
    <div style={panelStyle}>
      <LeftPanel />
      <div style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .6s ease both' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            ← Back to login
          </button>
 
          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>Forgot password?</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
            Enter your email and we'll send you a reset link.
          </p>
 
          {status === 'success' ? (
            <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>📬</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, marginBottom: 6 }}>Check your inbox</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
                We've sent a reset link to <strong>{email}</strong>. It expires in 1 hour.
              </div>
              <button onClick={() => navigate('/')} style={{ marginTop: 20, width: '100%', padding: '11px', borderRadius: 50, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: 'var(--danger-lt)', border: '1px solid var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
                  ⚠ {error}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '13px', borderRadius: 50, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? .7 : 1, transition: 'opacity .2s' }}
              >
                {status === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
 
// ── RESET PASSWORD PAGE ───────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | loading | success
  const [error, setError]       = useState('');
  const navigate                = useNavigate();
 
  // Get token from URL: /reset-password?token=abc123
  const token = new URLSearchParams(window.location.search).get('token');
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
 
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    if (!token)               { setError('Invalid reset link. Please request a new one.'); return; }
 
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      toast.success('Password reset! Please sign in 🌿');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };
 
  return (
    <div style={panelStyle}>
      <LeftPanel />
      <div style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .6s ease both' }}>
          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>Set new password</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
            Choose a strong password for your MindEase account.
          </p>
 
          {!token ? (
            <div style={{ background: 'var(--danger-lt)', border: '1px solid var(--danger)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--danger)' }}>
              ⚠ Invalid or missing reset link. Please{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>request a new one</span>.
            </div>
          ) : status === 'success' ? (
            <div style={{ background: 'var(--accent-lt)', border: '1px solid var(--accent)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Password updated!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>Redirecting you to login…</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: 'var(--danger-lt)', border: '1px solid var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
                  ⚠ {error}
                </div>
              )}
 
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
 
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  style={inputStyle}
                />
              </div>
 
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '13px', borderRadius: 50, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? .7 : 1, transition: 'opacity .2s' }}
              >
                {status === 'loading' ? 'Updating…' : 'Reset my password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}