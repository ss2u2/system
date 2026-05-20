import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconCheck, IconPlayerPlay, IconPlayerPause, IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';
import { playChime } from '../services/sound';
import { store } from '../services/db';

export default function WorkoutRunner({ state, routineIndex, onClose }) {
  const routine = state.workoutRoutines[routineIndex];
  
  // Clone routine exercises to track checkmarks in component state
  const [exercises, setExercises] = useState(() => 
    JSON.parse(JSON.stringify(routine.exercises))
  );

  // Active workout stopwatch
  const [workoutDuration, setWorkoutDuration] = useState(0);
  
  // Rest Timer State
  const [restTimeLeft, setRestTimeLeft] = useState(null); // null means inactive
  const [restTimerMax, setRestTimerMax] = useState(90); // default 90s rest

  const stopwatchRef = useRef(null);
  const restTimerRef = useRef(null);

  // Stopwatch effect
  useEffect(() => {
    stopwatchRef.current = setInterval(() => {
      setWorkoutDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(stopwatchRef.current);
  }, []);

  // Rest Timer effect
  useEffect(() => {
    if (restTimeLeft !== null && restTimeLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (restTimeLeft === 0) {
      playChime();
      setRestTimeLeft(null);
    }

    return () => clearInterval(restTimerRef.current);
  }, [restTimeLeft]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    const item = updated[exIdx].sets[setIdx];
    item.done = !item.done;
    
    setExercises(updated);

    // Trigger Rest Timer if marking a set completed
    if (item.done) {
      setRestTimeLeft(restTimerMax);
    }
  };

  const handleAdjustRest = (amount) => {
    if (restTimeLeft === null) return;
    setRestTimeLeft(prev => Math.max(0, prev + amount));
  };

  const handleFinishWorkout = () => {
    // 1. Create Workout Log Payload
    const workoutLog = {
      id: Date.now(),
      name: routine.name,
      duration: workoutDuration,
      exercises,
      created_at: new Date().toISOString()
    };

    // 2. Increment Workout/Exercise Goals
    const updatedWeekly = (state.weekly || []).map(g => {
      const name = g.name.toLowerCase();
      if (name.includes('exercise') || name.includes('workout') || name.includes('gym')) {
        return { ...g, current: g.current + 1 };
      }
      return g;
    });

    const updatedMonthly = (state.monthly || []).map(g => {
      const name = g.name.toLowerCase();
      if (name.includes('exercise') || name.includes('workout') || name.includes('gym')) {
        return { ...g, current: g.current + 1 };
      }
      return g;
    });

    // 3. Update Global State
    store.setState({
      workoutLogs: [...(state.workoutLogs || []), workoutLog],
      weekly: updatedWeekly,
      monthly: updatedMonthly
    });

    alert("Workout finished! Log saved and goals updated.");
    onClose();
  };

  return (
    <div className="runner-overlay open">
      <div className="runner-container !max-w-[480px]">
        {/* Header */}
        <div className="runner-header">
          <div className="runner-progress">
            Active: <span className="font-mono text-white ml-1">{formatTime(workoutDuration)}</span>
          </div>
          <button onClick={onClose} className="runner-icon-btn text-[#f87171]" title="Cancel workout">
            <IconX size={16} />
          </button>
        </div>

        {/* Workout Details */}
        <div className="runner-body !pt-2" style={{ paddingBottom: restTimeLeft !== null ? '120px' : '40px' }}>
          <h2 className="text-xl font-bold text-[#f0eff5] flex items-center gap-2 mb-4">
            🏋️ {routine.name}
          </h2>

          <div className="space-y-6">
            {exercises.map((ex, exI) => (
              <div key={exI} className="bg-[#17171a] border border-[#2e2e36] rounded-xl p-4">
                <h4 className="font-semibold text-sm text-[#f0eff5] mb-3">{ex.name}</h4>
                
                {/* Sets check grid */}
                <div className="space-y-2">
                  {ex.sets.map((set, setI) => (
                    <div 
                      key={setI} 
                      onClick={() => handleToggleSet(exI, setI)}
                      className={`flex justify-between items-center px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        set.done 
                          ? 'bg-[#0d2a1a]/30 border-[#4ade80]/40 text-[#4ade80]' 
                          : 'bg-[#1e1e22] border-[#2e2e36] text-[#9b9aab] hover:border-[#3e3e4a]'
                      }`}
                    >
                      <div className="font-mono">
                        Set {setI + 1}: {set.reps} reps @ {set.weight} kg
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        set.done ? 'bg-[#4ade80] border-[#4ade80]' : 'border-[#3e3e4a]'
                      }`}>
                        {set.done && <IconCheck size={12} className="text-black stroke-[3px]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleFinishWorkout}
            className="w-full mt-6 py-3 text-center bg-[#4ade80] text-black font-semibold rounded-xl hover:bg-[#3ec471] transition-colors cursor-pointer text-sm"
          >
            Finish Workout & Save Log
          </button>
        </div>

        {/* Floating Rest Timer Panel */}
        {restTimeLeft !== null && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-[#1e1e22] border border-[#7c6af7]/30 shadow-2xl shadow-[#7c6af7]/10 rounded-2xl p-4 flex items-center justify-between z-50 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e1a3a] flex items-center justify-center text-[#7c6af7] font-bold text-sm">
                ⏱️
              </div>
              <div>
                <div className="text-[10px] text-[#5c5b6e] uppercase tracking-wider font-semibold">Rest Timer</div>
                <div className="text-xl font-bold font-mono text-white">{restTimeLeft}s</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleAdjustRest(-30)} 
                className="w-8 h-8 rounded-lg bg-[#2e2e36] text-[#9b9aab] hover:text-white flex items-center justify-center cursor-pointer"
                title="Subtract 30 seconds"
              >
                <IconMinus size={14} />
              </button>
              <button 
                onClick={() => handleAdjustRest(30)} 
                className="w-8 h-8 rounded-lg bg-[#2e2e36] text-[#9b9aab] hover:text-white flex items-center justify-center cursor-pointer"
                title="Add 30 seconds"
              >
                <IconPlus size={14} />
              </button>
              <button 
                onClick={() => setRestTimeLeft(null)} 
                className="px-3 py-1.5 rounded-lg bg-[#7c6af7] text-white text-xs font-semibold hover:bg-[#6855e3] cursor-pointer"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
