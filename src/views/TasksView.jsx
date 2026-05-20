import React, { useState } from 'react';
import {
  IconSun,
  IconLayersIntersect,
  IconCalendarWeek,
  IconCalendarMonth,
  IconFlag,
  IconArrowRight,
  IconPlus,
  IconChevronDown,
  IconCheck,
  IconTrash,
  IconPointFilled,
  IconPlayerPlay,
  IconClipboard
} from '@tabler/icons-react';
import { store } from '../services/db';

export default function TasksView({ state, onStartSession }) {
  const [subTab, setSubTab] = useState('today');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'task', 'session', 'goal', 'static'
  
  // Modal Fields
  const [taskName, setTaskName] = useState('');
  const [taskCat, setTaskCat] = useState('work');
  
  const [sessionName, setSessionName] = useState('');
  const [sessionIcon, setSessionIcon] = useState('🏋️');
  const [sessionColor, setSessionColor] = useState('accent');
  const [sessionSteps, setSessionSteps] = useState('');

  const [goalType, setGoalType] = useState('weekly');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(5);
  const [goalCurrent, setGoalCurrent] = useState(0);

  const [lifeGoalName, setLifeGoalName] = useState('');
  const [lifeGoalEmoji, setLifeGoalEmoji] = useState('🎯');
  const [lifeGoalNote, setLifeGoalNote] = useState('');
  const [lifeGoalCat, setLifeGoalCat] = useState('life');

  const colorMap = { accent: '#7c6af7', green: '#4ade80', amber: '#f59e0b', blue: '#60a5fa', pink: '#e879f9' };
  const colorBgMap = { accent: '#1e1a3a', green: '#0d2a1a', amber: '#2a1f07', blue: '#0d1f3a', pink: '#2a0a2e' };

  // Calculate score
  const calculateTodayScore = () => {
    const all = [...(state.sessions || []).flatMap(s => s.steps || []), ...(state.tasks || [])];
    const done = all.filter(x => x.done).length;
    return all.length ? Math.round((done / all.length) * 100) : 0;
  };

  const score = calculateTodayScore();

  // Handlers
  const toggleTodaySession = (index) => {
    const updated = [...state.sessions];
    updated[index].open = !updated[index].open;
    store.setState({ sessions: updated });
  };

  const toggleStep = (sessIndex, stepIndex) => {
    const updated = [...state.sessions];
    updated[sessIndex].steps[stepIndex].done = !updated[sessIndex].steps[stepIndex].done;
    store.setState({ sessions: updated });
  };

  const toggleTask = (index) => {
    const updated = [...state.tasks];
    updated[index].done = !updated[index].done;
    store.setState({ tasks: updated });
  };

  const handleDeleteSession = (index) => {
    if (window.confirm(`Delete "${state.sessions[index].name}"?`)) {
      const updated = state.sessions.filter((_, idx) => idx !== index);
      store.setState({ sessions: updated });
    }
  };

  const handleUpdateStaticProg = (index, val) => {
    const updated = [...state.static];
    updated[index].progress = parseInt(val);
    store.setState({ static: updated });
  };

  // Saves
  const saveTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    const newTask = {
      id: Date.now(),
      name: taskName.trim(),
      cat: taskCat,
      done: false
    };
    store.setState({ tasks: [...state.tasks, newTask] });
    setTaskName('');
    setActiveModal(null);
  };

  const saveSession = (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionSteps.trim()) return;
    const steps = sessionSteps
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const parts = line.split('|');
        return {
          name: parts[0].trim(),
          dur: parts[1] ? parts[1].trim() : '—',
          done: false
        };
      });

    const newSession = {
      id: Date.now(),
      name: sessionName.trim(),
      icon: sessionIcon.trim() || '⚡',
      color: sessionColor,
      steps,
      open: false
    };

    store.setState({ sessions: [...state.sessions, newSession] });
    setSessionName('');
    setSessionIcon('🏋️');
    setSessionSteps('');
    setActiveModal(null);
  };

  const saveGoal = (e) => {
    e.preventDefault();
    if (!goalName.trim()) return;
    const newGoal = {
      id: Date.now(),
      name: goalName.trim(),
      target: parseInt(goalTarget) || 5,
      current: parseInt(goalCurrent) || 0
    };

    const targetList = goalType === 'weekly' ? 'weekly' : 'monthly';
    store.setState({ [targetList]: [...state[targetList], newGoal] });
    setGoalName('');
    setGoalTarget(5);
    setGoalCurrent(0);
    setActiveModal(null);
  };

  const saveStaticGoal = (e) => {
    e.preventDefault();
    if (!lifeGoalName.trim()) return;
    const newLifeGoal = {
      id: Date.now(),
      name: lifeGoalName.trim(),
      emoji: lifeGoalEmoji.trim() || '🎯',
      note: lifeGoalNote.trim(),
      cat: lifeGoalCat,
      progress: 0
    };
    store.setState({ static: [...state.static, newLifeGoal] });
    setLifeGoalName('');
    setLifeGoalEmoji('🎯');
    setLifeGoalNote('');
    setActiveModal(null);
  };

  return (
    <div className="main-view active">
      {/* Sub Tabs */}
      <div className="sub-tabs">
        <div className={`sub-tab ${subTab === 'today' ? 'active' : ''}`} onClick={() => setSubTab('today')}>
          <IconSun size={14} />Today
        </div>
        <div className={`sub-tab ${subTab === 'sessions' ? 'active' : ''}`} onClick={() => setSubTab('sessions')}>
          <IconLayersIntersect size={14} />Sessions
        </div>
        <div className={`sub-tab ${subTab === 'weekly' ? 'active' : ''}`} onClick={() => setSubTab('weekly')}>
          <IconCalendarWeek size={14} />Weekly
        </div>
        <div className={`sub-tab ${subTab === 'monthly' ? 'active' : ''}`} onClick={() => setSubTab('monthly')}>
          <IconCalendarMonth size={14} />Monthly
        </div>
        <div className={`sub-tab ${subTab === 'static' ? 'active' : ''}`} onClick={() => setSubTab('static')}>
          <IconFlag size={14} />Life Goals
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        
        {/* ==================== TODAY VIEW ==================== */}
        {subTab === 'today' && (
          <div className="view active">
            <div className="prog-bar-wrap">
              <div className="prog-bar-label">
                <span>Today's progress</span>
                <span>{score}%</span>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${score}%` }}></div>
              </div>
            </div>

            {/* Sessions Section */}
            <div className="sec-hdr">
              <span className="sec-title">Sessions</span>
              <div className="add-btn" onClick={() => setSubTab('sessions')}>
                <IconArrowRight size={13} />Manage
              </div>
            </div>

            <div id="today-sessions">
              {state.sessions && state.sessions.length > 0 ? (
                state.sessions.map((s, si) => {
                  const total = s.steps.length;
                  const done = s.steps.filter(x => x.done).length;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  const c = colorMap[s.color] || colorMap.accent;
                  const cbg = colorBgMap[s.color] || colorBgMap.accent;
                  const r = 13;
                  const circ = 2 * Math.PI * r;
                  const offset = circ - (pct / 100) * circ;

                  return (
                    <div key={s.id} className={`session-card ${s.open ? 'open' : ''}`}>
                      <div className="session-head" onClick={() => toggleTodaySession(si)}>
                        <div className="session-icon" style={{ background: cbg, color: c }}>
                          {s.icon}
                        </div>
                        <div className="session-meta">
                          <div className="session-name">{s.name}</div>
                          <div className="session-sub">
                            {done}/{total} steps · {pct}% done
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="prog-ring">
                            <svg width="32" height="32" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r={r} stroke={cbg} strokeWidth="3" fill="none" />
                              <circle
                                cx="16"
                                cy="16"
                                r={r}
                                stroke={c}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={circ}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="prog-num" style={{ color: c }}>{pct}%</div>
                          </div>
                          <IconChevronDown size={14} className="session-expand" />
                        </div>
                      </div>
                      <div className="session-body">
                        <div className="step-list">
                          {s.steps.map((step, i) => (
                            <div
                              key={i}
                              className={`step-item ${step.done ? 'done' : ''}`}
                              onClick={() => toggleStep(si, i)}
                            >
                              <div className="step-check">
                                <IconCheck size={10} />
                              </div>
                              <div className="step-name">{i + 1}. {step.name}</div>
                              <div className="step-dur">{step.dur}</div>
                            </div>
                          ))}
                        </div>
                        <button
                          className="start-btn cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartSession(si);
                          }}
                        >
                          <IconPlayerPlay size={14} /> Run Session Flow
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <IconLayersIntersect />
                  No sessions. Create them in the Sessions tab.
                </div>
              )}
            </div>

            <div className="divider"></div>

            {/* Tasks Section */}
            <div className="sec-hdr">
              <span className="sec-title">Tasks</span>
              <button className="add-btn" onClick={() => setActiveModal('task')}>
                <IconPlus size={13} />Add Task
              </button>
            </div>

            <div className="tasks-list">
              {state.tasks && state.tasks.length > 0 ? (
                state.tasks.map((t, idx) => (
                  <div key={t.id} className={`task-item ${t.done ? 'done' : ''}`} onClick={() => toggleTask(idx)}>
                    <div className="task-cb">
                      <IconCheck size={10} />
                    </div>
                    <div className="task-name">{t.name}</div>
                    <span className={`task-badge badge-${t.cat}`}>{t.cat}</span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <IconClipboard />
                  No tasks yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SESSIONS MANAGER ==================== */}
        {subTab === 'sessions' && (
          <div className="view active">
            <div className="sec-hdr">
              <span className="sec-title">Your Sessions</span>
              <button className="add-btn" onClick={() => setActiveModal('session')}>
                <IconPlus size={13} />New Session
              </button>
            </div>
            
            <div id="sessions-manager" className="space-y-4">
              {state.sessions && state.sessions.length > 0 ? (
                state.sessions.map((s, si) => {
                  const c = colorMap[s.color] || colorMap.accent;
                  const cbg = colorBgMap[s.color] || colorBgMap.accent;

                  return (
                    <div key={s.id} className="sm-card">
                      <div className="sm-head">
                        <div className="sm-icon" style={{ background: cbg, color: c }}>{s.icon}</div>
                        <div className="sm-meta">
                          <div className="sm-name">{s.name}</div>
                          <div className="sm-sub">{s.steps.length} steps</div>
                        </div>
                        <div className="sm-actions">
                          <button className="sm-btn danger cursor-pointer" onClick={() => handleDeleteSession(si)}>
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="sm-steps-preview">
                        {s.steps.map((st, i) => (
                          <div key={i} className="sm-step-row">
                            <IconPointFilled size={8} />
                            <span className="sm-step-name">{i + 1}. {st.name}</span>
                            <span className="sm-step-dur">{st.dur}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <IconLayersIntersect />
                  No sessions yet. Create your first one!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== WEEKLY GOALS ==================== */}
        {subTab === 'weekly' && (
          <div className="view active">
            <div className="sec-hdr">
              <span className="sec-title">Weekly Goals</span>
              <button className="add-btn" onClick={() => { setGoalType('weekly'); setActiveModal('goal'); }}>
                <IconPlus size={13} />Add Goal
              </button>
            </div>
            
            <div className="goals-list">
              {state.weekly && state.weekly.length > 0 ? (
                state.weekly.map(g => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                  const cls = pct >= 80 ? 'fill-green' : pct >= 40 ? 'fill-amber' : 'fill-red';
                  const scls = pct >= 80 ? 'status-on' : pct >= 40 ? 'status-at' : 'status-off';
                  const slbl = pct >= 80 ? 'On track' : pct >= 40 ? 'In progress' : 'Needs work';

                  return (
                    <div key={g.id} className="goal-item">
                      <div className="goal-top">
                        <div className="goal-name">{g.name}</div>
                        <span className={`goal-status ${scls}`}>{slbl}</span>
                      </div>
                      <div className="goal-prog-row">
                        <div className="goal-prog-track">
                          <div className={`goal-prog-fill ${cls}`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="goal-pct">{g.current}/{g.target} · {pct}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <IconCalendarWeek />
                  No weekly goals yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== MONTHLY GOALS ==================== */}
        {subTab === 'monthly' && (
          <div className="view active">
            <div className="sec-hdr">
              <span className="sec-title">Monthly Goals</span>
              <button className="add-btn" onClick={() => { setGoalType('monthly'); setActiveModal('goal'); }}>
                <IconPlus size={13} />Add Goal
              </button>
            </div>
            
            <div className="goals-list">
              {state.monthly && state.monthly.length > 0 ? (
                state.monthly.map(g => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                  const cls = pct >= 80 ? 'fill-green' : pct >= 40 ? 'fill-amber' : 'fill-red';
                  const scls = pct >= 80 ? 'status-on' : pct >= 40 ? 'status-at' : 'status-off';
                  const slbl = pct >= 80 ? 'On track' : pct >= 40 ? 'In progress' : 'Needs work';

                  return (
                    <div key={g.id} className="goal-item">
                      <div className="goal-top">
                        <div className="goal-name">{g.name}</div>
                        <span className={`goal-status ${scls}`}>{slbl}</span>
                      </div>
                      <div className="goal-prog-row">
                        <div className="goal-prog-track">
                          <div className={`goal-prog-fill ${cls}`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="goal-pct">{g.current}/{g.target} · {pct}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <IconCalendarMonth />
                  No monthly goals yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== LIFE GOALS (STATIC) ==================== */}
        {subTab === 'static' && (
          <div className="view active">
            <div className="sec-hdr">
              <span className="sec-title">Life Goals</span>
              <button className="add-btn" onClick={() => setActiveModal('static')}>
                <IconPlus size={13} />Add Goal
              </button>
            </div>
            
            <div className="static-list">
              {state.static && state.static.length > 0 ? (
                state.static.map((g, gi) => {
                  const pct = Math.min(100, Math.round(g.progress));
                  const fillCls = pct >= 70 ? 'fill-green' : pct >= 35 ? 'fill-amber' : 'fill-red';

                  return (
                    <div key={g.id} className="static-card">
                      <div className="static-top">
                        <div className="static-emoji">{g.emoji}</div>
                        <div className="static-info">
                          <div className="static-name">{g.name}</div>
                          {g.note && <div className="static-note">{g.note}</div>}
                        </div>
                        <span className={`static-tag tag-${g.cat}`}>{g.cat}</span>
                      </div>
                      <div className="static-bottom">
                        <div className="static-status-row">
                          <div className="static-prog-track">
                            <div className={`static-prog-fill ${fillCls}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                        <span className="static-pct">{pct}%</span>
                      </div>
                      <div className="static-edit-row">
                        <label>Progress</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pct}
                          step="1"
                          onChange={(e) => handleUpdateStaticProg(gi, e.target.value)}
                          className="flex-1 accent-[#7c6af7]"
                        />
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <IconFlag />
                  No life goals yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== ADD TASK MODAL ==================== */}
      {activeModal === 'task' && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div className="modal">
            <div className="modal-title">Add Task</div>
            <form onSubmit={saveTask}>
              <div className="form-field">
                <label>Task name</label>
                <input
                  type="text"
                  placeholder="e.g. Read 20 pages"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-field">
                <label>Category</label>
                <select value={taskCat} onChange={(e) => setTaskCat(e.target.value)}>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="mind">Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD SESSION MODAL ==================== */}
      {activeModal === 'session' && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div className="modal">
            <div className="modal-title">New Session</div>
            <form onSubmit={saveSession}>
              <div className="form-field">
                <label>Session name</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Exercise"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-field">
                <label>Emoji icon</label>
                <input
                  type="text"
                  placeholder="🏋️"
                  maxLength={2}
                  value={sessionIcon}
                  onChange={(e) => setSessionIcon(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Color theme</label>
                <select value={sessionColor} onChange={(e) => setSessionColor(e.target.value)}>
                  <option value="accent">Purple</option>
                  <option value="green">Green</option>
                  <option value="amber">Amber</option>
                  <option value="blue">Blue</option>
                  <option value="pink">Pink</option>
                </select>
              </div>
              <div className="form-field">
                <label>Steps — one per line: Name | duration (e.g. Stretch | 5 min)</label>
                <textarea
                  placeholder={"Stretch | 5 min\nWorkout | 30 min\nFacial exercise | 10 min"}
                  value={sessionSteps}
                  onChange={(e) => setSessionSteps(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD GOAL MODAL ==================== */}
      {activeModal === 'goal' && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div className="modal">
            <div className="modal-title">Add {goalType === 'weekly' ? 'Weekly' : 'Monthly'} Goal</div>
            <form onSubmit={saveGoal}>
              <div className="form-field">
                <label>Goal description</label>
                <input
                  type="text"
                  placeholder="e.g. Exercise 5 times this week"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-field">
                <label>Target (number)</label>
                <input
                  type="number"
                  placeholder="5"
                  min="1"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Current progress</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD LIFE GOAL MODAL ==================== */}
      {activeModal === 'static' && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div className="modal">
            <div className="modal-title">Add Life Goal</div>
            <form onSubmit={saveStaticGoal}>
              <div className="form-field">
                <label>Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Buy a car, Get in shape"
                  value={lifeGoalName}
                  onChange={(e) => setLifeGoalName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-field">
                <label>Emoji</label>
                <input
                  type="text"
                  placeholder="🚗"
                  maxLength={2}
                  value={lifeGoalEmoji}
                  onChange={(e) => setLifeGoalEmoji(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Save ₹3L, target by Dec 2025"
                  value={lifeGoalNote}
                  onChange={(e) => setLifeGoalNote(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Category</label>
                <select value={lifeGoalCat} onChange={(e) => setLifeGoalCat(e.target.value)}>
                  <option value="life">Life</option>
                  <option value="finance">Finance</option>
                  <option value="career">Career</option>
                  <option value="health">Health</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">Add Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
