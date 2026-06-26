// src/components/dashboard/MoodTracker.js
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../utils/api';
import { format, parseISO } from 'date-fns';

const EMOTION_COLOR = {
  happy:   '#f59e0b',
  sad:     '#3b82f6',
  anxious: '#8b5cf6',
  angry:   '#ef4444',
  calm:    '#10b981',
  neutral: '#6b7280',
  lonely:  '#6366f1',
  fear:    '#7c3aed',
  disgust: '#065f46',
  surprise:'#0891b2',
};

const EMOTION_ICON = {
  happy:'☀', sad:'💧', anxious:'⚡', angry:'🔥',
  calm:'◈', neutral:'○', lonely:'◉', fear:'◉', surprise:'★',
};

// Score per emotion (for Y axis positioning)
const EMOTION_SCORE = {
  happy:9, calm:8, surprise:7, neutral:5,
  lonely:4, fear:3, anxious:3, sad:2, angry:1, disgust:1,
};

// ── Custom dot with emotion icon label ───────────────────────────────────
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || !cx || !cy) return null;
  const color  = EMOTION_COLOR[payload.emotion] || '#6b7280';
  const icon   = EMOTION_ICON[payload.emotion]  || '○';
  return (
    <g>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={10} fill={`${color}22`} stroke={color} strokeWidth={1.5}/>
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={4}  fill={color}/>
      {/* Emotion label above dot */}
      <text
        x={cx} y={cy - 16}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={color}
        style={{ textTransform:'capitalize' }}
      >
        {icon} {payload.emotion}
      </text>
      {/* Score label below dot */}
      <text
        x={cx} y={cy + 20}
        textAnchor="middle"
        fontSize={9}
        fill="#9ca3af"
      >
        {payload.score}/10
      </text>
    </g>
  );
};

// ── Custom tooltip ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const color = EMOTION_COLOR[d?.emotion] || '#6b7280';
  return (
    <div style={{
      background:'var(--card)', border:`1px solid ${color}`,
      borderRadius:12, padding:'10px 14px', fontSize:12,
      boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontWeight:600, color, marginBottom:4, textTransform:'capitalize' }}>
        {EMOTION_ICON[d?.emotion]} {d?.emotion}
      </div>
      <div style={{ color:'var(--text2)' }}>Score: <strong style={{ color:'var(--text)' }}>{d?.score}/10</strong></div>
      <div style={{ color:'var(--text2)' }}>Date: <strong style={{ color:'var(--text)' }}>{label}</strong></div>
      {d?.time && <div style={{ color:'var(--text3)', marginTop:2 }}>{d.time}</div>}
    </div>
  );
};

// ── Custom Y axis tick with emotion label ─────────────────────────────────
const CustomYTick = ({ x, y, payload }) => {
  const score    = payload.value;
  const emotion  = Object.entries(EMOTION_SCORE).find(([,v]) => v === score)?.[0];
  const color    = emotion ? EMOTION_COLOR[emotion] : '#9ca3af';
  const icon     = emotion ? EMOTION_ICON[emotion]  : '';
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-4} y={4} textAnchor="end" fontSize={10} fill={color}>
        {icon} {score}
      </text>
    </g>
  );
};

