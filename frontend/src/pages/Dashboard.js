// src/pages/Dashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Chat from '../components/chat/Chat';
import MoodTracker from '../components/dashboard/MoodTracker';
import { BreathingExercise, AnxietyActivities } from '../components/activities';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMOTION_META = {
  happy:'☀ Happy', sad:'💧 Sad', anxious:'⚡ Anxious',
  angry:'🔥 Angry', calm:'◈ Calm', neutral:'○ Neutral', lonely:'◉ Lonely',
};

const NAV = [
  { id:'home',       icon:'🏠', label:'Home' },
  { id:'chat',       icon:'💬', label:'Chat' },
  { id:'mood',       icon:'📊', label:'Mood Tracker' },
  { id:'activities', icon:'🧘', label:'Activities' },
  { id:'breathing',  icon:'🫁', label:'Breathing' },
  { id:'profile',    icon:'👤', label:'Profile' },
];

export default function Dashboard() {
  const [tab, setTab]                       = useState('home');
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const { user, logout, updateUser }        = useAuth();
  const { dark, toggle }                    = useTheme();
  const navigate                            = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Take care of yourself ');
    navigate('/');
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden', fontFamily:'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .nav-btn:hover { background:var(--accent-lt)!important; color:var(--accent)!important; }
        .nav-btn { transition:all .15s ease!important; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:10px}
        .fade-in { animation: fadeIn .3s ease both; }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{ width:220, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'24px 14px', flexShrink:0 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 8px', marginBottom:32 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>M</div>
          <div>
            <div style={{ fontFamily:'', fontSize:18, color:'var(--text)', lineHeight:1 }}>MindEase</div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>AI Wellness</div>
          </div>
        </div>

        {/* Nav label */}
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.08em', padding:'0 8px', marginBottom:8, textTransform:'uppercase' }}>Menu</div>

        {/* Nav items */}
        <nav style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
          {NAV.map(n => (
            <button key={n.id} className="nav-btn" onClick={()=>setTab(n.id)} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'11px 12px', borderRadius:12, border:'none', cursor:'pointer',
              background: tab===n.id ? 'var(--accent-lt)' : 'transparent',
              color: tab===n.id ? 'var(--accent)' : 'var(--text2)',
              fontWeight: tab===n.id ? 600 : 400, fontSize:14,
              borderLeft: tab===n.id ? '3px solid var(--accent)' : '3px solid transparent',
              textAlign:'left',
            }}>
              <span style={{ fontSize:18, width:22, textAlign:'center' }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <div style={{ padding:'10px 12px', borderRadius:12, background:'var(--bg3)', marginBottom:10 }}>
            <div style={{ fontSize:10, color:'var(--text3)', marginBottom:3, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em' }}>Current Mood</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>{EMOTION_META[currentEmotion] || '○ Neutral'}</div>
          </div>
          
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 4px', marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent-lt)', border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--accent)', fontSize:15, flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={toggle} style={{ flex:1, padding:'8px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:16 }}>
              {dark ? '☀' : '🌙'}
            </button>
            <button onClick={handleLogout} style={{ flex:2, padding:'8px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--danger)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflow:'hidden' }}>
          {tab==='home'       && <HomePage user={user} onNavigate={setTab}/>}
          {tab==='chat'       && <Chat onEmotionChange={setCurrentEmotion} onNavigate={setTab}/>}
          {tab==='mood'       && <MoodTracker/>}
          {tab==='activities' && <AnxietyActivities/>}
          {tab==='breathing'  && <BreathingPage/>}
          {tab==='profile'    && <ProfilePanel user={user} updateUser={updateUser}/>}
        </div>
      </main>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────
function HomePage({ user, onNavigate }) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tips = [
    "Taking 5 deep breaths can reduce cortisol levels significantly.",
    "Writing 3 things you're grateful for each day rewires your brain.",
    "Even a 10-minute walk can significantly improve your mood.",
    "Sleep and mental health are deeply connected — aim for 7-9 hours.",
    "Talking about your feelings, even to an AI, helps process emotions.",
  ];

  const quickActions = [
    { icon:'💬', title:'Open Chat',          desc:'Talk to your AI companion anytime, no judgment.',        tab:'chat',       accentColor:'#5F9D6E', bgColor:'#1E2D22', borderColor:'#334238', tagLabel:'AI Companion',    tagColor:'#8BCB8F', tagBg:'rgba(95,157,110,0.15)'  },
    { icon:'🫁', title:'Breathing Exercise', desc:'Calm your nervous system with box breathing.',           tab:'breathing',  accentColor:'#3b82f6', bgColor:'#1A2535', borderColor:'#1E3050', tagLabel:'5 min exercise',  tagColor:'#93c5fd', tagBg:'rgba(59,130,246,0.15)'  },
    { icon:'📊', title:'Track Your Mood',    desc:'Log and visualize your emotional patterns over time.',   tab:'mood',       accentColor:'#8b5cf6', bgColor:'#261E35', borderColor:'#33265A', tagLabel:'Insights',        tagColor:'#c4b5fd', tagBg:'rgba(139,92,246,0.15)'  },
    { icon:'🧘', title:'Anxiety Relief',     desc:'Evidence-based activities to ease anxiety fast.',        tab:'activities', accentColor:'#f59e0b', bgColor:'#2D2218', borderColor:'#4A3520', tagLabel:'CBT & mindfulness',tagColor:'#fcd34d', tagBg:'rgba(245,158,11,0.15)'  },
  ];

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'32px', animation:'fadeUp .5s ease both' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'DM Serif Display', fontSize:30, color:'var(--text)', marginBottom:6 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize:14, color:'var(--text3)' }}>How are you feeling today? Choose where you'd like to start.</p>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.tab)}
            style={{
              background: a.bgColor,
              border: `1px solid ${a.borderColor}`,
              borderRadius: 20,
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none'; }}
          >
            {/* Left accent bar */}
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: a.accentColor, borderRadius:'20px 0 0 20px' }}/>

            {/* Tag */}
            <div style={{ display:'inline-block', fontSize:10, padding:'3px 9px', borderRadius:50, fontWeight:600, marginBottom:12, background: a.tagBg, color: a.tagColor }}>
              {a.tagLabel}
            </div>

            {/* Icon */}
            <div style={{ width:48, height:48, borderRadius:14, background:`${a.accentColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>
              {a.icon}
            </div>

            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:5 }}>{a.title}</div>
            <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{a.desc}</div>

            {/* Arrow */}
            <span style={{ position:'absolute', top:22, right:20, fontSize:18, opacity:0.2, color:'var(--text)' }}>→</span>
          </button>
        ))}
      </div>

      {/* Daily Tip */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:'20px 22px', marginBottom:14, display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ width:38, height:38, borderRadius:11, background:'rgba(139,203,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, marginTop:1 }}>
          💡
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--accent)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:5 }}>Daily Tip</div>
          <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.7 }}>{tips[new Date().getDate() % tips.length]}</p>
        </div>
      </div>

      {/* Crisis bar */}
      <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', display:'inline-block', flexShrink:0 }}/>
          In crisis? Reach out immediately
        </span>
        <span style={{ fontSize:12, fontWeight:600, color:'#f87171' }}>iCall: 9152987821 · Vandrevala: 1860-2662-345</span>
      </div>
    </div>
  );
}

function BreathingPage() {
  return (
    <div style={{ overflowY:'auto', height:'100%', padding:'32px' }}>
      <h2 style={{ fontFamily:'DM Serif Display', fontSize:26, color:'var(--text)', marginBottom:4, textAlign:'center' }}>Guided Breathing</h2>
      <p style={{ fontSize:13, color:'var(--text2)', textAlign:'center', marginBottom:4 }}>Box breathing — reduces anxiety in minutes</p>
      <BreathingExercise/>
    </div>
  );
}

function ProfilePanel({ user, updateUser }) {
  const [emergencyContact, setEC] = useState(user?.emergencyContact || '');
  const [emergencyName, setEN]    = useState(user?.emergencyName || '');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/user/profile', { emergencyContact, emergencyName });
      updateUser(res.data.data.user);
      toast.success('Saved 💚');
    } catch { toast.error('Failed.'); }
    setSaving(false);
  };

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans', marginTop:6 };

  return (
    <div style={{ padding:'32px', overflowY:'auto', height:'100%', maxWidth:560 }}>
      <h2 style={{ fontFamily:'DM Serif Display', fontSize:26, color:'var(--text)', marginBottom:24 }}>Your Profile</h2>
      <div style={{ background:'var(--card)', borderRadius:18, padding:'24px', border:'1px solid var(--border)', marginBottom:16 }}>
        <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'var(--accent-lt)', border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'var(--accent)', fontWeight:700 }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontFamily:'DM Serif Display', fontSize:22, color:'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

        </div>
      </div>
      <div style={{ background:'var(--card)', borderRadius:18, padding:'24px', border:'1px solid var(--border)', marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:6 }}>🆘 Emergency Contact</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14, lineHeight:1.6 }}>Only notified for truly critical messages like "I want to end my life". Normal sadness never triggers this.</div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Name</label>
          <input style={inp} value={emergencyName} onChange={e=>setEN(e.target.value)} placeholder="Mom, Best Friend..."/>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Email</label>
          <input style={inp} value={emergencyContact} onChange={e=>setEC(e.target.value)} placeholder="email"/>
        </div>
        <button onClick={save} disabled={saving||!emergencyContact.trim()} style={{ padding:'11px 28px', borderRadius:50, border:'none', background:emergencyContact.trim()?'var(--accent)':'var(--border)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          {saving?'Saving...':'Save Contact'}
        </button>
        {user?.emergencyContact && <div style={{ marginTop:12, padding:'10px 14px', background:'var(--accent-lt)', borderRadius:10, fontSize:13, color:'var(--accent)' }}>✓ {user.emergencyName} ({user.emergencyContact})</div>}
      </div>
    </div>
  );
}
