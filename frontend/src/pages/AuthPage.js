// src/pages/AuthPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';


export default function AuthPage() {
  const [mode, setMode]       = useState('landing'); // landing | login | register
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Welcome back ');
      } else {
        await register(name, email, password);
        toast.success('Welcome to MindEase');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const features = [
    {  title: 'AI Therapy Chat',      desc: 'Talk freely with an empathetic AI companion, anytime.' },
    {  title: 'Emotion Detection',    desc: 'ML model understands your emotional state in real time.' },
    {  title: 'Mood Tracking',        desc: 'Visualize your emotional journey over days and weeks.' },
    {  title: 'Breathing Exercises',  desc: 'Guided box breathing to calm anxiety instantly.' },
    {  title: 'Anxiety Relief',       desc: 'Evidence-based CBT and mindfulness activities.' },
    {  title: 'Crisis Support',       desc: 'Emergency contact alerts for truly critical moments.' },
  ];

  // ── LANDING PAGE ──────────────────────────────────────────────────────
  if (mode === 'landing') {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'DM Sans, sans-serif' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes pulse-ring { 0%{transform:scale(1);opacity:.4} 100%{transform:scale(1.6);opacity:0} }
          .hero-btn:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(74,124,89,0.35)!important; }
          .hero-btn { transition:all .25s ease!important; }
          .sec-btn:hover { background:var(--accent-lt)!important; }
          .sec-btn { transition:all .2s ease!important; }
          .feat-card:hover { transform:translateY(-4px); border-color:var(--accent)!important; }
          .feat-card { transition:all .25s ease!important; }
        `}</style>

        {/* Navbar */}
        <nav style={{ padding:'18px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)', background:'var(--bg2)', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>M</div>
            <span style={{ fontFamily:'', fontSize:20, color:'var(--text)' }}>MindEase</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="sec-btn" onClick={() => setMode('login')} style={{ padding:'9px 22px', borderRadius:50, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:14, fontWeight:500 }}>
              Sign In
            </button>
            <button className="hero-btn" onClick={() => setMode('register')} style={{ padding:'9px 22px', borderRadius:50, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }}>
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth:1100, margin:'0 auto', padding:'80px 48px 60px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          {/* Left */}
          <div style={{ animation:'fadeUp .8s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:50, background:'var(--accent-lt)', border:'1px solid var(--border)', marginBottom:24, fontSize:13, color:'var(--accent)', fontWeight:500 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }}/>
              AI-Powered Mental Wellness
            </div>
            <h1 style={{ fontFamily:'', fontSize:52, lineHeight:1.15, color:'var(--text)', marginBottom:20 }}>
              Find Peace<br/>
              <span style={{ fontStyle:'italic', color:'var(--accent)' }}>of Mind</span>
            </h1>
            <p style={{ fontSize:17, color:'var(--text2)', lineHeight:1.75, marginBottom:36, maxWidth:460 }}>
              Experience a new way of emotional support. Our AI companion is here to listen, understand, and guide you through life's journey — without judgment, without pressure.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <button className="hero-btn" onClick={() => setMode('register')} style={{ padding:'14px 32px', borderRadius:50, border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 8px 24px rgba(74,124,89,0.25)' }}>
                Start Your Journey →
              </button>
              
            </div>
            {/* Trust badges */}
            <div style={{ display:'flex', gap:20, marginTop:36, flexWrap:'wrap' }}>
              
            </div>
          </div>
  
          {/* Right — floating visual */}
        {/* ── Humanised social proof panel — replaces circle animation ── */}
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 1.2s ease both' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>

    {/* Label */}
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
      Real people, real results
    </div>

    {/* Stat cards */}
    {[
      {  title: 'Feeling calmer',          sub: 'after just 1 week of daily check-ins' },
      {  title: 'Talked through anxiety',   sub: 'with an AI that actually listens',  stat: null  },
      {  title: 'Less anxious day by day',  sub: 'guided breathing & CBT exercises',  stat: null  },
    ].map((item, i) => (
      <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.sub}</div>
        </div>
        {item.stat && (
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{item.stat}</div>
        )}
      </div>
    ))}

    {/* Social proof footer strip */}
   
    

  </div>
</div>
        </section>

        {/* Features */}
        <section style={{ maxWidth:1100, margin:'0 auto', padding:'20px 48px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 style={{ fontFamily:'DM Serif Display', fontSize:36, color:'var(--text)', marginBottom:10 }}>Everything you need to feel better</h2>
            <p style={{ fontSize:15, color:'var(--text2)' }}>A complete mental wellness toolkit, powered by AI and ML</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {features.map((f,i) => (
              <div key={i} className="feat-card" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:'24px', cursor:'default' }}>
                
                <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background:'var(--accent)', margin:'0 48px 60px', borderRadius:24, padding:'48px', textAlign:'center', maxWidth:1004, marginLeft:'auto', marginRight:'auto' }}>
          <h2 style={{ fontFamily:'', fontSize:34, color:'#fff', marginBottom:12 }}>Ready to start your wellness journey?</h2>
          <p style={{ color:'rgba(255, 255, 255, 0.81)', fontSize:15, marginBottom:28 }}>Join thousands who are learning to understand themselves better</p>
          <button className="hero-btn" onClick={() => setMode('register')} style={{ padding:'14px 36px', borderRadius:50, border:'none', background:'#fff', color:'var(--accent)', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Get Started — It's Free
          </button>
        </section>

        {/* Footer */}
        <footer style={{ textAlign:'center', padding:'24px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text3)' }}>
          MindEase is an AI companion and does not replace professional mental health care.
          Crisis helpline: <strong>iCall 9152987821</strong> · Vandrevala: <strong>1860-2662-345</strong>
        </footer>
      </div>
    );
  }

  // ── AUTH FORM ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:'DM Sans,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      {/* Left panel — decorative */}
      <div style={{ background:'var(--accent)', padding:'48px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        {/* Background circles */}
        {[{s:300,t:'10%',l:'-10%',o:.08},{s:200,t:'50%',r:'-5%',o:.06},{s:150,t:'75%',l:'20%',o:.05}].map((c,i) => (
          <div key={i} style={{ position:'absolute', width:c.s, height:c.s, borderRadius:'50%', background:'#fff', top:c.t, left:c.l, right:c.r, opacity:c.o }}/>
        ))}

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, zIndex:1 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>M</div>
          <span style={{ fontFamily:'', fontSize:22, color:'#fff' }}>MindEase</span>
        </div>

        {/* Center content */}
        <div style={{ zIndex:1, animation:'fadeUp .8s ease both' }}>
          <h2 style={{ fontFamily:'DM Serif Display', fontSize:38, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
            Find Peace<br/><em>of Mind</em>
          </h2>
          <p style={{ color:'rgb(255, 255, 255)', fontSize:15, lineHeight:1.75, marginBottom:32, maxWidth:340 }}>
            Experience a new way of emotional support. Our AI companion is here to listen, understand, and guide you through life's journey.
          </p>
          {/* Testimonial */}
          <div style={{ background:'rgba(255,255,255,.12)', borderRadius:16, padding:'18px 20px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.2)' }}>
            <p style={{ color:'#fff', fontSize:13, lineHeight:1.65, marginBottom:10 }}>
              "MindEase helped me understand my anxiety better. The AI actually listens and responds like a real person."
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              
              <div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', zIndex:1 }}>
          Crisis helpline: iCall 9152987821
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px' }}>
        <div style={{ width:'100%', maxWidth:400, animation:'fadeUp .6s ease both' }}>
          {/* Back to landing */}
          <button onClick={() => { setMode('landing'); setError(''); }} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, marginBottom:28, display:'flex', alignItems:'center', gap:6, padding:0 }}>
            ← Back
          </button>

          <h2 style={{ fontFamily:'DM Serif Display', fontSize:28, color:'var(--text)', marginBottom:4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:28 }}>
            {mode === 'login' ? 'Sign in to continue your journey' : 'Start your wellness journey today'}
          </p>

          {/* Toggle */}
          <div style={{ display:'flex', background:'var(--bg3)', borderRadius:12, padding:4, marginBottom:24 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex:1, padding:'9px', border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:500, transition:'all .2s', background: mode===m ? 'var(--card)' : 'transparent', color: mode===m ? 'var(--text)' : 'var(--text2)', boxShadow: mode===m ? 'var(--shadow)' : 'none' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'var(--danger-lt)', border:'1px solid var(--danger)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--danger)', marginBottom:16 }}>
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Full Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans' }}/>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans' }}/>
            </div>
            <div style={{ marginBottom: mode==='register'?14:20 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPass(e.target.value)} placeholder="Min 8 characters" required style={{ width:'100%', padding:'11px 44px 11px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans' }}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text3)' }}>{showPass?'🙈':'👁'}</button>
              </div>
            </div>
            {mode === 'register' && (
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" required style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans' }}/>
              </div>
            )}
            {mode === 'login' && (
  <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 16 }}>
    <span
      onClick={() => navigate('/forgot-password')}
      style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
    >
      Forgot password?
    </span>
  </div>
)}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:50, border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', opacity:loading?.7:1, transition:'opacity .2s' }}>
              {loading ? '...' : mode==='login' ? 'Sign In to MindEase' : 'Create My Account'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:12, color:'var(--text3)', marginTop:20, lineHeight:1.6 }}>
            MindEase is not a substitute for professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
