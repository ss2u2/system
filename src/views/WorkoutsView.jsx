import React, { useState } from 'react';
import { IconPlus, IconTrash, IconPlayerPlay, IconBarbell, IconPointFilled } from '@tabler/icons-react';
import { store } from '../services/db';

export default function WorkoutsView({ state, onStartWorkout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineRawInput, setRoutineRawInput] = useState('');

  const handleDeleteRoutine = (index) => {
    const routineToDelete = state.workoutRoutines[index];
    if (window.confirm(`Delete workout routine "${routineToDelete.name}"?`)) {
      const updated = state.workoutRoutines.filter((_, i) => i !== index);
      const deletedIds = {
        ...(state.deletedIds || {}),
        workoutRoutines: [...(state.deletedIds?.workoutRoutines || []), routineToDelete.id]
      };
      store.setState({ workoutRoutines: updated, deletedIds });
    }
  };

  const handleSaveRoutine = (e) => {
    e.preventDefault();
    if (!routineName.trim() || !routineRawInput.trim()) return;

    // Parse RAW input: Exercise | sets | reps | weight
    const exercises = routineRawInput
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const parts = line.split('|');
        const name = parts[0]?.trim() || 'Exercise';
        const numSets = parseInt(parts[1]?.trim()) || 3;
        const reps = parseInt(parts[2]?.trim()) || 10;
        const weight = parseFloat(parts[3]?.trim()) || 0;

        const sets = Array.from({ length: numSets }, () => ({
          reps,
          weight,
          done: false
        }));

        return { name, sets };
      });

    const newRoutine = {
      id: Date.now(),
      name: routineName.trim(),
      exercises
    };

    store.setState({ workoutRoutines: [...state.workoutRoutines, newRoutine] });
    setRoutineName('');
    setRoutineRawInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="main-view active" style={{ overflowY: 'auto', padding: '20px' }}>
      <div className="sec-hdr">
        <span className="sec-title">Workout Routines</span>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>
          <IconPlus size={13} />New Routine
        </button>
      </div>

      <div className="space-y-4">
        {state.workoutRoutines && state.workoutRoutines.length > 0 ? (
          state.workoutRoutines.map((routine, ri) => (
            <div key={routine.id} className="sm-card">
              <div className="sm-head">
                <div className="sm-icon bg-[#0d2a1a] text-[#4ade80]">
                  🏋️
                </div>
                <div className="sm-meta">
                  <div className="sm-name">{routine.name}</div>
                  <div className="sm-sub">{routine.exercises.length} exercises</div>
                </div>
                <div className="sm-actions">
                  <button 
                    onClick={() => handleDeleteRoutine(ri)} 
                    className="sm-btn danger cursor-pointer"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>

              {/* Preview exercises */}
              <div className="sm-steps-preview mb-3">
                {routine.exercises.map((ex, exI) => (
                  <div key={exI} className="sm-step-row">
                    <IconPointFilled size={8} />
                    <span className="sm-step-name">{ex.name}</span>
                    <span className="sm-step-dur">
                      {ex.sets.length} sets x {ex.sets[0]?.reps || 10} reps ({ex.sets[0]?.weight || 0} kg)
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="start-btn cursor-pointer bg-[#0d2a1a] border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#0d2a1a]"
                onClick={() => onStartWorkout(ri)}
              >
                <IconPlayerPlay size={14} /> Start Active Workout Session
              </button>
            </div>
          ))
        ) : (
          <div className="empty">
            <IconBarbell />
            No workout routines yet. Create a routine template to begin!
          </div>
        )}
      </div>

      {/* ==================== CREATE ROUTINE MODAL ==================== */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal">
            <div className="modal-title">New Workout Routine</div>
            <form onSubmit={handleSaveRoutine}>
              <div className="form-field">
                <label>Routine name</label>
                <input
                  type="text"
                  placeholder="e.g. Push Day, Full Body"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-field">
                <label>Exercises — one per line: Name | Sets | Reps | Weight (kg)</label>
                <textarea
                  placeholder={"Bench Press | 3 | 10 | 60\nOverhead Press | 3 | 8 | 40\nTricep Pushdowns | 3 | 12 | 25"}
                  value={routineRawInput}
                  onChange={(e) => setRoutineRawInput(e.target.value)}
                  style={{ height: '140px' }}
                  required
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Create Routine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
