// src/components/chat/Chat.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const EMOTION_META = {
  happy:   { icon:'☀',  label:'Happy',   color:'#f59e0b', bg:'#fef3c7' },
  sad:     { icon:'💧', label:'Sad',     color:'#3b82f6', bg:'#dbeafe' },
  anxious: { icon:'⚡', label:'Anxious', color:'#8b5cf6', bg:'#ede9fe' },
  angry:   { icon:'🔥', label:'Angry',   color:'#ef4444', bg:'#fee2e2' },
  calm:    { icon:'◈',  label:'Calm',    color:'#10b981', bg:'#d1fae5' },
  lonely:  { icon:'◉',  label:'Lonely',  color:'#6366f1', bg:'#e0e7ff' },
  neutral: { icon:'○',  label:'Neutral', color:'#6b7280', bg:'#f3f4f6' },
};

// Icons to auto-assign to activity strings from backend
const ACTIVITY_ICONS = ['🧘', '✍️', '🚶', '💬', '🫁', '🎵', '☕', '📖'];

const QUICK_REPLIES = [
  "I'm feeling anxious today",
  "I'm feeling really low",
  "I feel overwhelmed",
  "I just need to talk",
  "I'm stressed about work",
];

function MessageText({ content }) {
  const lines = content.split('\n\n').filter(l => l.trim());
  if (lines.length <= 1) return <p style={{ margin:0, lineHeight:1.75 }}>{content}</p>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {lines.map((line, i) => <p key={i} style={{ margin:0, lineHeight:1.75 }}>{line.trim()}</p>)}
    </div>
  );
}

function groupSessionsByDate(sessions) {
  const today=[], yesterday=[], older=[];
  sessions.forEach(s => {
    try {
      const d = parseISO(s.createdAt);
      if (isToday(d)) today.push(s);
      else if (isYesterday(d)) yesterday.push(s);
      else older.push(s);
    } catch { older.push(s); }
  });
  return { today, yesterday, older };
}

