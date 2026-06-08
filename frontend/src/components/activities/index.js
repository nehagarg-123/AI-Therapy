// src/components/activities/BreathingExercise.js
import React, { useState, useEffect, useRef } from 'react';

const PHASES = [
  { name:'inhale',  duration:4, label:'Breathe In',  sub:'Expand your belly slowly', color:'#3b82f6', size:170 },
  { name:'hold',    duration:4, label:'Hold',         sub:'Stay still and present',   color:'#8b5cf6', size:170 },
  { name:'exhale',  duration:6, label:'Breathe Out',  sub:'Release all tension',      color:'#10b981', size:120 },
];

export function BreathingExercise() {
  const [running, setRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount]       = useState(PHASES[0].duration);
  const [cycles, setCycles]     = useState(0);
  const intervalRef             = useRef();

  const stop = () => {
    clearInterval(intervalRef.current);
    setRunning(false); setPhaseIdx(0); setCount(PHASES[0].duration); setCycles(0);
  };

  const start = () => {
    setRunning(true);
    let pIdx = 0, cnt = PHASES[0].duration;
    setPhaseIdx(0); setCount(cnt);
    intervalRef.current = setInterval(() => {
      cnt--;
      if (cnt <= 0) {
        if (PHASES[pIdx].name === 'exhale') setCycles(c => c+1);
        pIdx = (pIdx+1) % PHASES.length;
        cnt = PHASES[pIdx].duration;
        setPhaseIdx(pIdx);
      }
      setCount(cnt);
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const phase = PHASES[phaseIdx];

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28, padding:'32px 20px' }}>
      {/* Animated circle */}
      <div style={{ position:'relative', width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {/* Ripple rings */}
        {running && [1,2].map(r => (
          <div key={r} style={{
            position:'absolute', borderRadius:'50%',
            width:phase.size+r*30, height:phase.size+r*30,
            border:`1px solid ${phase.color}33`,
            animation:`ripple 2s ${r*0.4}s infinite`,
          }}/>
        ))}
        <div style={{
          width: phase.size, height: phase.size, borderRadius:'50%',
          background:`${phase.color}18`,
          border:`3px solid ${phase.color}`,
          transition:'width 1s ease, height 1s ease',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
        }}>
          {running
            ? <span style={{ fontSize:38, fontWeight:700, color:phase.color, lineHeight:1 }}>{count}</span>
            : <span style={{ fontSize:40 }}>🫁</span>
          }
        </div>
      </div>

      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'DM Serif Display', fontSize:28, color:'var(--text)' }}>{running ? phase.label : 'Box Breathing'}</div>
        <div style={{ fontSize:14, color:'var(--text2)', marginTop:6 }}>{running ? phase.sub : '4-4-6 technique for instant calm'}</div>
        {running && <div style={{ marginTop:10, fontSize:13, color:'var(--accent)', fontWeight:500 }}>Cycle {cycles+1} · {phase.name}</div>}
      </div>

      {/* Phase progress */}
      {running && (
        <div style={{ display:'flex', gap:8 }}>
          {PHASES.map((p,i) => (
            <div key={p.name} style={{
              padding:'6px 14px', borderRadius:50, fontSize:12, fontWeight:500,
              background: i===phaseIdx ? `${p.color}22` : 'var(--bg3)',
              color: i===phaseIdx ? p.color : 'var(--text3)',
              border:`1px solid ${i===phaseIdx ? p.color : 'var(--border)'}`,
              transition:'all .3s',
            }}>{p.label} ({p.duration}s)</div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:12 }}>
        {!running
          ? <button onClick={start} style={{ padding:'12px 32px', borderRadius:50, border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>Begin</button>
          : <button onClick={stop}  style={{ padding:'12px 32px', borderRadius:50, border:'none', background:'#ef4444',      color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer' }}>Stop</button>
        }
      </div>

      <style>{`
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
      `}</style>
    </div>
  );
}


// src/components/activities/AnxietyActivities.js
export function AnxietyActivities() {
  const activities = [
    { title:'5-4-3-2-1 Grounding',       icon:'🌿', color:'#10b981', desc:'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Anchors you to the present moment.' },
    { title:'Progressive Muscle Relax',   icon:'💆', color:'#3b82f6', desc:'Tense each muscle group for 5 seconds then release, starting from your toes up to your forehead.' },
    { title:'Thought Journaling (CBT)',   icon:'✍', color:'#8b5cf6', desc:'Write the worried thought → evidence for it → evidence against it → then write a balanced, realistic view.' },
    { title:'Cold Water Reset',           icon:'❄', color:'#06b6d4', desc:'Splash cold water on your face or hold ice cubes. Triggers the dive reflex, immediately calming your nervous system.' },
    { title:'Body Scan Meditation',       icon:'🧘', color:'#f59e0b', desc:'Lie down, close eyes. Slowly move awareness head-to-toe, noticing sensations without judgment.' },
    { title:'Bilateral Tapping (EMDR)',   icon:'👐', color:'#ec4899', desc:'Alternately tap your knees left-right while focusing on the distressing thought. EMDR-based stress reduction.' },
    { title:'Safe Place Visualization',   icon:'🏔',  color:'#4a7c59', desc:'Close your eyes and vividly imagine a place where you feel completely safe, peaceful, and at ease.' },
   
  ];

  return (
    <div style={{ padding:'20px', overflowY:'auto', height:'100%' }}>
      <h2 style={{ fontFamily:'DM Serif Display', fontSize:24, color:'var(--text)', marginBottom:4 }}>Anxiety Relief Activities</h2>
      <p style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Evidence-based techniques from CBT, mindfulness, and EMDR therapy</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {activities.map((a,i) => (
          <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'18px', borderLeft:`4px solid ${a.color}` }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{a.icon}</div>
              <span style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{a.title}</span>
            </div>
            <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
