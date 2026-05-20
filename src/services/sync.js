// Supabase Sync Service for write-local, sync-global architecture
import { supabase } from './supabase';

let syncTimeout = null;

/**
 * Pushes the local state changes to Supabase database.
 * Debounced to prevent continuous network requests on quick user actions.
 */
export function triggerSync(state) {
  if (!supabase) return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) return; // User must be authenticated to sync

      const userId = user.id;

      // 1. Sync tasks
      if (state.tasks && state.tasks.length > 0) {
        const taskPayloads = state.tasks.map(t => ({
          id: t.id,
          user_id: userId,
          name: t.name,
          cat: t.cat,
          done: t.done
        }));
        await supabase.from('tasks').upsert(taskPayloads);
      }

      // 2. Sync sessions
      if (state.sessions && state.sessions.length > 0) {
        const sessionPayloads = state.sessions.map(s => ({
          id: s.id,
          user_id: userId,
          name: s.name,
          icon: s.icon,
          color: s.color,
          steps: s.steps
        }));
        await supabase.from('sessions').upsert(sessionPayloads);
      }

      // 3. Sync goals (weekly, monthly, static)
      const goalPayloads = [
        ...(state.weekly || []).map(g => ({ id: g.id, user_id: userId, type: 'weekly', name: g.name, target: g.target, current: g.current, emoji: '🎯', note: '', cat: 'other', progress: 0 })),
        ...(state.monthly || []).map(g => ({ id: g.id, user_id: userId, type: 'monthly', name: g.name, target: g.target, current: g.current, emoji: '🎯', note: '', cat: 'other', progress: 0 })),
        ...(state.static || []).map(g => ({ id: g.id, user_id: userId, type: 'static', name: g.name, target: 100, current: g.progress, emoji: g.emoji, note: g.note || '', cat: g.cat || 'other', progress: g.progress }))
      ];
      if (goalPayloads.length > 0) {
        await supabase.from('goals').upsert(goalPayloads);
      }

      // 4. Sync journals
      if (state.journals && state.journals.length > 0) {
        const journalPayloads = state.journals.map(j => ({
          id: j.id,
          user_id: userId,
          title: j.title || '',
          content: typeof j.content === 'string' ? j.content : JSON.stringify(j.content)
        }));
        await supabase.from('journals').upsert(journalPayloads);
      }

      // 5. Sync workout routines
      if (state.workoutRoutines && state.workoutRoutines.length > 0) {
        const routinePayloads = state.workoutRoutines.map(r => ({
          id: r.id,
          user_id: userId,
          name: r.name,
          exercises: r.exercises
        }));
        await supabase.from('workout_routines').upsert(routinePayloads);
      }

      // 6. Sync workout logs
      if (state.workoutLogs && state.workoutLogs.length > 0) {
        const logPayloads = state.workoutLogs.map(l => ({
          id: l.id,
          user_id: userId,
          name: l.name,
          duration: l.duration || 0,
          exercises: l.exercises,
          created_at: l.created_at || new Date().toISOString()
        }));
        await supabase.from('workout_logs').upsert(logPayloads);
      }

      // 7. Sync profiles stats
      await supabase.from('profiles').upsert({
        id: userId,
        streak: state.streak || 0,
        completion_history: state.completionHistory || {},
        last_active_date: state.lastActiveDate || new Date().toDateString(),
        updated_at: new Date().toISOString()
      });

      console.log("Supabase background sync success.");
    } catch (e) {
      console.warn("Supabase background sync connection failed (will retry on next change):", e.message);
    }
  }, 2000); // 2 second debounce delay
}

/**
 * Pulls all remote state data from Supabase.
 * Returns the unified state object to update local storage.
 */
export async function pullSyncData() {
  if (!supabase) return null;

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    const userId = user.id;

    // Fetch from all tables in parallel
    const [
      tasksRes,
      sessionsRes,
      goalsRes,
      journalsRes,
      routinesRes,
      logsRes,
      profileRes
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('journals').select('*').eq('user_id', userId),
      supabase.from('workout_routines').select('*').eq('user_id', userId),
      supabase.from('workout_logs').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    ]);

    const newState = {};

    if (tasksRes.data) {
      newState.tasks = tasksRes.data.map(t => ({ id: t.id, name: t.name, cat: t.cat, done: t.done }));
    }
    if (sessionsRes.data) {
      newState.sessions = sessionsRes.data.map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, steps: s.steps, open: false }));
    }
    if (goalsRes.data) {
      const goals = goalsRes.data;
      newState.weekly = goals.filter(g => g.type === 'weekly').map(g => ({ id: g.id, name: g.name, target: g.target, current: g.current }));
      newState.monthly = goals.filter(g => g.type === 'monthly').map(g => ({ id: g.id, name: g.name, target: g.target, current: g.current }));
      newState.static = goals.filter(g => g.type === 'static').map(g => ({ id: g.id, name: g.name, emoji: g.emoji, note: g.note, cat: g.cat, progress: g.progress }));
    }
    if (journalsRes.data) {
      newState.journals = journalsRes.data.map(j => ({ id: j.id, title: j.title, content: j.content }));
    }
    if (routinesRes.data) {
      newState.workoutRoutines = routinesRes.data.map(r => ({ id: r.id, name: r.name, exercises: r.exercises }));
    }
    if (logsRes.data) {
      newState.workoutLogs = logsRes.data.map(l => ({ id: l.id, name: l.name, duration: l.duration, exercises: l.exercises, created_at: l.created_at }));
    }
    if (profileRes.data) {
      newState.streak = profileRes.data.streak;
      newState.completionHistory = profileRes.data.completion_history;
      newState.lastActiveDate = profileRes.data.last_active_date;
    }

    return Object.keys(newState).length > 0 ? newState : null;
  } catch (e) {
    console.error("Error pulling data from Supabase:", e);
    return null;
  }
}