export default function MoodTracker() {
  const [history, setHistory]     = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange]         = useState(7);
  const [loading, setLoading]     = useState(true);
  const [manualEmotion, setManualEmotion] = useState('neutral');
  const [manualNote, setManualNote]       = useState('');
  const [manualScore, setManualScore]     = useState(5);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [h, a] = await Promise.all([
        api.get(`/mood/history?days=${range}`),
        api.get(`/mood/analytics?days=${range}`),
      ]);
      setHistory(h.data.data.entries || []);
      setAnalytics(a.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [range]);

  const logManualMood = async () => {
    try {
      await api.post('/mood', {
        emotion: manualEmotion,
        score:   manualScore,
        note:    manualNote,
        source:  'manual',
      });
      setManualNote('');
      toast('Mood logged ✓');
      fetchData();
    } catch {}
  };

  const toast = (msg) => {
    const t = document.createElement('div');
    t.innerText = msg;
    Object.assign(t.style, {
      position:'fixed', bottom:'24px', right:'24px',
      background:'var(--accent)', color:'#fff',
      padding:'10px 18px', borderRadius:'50px',
      fontSize:'13px', fontWeight:'500',
      zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.2)',
      animation:'fadeIn .3s ease',
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  // Build chart data from history
  const chartData = [...history].reverse().map(e => ({
    date:    format(parseISO(e.date), 'MMM d'),
    time:    format(parseISO(e.date), 'h:mm a'),
    score:   EMOTION_SCORE[e.emotion] || 5,
    emotion: e.emotion,
  }));

  // Pie data
  const pieData = analytics
    ? Object.entries(analytics.emotionFrequency || {}).map(([k,v]) => ({
        name: k, value: v, color: EMOTION_COLOR[k] || '#999',
      }))
    : [];

  const dominantEm = analytics?.dominantEmotion || 'neutral';

  return (
    <div style={{ padding:'24px', overflowY:'auto', height:'100%', fontFamily:'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:'DM Serif Display', fontSize:24, color:'var(--text)', marginBottom:2 }}>Mood Tracker</h2>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Your emotional journey over time</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setRange(d)} style={{
              padding:'6px 16px', borderRadius:50, border:'1px solid var(--border)',
              cursor:'pointer', fontSize:13, fontWeight:500, transition:'all .2s',
              background: range===d ? 'var(--accent)' : 'var(--bg3)',
              color:       range===d ? '#fff'          : 'var(--text2)',
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {analytics && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            //{ label:'Total Entries',   value: analytics.totalEntries },
            { label:'Dominant Mood',   value: `${EMOTION_ICON[dominantEm]||'○'} ${dominantEm}`, color: EMOTION_COLOR[dominantEm] },
           // { label:'Avg Sentiment',   value: analytics.averageSentiment > 0 ? '🙂 Positive' : analytics.averageSentiment < 0 ? '🙁 Negative' : '😐 Neutral' },
           // { label:'Crisis Flags',    value: analytics.crisisCount > 0 ? `⚠ ${analytics.crisisCount}` : '✓ Clear', color: analytics.crisisCount > 0 ? 'var(--danger)' : 'var(--accent)' },
          ].map((c,i) => (
            <div key={i} style={{ background:'var(--bg3)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border)', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color: c.color || 'var(--accent)', marginBottom:2, textTransform:'capitalize' }}>{c.value}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main chart */}
      <div style={{ background:'var(--card)', borderRadius:18, padding:'20px', border:'1px solid var(--border)', marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:4 }}>Mood Over Time</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Each dot shows the emotion detected — hover for details</div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top:30, right:20, left:10, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis
                dataKey="date"
                tick={{ fontSize:11, fill:'var(--text3)', fontFamily:'DM Sans' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={<CustomYTick/>}
                axisLine={false} tickLine={false}
                width={52}
                ticks={[1,2,3,4,5,6,7,8,9]}
              />
              <Tooltip content={<CustomTooltip/>}/>
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="0"
                dot={<CustomDot/>}
                activeDot={{ r:8, fill:'var(--accent)', stroke:'var(--card)', strokeWidth:2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)', fontSize:14 }}>
            No mood data yet — start chatting to track your mood!
          </div>
        )}

        {/* Emotion legend */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
          {Object.entries(EMOTION_COLOR).slice(0,7).map(([em, clr]) => (
            <div key={em} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text2)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:clr, flexShrink:0 }}/>
              <span style={{ textTransform:'capitalize' }}>{em} ({EMOTION_SCORE[em]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row — Pie + Manual log */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Pie chart */}
        <div style={{ background:'var(--card)', borderRadius:18, padding:'20px', border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:14 }}>Emotion Breakdown</div>
          {pieData.length > 0 ? (
            <>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <PieChart width={160} height={140}>
                  <Pie data={pieData} cx={75} cy={65} innerRadius={36} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                {pieData.sort((a,b)=>b.value-a.value).slice(0,5).map((e,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:e.color, flexShrink:0 }}/>
                    <span style={{ flex:1, color:'var(--text)', textTransform:'capitalize' }}>
                      {EMOTION_ICON[e.name]} {e.name}
                    </span>
                    <span style={{ color:'var(--text3)', fontWeight:600 }}>{e.value}x</span>
                    <div style={{ width:50, height:4, borderRadius:2, background:'var(--border)', overflow:'hidden' }}>
                      <div style={{ width:`${Math.min((e.value / Math.max(...pieData.map(d=>d.value)))*100,100)}%`, height:'100%', background:e.color }}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, paddingTop:40 }}>No data yet</div>
          )}
        </div>

        {/* Manual mood log */}
        <div style={{ background:'var(--card)', borderRadius:18, padding:'20px', border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:14 }}>Log Mood Manually</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {Object.entries(EMOTION_COLOR).slice(0,6).map(([em, clr]) => (
              <button key={em} onClick={()=>setManualEmotion(em)} style={{
                padding:'5px 12px', borderRadius:50, cursor:'pointer', fontSize:12,
                border:`2px solid ${manualEmotion===em ? clr : 'var(--border)'}`,
                background: manualEmotion===em ? `${clr}18` : 'var(--bg3)',
                color: manualEmotion===em ? clr : 'var(--text2)',
                fontWeight: manualEmotion===em ? 600 : 400,
                textTransform:'capitalize', transition:'all .15s',
              }}>
                {EMOTION_ICON[em]} {em}
              </button>
            ))}
          </div>

          <input
            value={manualNote}
            onChange={e=>setManualNote(e.target.value)}
            placeholder="Optional note about your mood..."
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'DM Sans', marginBottom:10 }}
          />

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:12, color:'var(--text2)', flexShrink:0 }}>Intensity: {manualScore}/10</span>
            <input
              type="range" min={1} max={10} step={1} value={manualScore}
              onChange={e=>setManualScore(+e.target.value)}
              style={{ flex:1, accentColor: EMOTION_COLOR[manualEmotion] || 'var(--accent)' }}
            />
          </div>

          {/* Selected mood preview */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:`${EMOTION_COLOR[manualEmotion]}15`, border:`1px solid ${EMOTION_COLOR[manualEmotion]}40`, marginBottom:12 }}>
            <span style={{ fontSize:18 }}>{EMOTION_ICON[manualEmotion]}</span>
            <span style={{ fontSize:13, fontWeight:600, color: EMOTION_COLOR[manualEmotion], textTransform:'capitalize' }}>
              {manualEmotion} — {manualScore}/10
            </span>
          </div>

          <button onClick={logManualMood} style={{
            width:'100%', padding:'10px', borderRadius:50, border:'none',
            background:'var(--accent)', color:'#fff', fontSize:14,
            fontWeight:600, cursor:'pointer',
          }}>
            Log This Mood
          </button>
        </div>
      </div>

      {/* Recent log table */}
      {history.length > 0 && (
        <div style={{ background:'var(--card)', borderRadius:18, padding:'20px', border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:14 }}>Recent Entries</div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {history.slice(0, 8).map((e, i) => {
              const clr = EMOTION_COLOR[e.emotion] || '#6b7280';
              const score = EMOTION_SCORE[e.emotion] || 5;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(history.length,8)-1 ? '1px solid var(--border)' : 'none' }}>
                  {/* Emotion badge */}
                  <div style={{ width:36, height:36, borderRadius:10, background:`${clr}18`, border:`1.5px solid ${clr}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {EMOTION_ICON[e.emotion]}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:clr, textTransform:'capitalize' }}>{e.emotion}</div>
                    {e.note && <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{e.note}</div>}
                  </div>
                  {/* Score bar */}
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:60, height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
                      <div style={{ width:`${score*10}%`, height:'100%', background:clr, borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, color:'var(--text3)', minWidth:28, textAlign:'right' }}>{score}/10</span>
                  </div>
                  {/* Time */}
                  <div style={{ fontSize:11, color:'var(--text3)', minWidth:70, textAlign:'right' }}>
                    {e.date ? format(parseISO(e.date), 'MMM d, h:mm a') : ''}
                  </div>
                  {/* Source badge */}
                  <div style={{ fontSize:10, padding:'2px 8px', borderRadius:50, background:'var(--bg3)', color:'var(--text3)' }}>
                    {e.source || 'chat'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
