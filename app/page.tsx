'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, Clock3, Flame, History, LockKeyhole, Plus, Radio, Swords, Trophy, Users, Zap } from 'lucide-react';

const recentMatches = [
  { event: '3×3×3 CUBE', format: 'AO5 STANDARD', opponent: 'PixelSolve', result: '13.49s', place: '1ST PLACE', win: true },
  { event: '2×2×2 CUBE', format: 'SINGLE', opponent: 'TwistTheory', result: '4.21s', place: '2ND PLACE', win: false },
  { event: '3×3×3 CUBE', format: 'AO5 STANDARD', opponent: 'CubeNova', result: '14.02s', place: '1ST PLACE', win: true },
];
const rankings = [{ rank: '01', name: 'FastCube', time: '6.82s', change: '+2' }, { rank: '02', name: 'CubeMaster', time: '7.14s', change: '—' }, { rank: '03', name: 'SpeedyAlex', time: '7.35s', change: '+1' }, { rank: '04', name: 'ShineCube', time: '12.84s', change: 'YOU' }];

export default function HomePage() {
  const [event, setEvent] = useState('3×3');
  const [format, setFormat] = useState('Ao5');
  const [visibility, setVisibility] = useState('Public');
  const [roomCode, setRoomCode] = useState('');
  const [notice, setNotice] = useState('');

  function createRoom() {
    setNotice(`Room setup ready: ${event} · ${format} · ${visibility}. Room creation will be connected to Supabase in Milestone 1/3.`);
  }
  function joinRoom() {
    if (roomCode.trim().length < 6) { setNotice('Enter a 6-character room code to continue.'); return; }
    setNotice(`Room code ${roomCode.toUpperCase()} is ready to connect. Multiplayer room lookup will be implemented in Milestone 3.`);
  }

  return <div className="dashboard">
    <section className="welcome panel">
      <div className="welcome-copy"><div className="eyebrow"><span className="pill green-pill">SEASON 1 LADDER ACTIVE</span><span className="pulse-dot"/></div><h1>Welcome back, <em>Shine.</em></h1><p>Ready to compete? Sharpen your focus, join the arena, and make every millisecond count.</p></div>
      <div className="welcome-metrics"><div className="mini-metric"><Zap size={17}/><span><small>NETWORK LATENCY</small><strong>— <small className="muted">not connected</small></strong></span></div><div className="mini-metric cyan"><Clock3 size={17}/><span><small>CURRENT FORM</small><strong>Sub-13 pace</strong></span></div></div>
    </section>

    <section className="action-grid">
      <div className="action-card create-card"><div className="card-orb green-orb"/><div className="card-content"><div className="card-topline"><span className="icon-tile green-tile"><Plus size={19}/></span><span className="eyebrow green-text">HOST COMPETITION</span><span className="pill subtle-pill">WCA-STYLE FORMAT</span></div><h2>CREATE A ROOM</h2><p>Configure your event and challenge other solvers in a shared competitive room.</p>
        <div className="form-grid"><div><label>EVENT DISCIPLINE</label><div className="segmented">{['3×3','2×2','4×4','OH'].map(v=><button key={v} className={event===v?'selected green-selected':''} onClick={()=>setEvent(v)}>{v}</button>)}</div></div><div><label>MATCH FORMAT</label><div className="segmented">{['Ao5','Single','Bo3'].map(v=><button key={v} className={format===v?'selected green-selected':''} onClick={()=>setFormat(v)}>{v}</button>)}</div></div></div>
        <div className="settings-row"><div className="setting-label"><LockKeyhole size={15}/><span>Visibility</span><select value={visibility} onChange={e=>setVisibility(e.target.value)} aria-label="Room visibility"><option>Public</option><option>Private</option></select></div><span className="max-players"><Users size={14}/> MAX SOLVERS <b>8</b></span></div>
        </div><button className="primary-button" onClick={createRoom}><Radio size={17}/> HOST NOW <ArrowRight size={16}/></button>
      </div>
      <div className="action-card join-card"><div className="card-orb cyan-orb"/><div className="card-content"><div className="card-topline"><span className="icon-tile cyan-tile"><Activity size={19}/></span><span className="eyebrow cyan-text">DIRECT CONNECT</span><span className="pill subtle-pill">INSTANT RELAY</span></div><h2>JOIN A ROOM</h2><p>Enter a 6-character room code and drop straight into the timer matrix.</p><label htmlFor="room-code">ROOM ACCESS CODE</label><input id="room-code" className="room-input" maxLength={6} value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))} placeholder="E.G. K7X9L2" />
        <div className="invite-row"><span><i/> INVITATION EXAMPLE <b>#PX94L2</b></span><button onClick={()=>setRoomCode('PX94L2')}>AUTO-FILL</button></div></div><button className="secondary-button" onClick={joinRoom}><Users size={17}/> JOIN MATCH <ArrowRight size={16}/></button>
      </div>
    </section>
    {notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}

    <section className="stats-ribbon panel"><div className="stats-title"><BarChart3 size={18}/><span>YOUR STATS</span></div><div className="stat-item"><small>TOTAL MATCHES</small><strong>24 <span>15 WINS</span></strong></div><div className="stat-item"><small>WIN RATE</small><strong className="green-text">62.5%</strong><div className="progress"><i/></div></div><div className="stat-item"><small>BEST 3×3 SINGLE</small><strong className="cyan-text">12.84<span className="unit">s</span><b className="pr-tag">PR</b></strong></div><div className="stat-item"><small>BEST 3×3 AO5</small><strong>13.49<span className="unit">s</span></strong></div><div className="stat-item"><small>CURRENT STREAK</small><strong className="green-text"><Flame size={17}/> 3W</strong></div><Link href="/profile" className="icon-button" aria-label="View analytics"><ArrowUpRight size={17}/></Link></section>

    <section className="lower-grid"><div className="panel recent-panel"><div className="section-heading"><div><History size={18}/><h3>RECENT COMPETITIONS</h3></div><Link href="/profile/matches">VIEW ARCHIVE <ArrowRight size={13}/></Link></div><div className="match-list">{recentMatches.map((match,i)=><div className="match-row" key={match.opponent}><div className={`match-icon ${match.win?'won':''}`}><Swords size={17}/></div><div className="match-main"><strong>{match.event}</strong><small>{match.format} <span>·</span> vs {match.opponent}</small></div><div className="match-result"><strong>{match.result}</strong><small className={match.win?'green-text':'muted'}>{match.place}</small></div><ArrowUpRight size={15} className="muted-icon"/></div>)}</div><Link href="/profile/matches" className="panel-link">OPEN MATCH HISTORY <ArrowRight size={14}/></Link></div>
      <div className="panel rankings-panel"><div className="section-heading"><div><Trophy size={18}/><h3>GLOBAL RANKINGS</h3></div><Link href="/rankings">FULL BOARD <ArrowRight size={13}/></Link></div><div className="rank-meta"><span>EVENT: 3×3×3</span><span>BEST SINGLE</span></div>{rankings.map(row=><div className={`rank-row ${row.change==='YOU'?'your-rank':''}`} key={row.rank}><span className="rank-number">{row.rank}</span><strong>{row.name}</strong><span className="rank-time">{row.time}</span><span className={`rank-change ${row.change==='YOU'?'you':row.change==='—'?'muted':'green-text'}`}>{row.change}</span></div>)}<div className="your-standing"><span><Trophy size={14}/> YOUR CURRENT RANK</span><strong>#128 <small>GLOBAL</small></strong></div></div></section>
    <div className="demo-note"><Activity size={14}/> Starter UI preview uses illustrative data. Authentication, live presence, and persistence are not connected yet.</div>
  </div>;
}
