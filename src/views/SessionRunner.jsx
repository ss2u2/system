import React, { useState, useEffect, useRef } from 'react';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconArrowRight,
  IconX,
  IconVolume,
  IconVolumeOff,
  IconConfetti,
  IconCheck,
} from '@tabler/icons-react';
import { playChime } from '../services/sound';
import { store } from '../services/db';

/* ─── helpers ─── */
const parseDuration = (str) => {
  if (!str) return 60;
  const s = str.toLowerCase().trim();
  if (s.includes('min')) return Math.round(parseFloat(s) * 60);
  if (s.includes('s')) return parseInt(s) || 60;
  return parseInt(s) || 60;
};

const fmt = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/* ─── Circular ring ─── */
function RingTimer({ timeLeft, total }) {
  const R = 54;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? timeLeft / total : 0;
  const dash = circ * pct;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* track */}
      <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      {/* fill */}
      <circle
        cx="70" cy="70" r={R}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dasharray 0.9s linear' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c6af7" />
          <stop offset="100%" stopColor="#a594ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── main ─── */
export default function SessionRunner({ state, sessionIndex, onClose }) {
  const session = state.sessions[sessionIndex];

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [totalSecs, setTotalSecs]           = useState(0);
  const [timeLeft, setTimeLeft]             = useState(0);
  const [isRunning, setIsRunning]           = useState(false);
  const [soundEnabled, setSoundEnabled]     = useState(true);
  const [isFinished, setIsFinished]         = useState(false);

  const intervalRef  = useRef(null);
  const timeLeftRef  = useRef(0);
  const isRunningRef = useRef(false);

  const step = session?.steps?.[currentStepIdx];

  /* ── init / step change ── */
  useEffect(() => {
    if (!step) return;
    const secs = parseDuration(step.dur);
    setTotalSecs(secs);
    setTimeLeft(secs);
    timeLeftRef.current = secs;
    setIsRunning(true);
    isRunningRef.current = true;
  }, [currentStepIdx]);

  /* ── stable interval ── */
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        clearInterval(intervalRef.current);
        setTimeLeft(0);
        timeLeftRef.current = 0;
        // auto-advance
        advanceStep();
      } else {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* ── keep ref in sync when user pauses/resumes ── */
  const togglePause = () => {
    setIsRunning(r => {
      isRunningRef.current = !r;
      return !r;
    });
  };

  const advanceStep = () => {
    if (soundEnabled) playChime();

    // mark step done in store
    const updatedSessions = [...state.sessions];
    updatedSessions[sessionIndex].steps[currentStepIdx].done = true;
    store.setState({ sessions: updatedSessions });

    if (currentStepIdx < session.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setIsRunning(false);
      isRunningRef.current = false;
      setIsFinished(true);
    }
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    advanceStep();
  };

  if (!session) return null;

  /* ── overlay style ── */
  const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(10,10,13,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: '24px 20px',
    animation: 'runnerFadeIn 0.3s ease both',
  };

  const card = {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  /* ─── FINISHED SCREEN ─── */
  if (isFinished) {
    return (
      <div style={overlay}>
        <style>{`
          @keyframes runnerFadeIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
          @keyframes confettiBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        `}</style>
        <div style={{ ...card, alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ animation: 'confettiBounce 1s ease infinite' }}>
            <IconConfetti size={64} color="#4ade80" />
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#f0eff5', letterSpacing: '-0.5px' }}>
            Session Complete!
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#9b9aab', lineHeight: 1.6, maxWidth: 300 }}>
            Amazing work. You've completed all {session.steps.length} steps of "{session.name}".
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 8, padding: '14px 48px',
              background: 'linear-gradient(135deg,#7c6af7,#a594ff)',
              border: 'none', borderRadius: 14, color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(124,106,247,0.4)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  /* ─── RUNNING SCREEN ─── */
  return (
    <div style={overlay}>
      <style>{`
        @keyframes runnerFadeIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
        .runner-ctrl-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .runner-pause-btn:hover { background: rgba(124,106,247,0.25) !important; }
        .runner-skip-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <div style={card}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 13, color: '#5c5b6e', fontWeight: 500, letterSpacing: 0.5 }}>
            STEP {currentStepIdx + 1} OF {session.steps.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="runner-ctrl-btn"
              onClick={() => setSoundEnabled(v => !v)}
              title={soundEnabled ? 'Mute chime' : 'Unmute chime'}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#9b9aab', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              {soundEnabled ? <IconVolume size={15} /> : <IconVolumeOff size={15} />}
            </button>
            <button
              className="runner-ctrl-btn"
              onClick={onClose}
              title="Exit session"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <IconX size={15} />
            </button>
          </div>
        </div>

        {/* ── Session & Step name ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: '#5c5b6e', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            {session.name}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f0eff5', letterSpacing: '-0.3px' }}>
            {step.name}
          </h2>
        </div>

        {/* ── Ring Timer ── */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 32 }}>
          <RingTimer timeLeft={timeLeft} total={totalSecs} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 34, fontWeight: 700, color: '#f0eff5',
              fontFamily: "'DM Mono', monospace", letterSpacing: '-1px',
            }}>
              {fmt(timeLeft)}
            </span>
            <span style={{ fontSize: 11, color: '#5c5b6e', marginTop: 2 }}>
              {isRunning ? 'running' : 'paused'}
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <button
            className="runner-pause-btn"
            onClick={togglePause}
            style={{
              flex: 1, padding: '13px 0',
              background: 'rgba(124,106,247,0.15)',
              border: '1px solid rgba(124,106,247,0.35)',
              borderRadius: 14, color: '#a594ff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s', fontFamily: 'inherit',
            }}
          >
            {isRunning ? <><IconPlayerPause size={17} /> Pause</> : <><IconPlayerPlay size={17} /> Resume</>}
          </button>
          <button
            className="runner-skip-btn"
            onClick={handleSkip}
            style={{
              flex: 1, padding: '13px 0',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, color: '#9b9aab',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s', fontFamily: 'inherit',
            }}
          >
            Skip <IconArrowRight size={16} />
          </button>
        </div>

        {/* ── Step dots ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {session.steps.map((s, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentStepIdx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: s.done
                  ? '#4ade80'
                  : idx === currentStepIdx
                  ? 'linear-gradient(90deg,#7c6af7,#a594ff)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