// ── FIX: ActivitySuggestions now handles plain strings from backend ──────────
// Backend sends: ["Take a 10-min walk", "Write down feelings", "Call a friend"]
// Old code expected objects with {icon, title, desc} — that's why nothing showed
function ActivitySuggestions({ activities, emotion, onNavigate }) {
  if (!activities || activities.length === 0) return null;
  const em = EMOTION_META[emotion] || EMOTION_META.neutral;

  return (
    <div style={{
      padding:'12px 16px',
      borderTop:'1px solid var(--border)',
      background:'var(--bg3)',
      flexShrink:0,
      animation:'fadeIn .3s ease both',
    }}>
      {/* Header row with emotion badge */}
      <div style={{
        fontSize:11, fontWeight:600, color:'var(--text3)',
        textTransform:'uppercase', letterSpacing:'0.06em',
        marginBottom:10, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
      }}>
        <span style={{
          padding:'3px 10px', borderRadius:50,
          background:em.bg, color:em.color,
          fontSize:12, fontWeight:700,
          display:'flex', alignItems:'center', gap:4,
        }}>
          {em.icon} {em.label}
        </span>
        <span>Suggested activities for you</span>
      </div>

      {/* Activity cards — renders plain strings correctly */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {activities.map((activity, i) => {
          // activity is a plain string e.g. "Take a 10-min walk alone"
          const activityText = typeof activity === 'string' ? activity : (activity.title || activity.desc || String(activity));
          const icon = ACTIVITY_ICONS[i % ACTIVITY_ICONS.length];
          const isBreathing = activityText.toLowerCase().includes('breath');

          return (
            <button
              key={i}
              onClick={() => isBreathing && onNavigate?.('breathing')}
              style={{
                flexShrink:0,
                background:'var(--card)',
                border:`1px solid var(--border)`,
                borderRadius:14,
                padding:'12px 14px',
                cursor: isBreathing ? 'pointer' : 'default',
                textAlign:'left',
                minWidth:150,
                maxWidth:200,
                transition:'all .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = em.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${em.bg}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.5, fontWeight:500 }}>
                {activityText}
              </div>
              {isBreathing && (
                <div style={{ fontSize:10, color:em.color, marginTop:5, fontWeight:600 }}>
                  Tap to open →
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Chat({ onEmotionChange, onNavigate }) {
  const { user }                              = useAuth();
  const [sessions, setSessions]               = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [mlAnalysis, setMlAnalysis]           = useState(null);
  const [fetching, setFetching]               = useState(true);
  const [historyOpen, setHistoryOpen]         = useState(true);

  // FIX: activities stored separately from mlAnalysis — persists during loading
  const [activities, setActivities]           = useState([]);
  const [currentEmotion, setCurrentEmotion]   = useState('neutral');

  const bottomRef = useRef();
  const inputRef  = useRef();

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data.data.sessions || []);
    } catch {}
  }, []);

  const loadActiveSession = useCallback(async () => {
    setFetching(true);
    setMessages([]);
    setMlAnalysis(null);
    setActivities([]);
    try {
      const res = await api.get('/chat/session');
      const s   = res.data.data.session;
      setActiveSessionId(s._id);
      setMessages(s.messages || []);
    } catch {
      setMessages([{
        role:'assistant',
        content:`Hi ${user?.name?.split(' ')[0] || 'there'} 🌿\n\nWelcome to MindEase.\n\nHow are you feeling today?`,
      }]);
    } finally { setFetching(false); }
  }, [user]);

  const loadPastSession = useCallback(async (sessionId) => {
    setFetching(true);
    setMlAnalysis(null);
    setActivities([]);
    try {
      const res = await api.get('/chat/sessions');
      const all = res.data.data.sessions || [];
      const found = all.find(s => s._id === sessionId);
      if (found) {
        setActiveSessionId(found._id);
        setMessages(found.messages || []);
      }
    } catch {}
    setFetching(false);
  }, []);

  useEffect(() => {
    loadSessions();
    loadActiveSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const startNewChat = useCallback(async () => {
    setFetching(true);
    setMessages([]);
    setMlAnalysis(null);
    setActivities([]);
    setInput('');
    setCurrentEmotion('neutral');
    try {
      if (activeSessionId) {
        await api.patch(`/chat/session/${activeSessionId}/end`).catch(()=>{});
      }
      const res = await api.get('/chat/session');
      const s   = res.data.data.session;
      setActiveSessionId(s._id);
      setMessages(s.messages || []);
      await loadSessions();
    } catch {
      setMessages([{
        role:'assistant',
        content:`Hi ${user?.name?.split(' ')[0]} 🌿\n\nNew session started.\n\nHow are you feeling today?`,
      }]);
    }
    setFetching(false);
  }, [activeSessionId, user, loadSessions]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role:'user', content:msg, _id:Date.now() }]);

    try {
      const res = await api.post('/chat/message', { message:msg, sessionId:activeSessionId });
      const { reply, mlAnalysis:ml, sessionId:sid, activities:acts } = res.data.data;
      //                                             ^^^^^^^^^^^^^^^ FIX: read correct field

      if (sid && !activeSessionId) setActiveSessionId(sid);
      setMessages(prev => [...prev, { role:'assistant', content:reply, _id:Date.now()+1 }]);
      setMlAnalysis(ml);

      // FIX: update emotion from ml.emotion (correct field)
      if (ml?.emotion) {
        setCurrentEmotion(ml.emotion);
        onEmotionChange?.(ml.emotion);
      }

      // FIX: read `activities` field (not ml.suggestions)
      // Backend sends: data.activities = ["string1", "string2", "string3"]
      if (acts && acts.length > 0) {
        setActivities(acts);
      } else if (ml?.suggestions?.length > 0) {
        // fallback: if backend still sends suggestions inside mlAnalysis
        setActivities(ml.suggestions);
      }

      await loadSessions();
    } catch {
      setMessages(prev => [...prev, {
        role:'assistant',
        content:`Something went wrong.\n\nPlease try again. 💚`,
        _id:Date.now()+1,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, activeSessionId, onEmotionChange, loadSessions]);

  const grouped = groupSessionsByDate(sessions);
  const em      = EMOTION_META[currentEmotion] || EMOTION_META.neutral;

  const getTitle = (s) => {
    const first = s.messages?.find(m => m.role==='user');
    if (first?.content) return first.content.slice(0,38) + (first.content.length > 38 ? '…' : '');
    try { return format(parseISO(s.createdAt), 'MMM d, h:mm a'); } catch { return 'Chat'; }
  };

  const SessionGroup = ({ label, items }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase', padding:'0 12px', marginBottom:6 }}>{label}</div>
        {items.map(s => (
          <button key={s._id} onClick={() => loadPastSession(s._id)} style={{
            width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:10,
            border:'none', cursor:'pointer', fontSize:13, marginBottom:2,
            background: s._id===activeSessionId ? 'var(--accent-lt)' : 'transparent',
            color:      s._id===activeSessionId ? 'var(--accent)' : 'var(--text2)',
            borderLeft: s._id===activeSessionId ? '2px solid var(--accent)' : '2px solid transparent',
            display:'flex', alignItems:'center', gap:8, transition:'all .15s',
          }}
            onMouseEnter={e=>{ if(s._id!==activeSessionId) e.currentTarget.style.background='var(--bg3)'; }}
            onMouseLeave={e=>{ if(s._id!==activeSessionId) e.currentTarget.style.background='transparent'; }}
          >
            <span style={{ fontSize:14, flexShrink:0 }}>💬</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{getTitle(s)}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

      {/* ── Session History Sidebar ─────────────────────────── */}
      {historyOpen && (
        <div style={{ width:240, borderRight:'1px solid var(--border)', background:'var(--bg2)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'14px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:10, padding:'0 4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Chat History</div>
            <button onClick={startNewChat} style={{
              width:'100%', padding:'10px 12px', borderRadius:12,
              border:'1px dashed var(--accent)', background:'var(--accent-lt)',
              color:'var(--accent)', cursor:'pointer', fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', gap:8, transition:'all .2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff';e.currentTarget.style.borderStyle='solid';}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--accent-lt)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.borderStyle='dashed';}}
            >
              <span style={{ fontSize:16 }}>✏</span>
              New Chat
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 8px' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px 16px', color:'var(--text3)', fontSize:12, lineHeight:1.7 }}>
                No previous chats yet.<br/>Start talking to build your history.
              </div>
            ) : (
              <>
                <SessionGroup label="Today"     items={grouped.today}/>
                <SessionGroup label="Yesterday" items={grouped.yesterday}/>
                <SessionGroup label="Older"     items={grouped.older}/>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main Chat Area ──────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <button onClick={()=>setHistoryOpen(o=>!o)} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)', flexShrink:0 }}>
            {historyOpen ? '◀' : '▶'}
          </button>
          <div style={{ width:30, height:30, borderRadius:9, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🌿</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>MindEase AI</div>
            <div style={{ fontSize:11, color:'var(--accent)', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }}/>
              Online · Here to listen
            </div>
          </div>

          {/* FIX: Live emotion badge — shows after first message, persists during loading */}
          {mlAnalysis && (
            <div style={{
              padding:'5px 12px', borderRadius:50,
              background:em.bg, fontSize:12, fontWeight:600,
              color:em.color, flexShrink:0,
              display:'flex', alignItems:'center', gap:5,
              transition:'all .3s ease',
            }}>
              <span>{em.icon}</span>
              <span>{em.label}</span>
              {mlAnalysis.confidence && (
                <span style={{ opacity:.7, fontSize:11 }}>
                  {(mlAnalysis.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}

          <button onClick={startNewChat} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <span>✏</span> New
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 20px', display:'flex', flexDirection:'column', gap:16, background:'var(--bg)' }}>
          {fetching ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, flexDirection:'column', gap:12, color:'var(--text3)' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌿</div>
              <span style={{ fontSize:13 }}>Loading...</span>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={m._id || i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start', gap:10, alignItems:'flex-end', animation:'fadeIn .3s ease both' }}>
                  {m.role==='assistant' && (
                    <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>🌿</div>
                  )}
                  <div style={{
                    maxWidth:'68%', padding:'13px 17px',
                    borderRadius: m.role==='user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    background:   m.role==='user' ? 'var(--accent)' : 'var(--card)',
                    color:        m.role==='user' ? '#fff' : 'var(--text)',
                    fontSize:14,
                    border:       m.role==='user' ? 'none' : '1px solid var(--border)',
                    boxShadow:    m.role==='user' ? '0 2px 12px rgba(74,124,89,0.2)' : 'var(--shadow)',
                  }}>
                    <MessageText content={m.content}/>
                  </div>
                  {m.role==='user' && (
                    <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent-lt)', border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'var(--accent)', fontWeight:700, flexShrink:0 }}>
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🌿</div>
                  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px 20px 20px 5px', padding:'14px 18px', display:'flex', gap:5, alignItems:'center' }}>
                    {[0,1,2].map(d => <span key={d} style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', display:'block', animation:`bounce 0.9s ${d*0.2}s infinite` }}/>)}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </>
          )}
        </div>

        {/* Quick replies — only on first message */}
        {!fetching && messages.length <= 1 && (
          <div style={{ padding:'8px 20px', display:'flex', gap:8, flexWrap:'wrap', background:'var(--bg)', flexShrink:0 }}>
            {QUICK_REPLIES.map((r,i) => (
              <button key={i} onClick={()=>sendMessage(r)} style={{ fontSize:12, padding:'7px 16px', borderRadius:50, background:'var(--card)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)';}}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* FIX: Activities panel
            - Always visible once activities exist (does NOT hide during loading)
            - Passes `activities` array (plain strings from backend)
            - Uses correct prop name `activities` not `suggestions`         */}
        {activities.length > 0 && (
          <ActivitySuggestions
            activities={activities}
            emotion={currentEmotion}
            onNavigate={onNavigate}
          />
        )}

        {/* Input */}
        <div style={{ padding:'12px 20px', background:'var(--bg2)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, padding:'10px 10px 10px 16px', transition:'border-color .2s' }}
            onFocusCapture={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onBlurCapture={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
              placeholder="Message MindEase... (Enter to send)"
              rows={1}
              style={{ flex:1, resize:'none', border:'none', background:'transparent', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'DM Sans', lineHeight:1.6, maxHeight:120, overflowY:'auto', padding:'2px 0' }}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{ width:38, height:38, borderRadius:10, border:'none', background: input.trim()&&!loading?'var(--accent)':'var(--border)', color:'#fff', fontSize:18, cursor: input.trim()&&!loading?'pointer':'default', flexShrink:0, transition:'background .2s', display:'flex', alignItems:'center', justifyContent:'center' }}>↑</button>
          </div>
          <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:8 }}>
            MindEase is an AI companion · Not a substitute for professional care
          </div>
        </div>
      </div>
    </div>
  );
}