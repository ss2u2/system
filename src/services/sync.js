// Supabase Sync Service for write-local, sync-global architecture
import { supabase } from './supabase';

let syncTimeout = null;
let storeRef = null;

/**
 * Registers the local store reference to prevent circular import dependencies
 */
export function registerStore(store) {
  storeRef = store;
}

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
        try {
          const taskPayloads = state.tasks.map(t => ({
            id: t.id,
            user_id: userId,
            name: t.name,
            cat: t.cat,
            done: t.done
          }));
          await supabase.from('tasks').upsert(taskPayloads);
        } catch (err) {
          console.warn("Failed to sync tasks to Supabase:", err);
        }
      }

      // 1b. Delete tasks
      if (state.deletedIds?.tasks?.length > 0) {
        try {
          const { error } = await supabase.from('tasks').delete().in('id', state.deletedIds.tasks);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                tasks: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete tasks from Supabase:", err);
        }
      }

      // 2. Sync sessions
      if (state.sessions && state.sessions.length > 0) {
        try {
          const sessionPayloads = state.sessions.map(s => ({
            id: s.id,
            user_id: userId,
            name: s.name,
            icon: s.icon,
            color: s.color,
            steps: s.steps
          }));
          await supabase.from('sessions').upsert(sessionPayloads);
        } catch (err) {
          console.warn("Failed to sync sessions to Supabase:", err);
        }
      }

      // 2b. Delete sessions
      if (state.deletedIds?.sessions?.length > 0) {
        try {
          const { error } = await supabase.from('sessions').delete().in('id', state.deletedIds.sessions);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                sessions: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete sessions from Supabase:", err);
        }
      }

      // 3. Sync goals (weekly, monthly, static)
      try {
        const goalPayloads = [
          ...(state.weekly || []).map(g => ({ id: g.id, user_id: userId, type: 'weekly', name: g.name, target: g.target, current: g.current, emoji: '🎯', note: '', cat: 'other', progress: 0 })),
          ...(state.monthly || []).map(g => ({ id: g.id, user_id: userId, type: 'monthly', name: g.name, target: g.target, current: g.current, emoji: '🎯', note: '', cat: 'other', progress: 0 })),
          ...(state.static || []).map(g => ({ id: g.id, user_id: userId, type: 'static', name: g.name, target: 100, current: g.progress, emoji: g.emoji, note: g.note || '', cat: g.cat || 'other', progress: g.progress }))
        ];
        if (goalPayloads.length > 0) {
          await supabase.from('goals').upsert(goalPayloads);
        }
      } catch (err) {
        console.warn("Failed to sync goals to Supabase:", err);
      }

      // 3b. Delete goals
      if (state.deletedIds?.goals?.length > 0) {
        try {
          const { error } = await supabase.from('goals').delete().in('id', state.deletedIds.goals);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                goals: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete goals from Supabase:", err);
        }
      }

      // 4. Sync journals
      if (state.journals && state.journals.length > 0) {
        try {
          const journalPayloads = state.journals.map(j => ({
            id: j.id,
            user_id: userId,
            title: j.title || '',
            content: typeof j.content === 'string' ? j.content : JSON.stringify(j.content)
          }));
          await supabase.from('journals').upsert(journalPayloads);
        } catch (err) {
          console.warn("Failed to sync journals to Supabase:", err);
        }
      }

      // 4b. Delete journals
      if (state.deletedIds?.journals?.length > 0) {
        try {
          const { error } = await supabase.from('journals').delete().in('id', state.deletedIds.journals);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                journals: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete journals from Supabase:", err);
        }
      }

      // 5. Sync workout routines
      if (state.workoutRoutines && state.workoutRoutines.length > 0) {
        try {
          const routinePayloads = state.workoutRoutines.map(r => ({
            id: r.id,
            user_id: userId,
            name: r.name,
            exercises: r.exercises
          }));
          await supabase.from('workout_routines').upsert(routinePayloads);
        } catch (err) {
          console.warn("Failed to sync workout routines to Supabase:", err);
        }
      }

      // 5b. Delete workout routines
      if (state.deletedIds?.workoutRoutines?.length > 0) {
        try {
          const { error } = await supabase.from('workout_routines').delete().in('id', state.deletedIds.workoutRoutines);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                workoutRoutines: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete workout routines from Supabase:", err);
        }
      }

      // 6. Sync workout logs
      if (state.workoutLogs && state.workoutLogs.length > 0) {
        try {
          const logPayloads = state.workoutLogs.map(l => ({
            id: l.id,
            user_id: userId,
            name: l.name,
            duration: l.duration || 0,
            exercises: l.exercises,
            created_at: l.created_at || new Date().toISOString()
          }));
          await supabase.from('workout_logs').upsert(logPayloads);
        } catch (err) {
          console.warn("Failed to sync workout logs to Supabase:", err);
        }
      }

      // 6b. Delete workout logs
      if (state.deletedIds?.workoutLogs?.length > 0) {
        try {
          const { error } = await supabase.from('workout_logs').delete().in('id', state.deletedIds.workoutLogs);
          if (!error && storeRef) {
            storeRef.setState({
              deletedIds: {
                ...storeRef.getState().deletedIds,
                workoutLogs: []
              }
            }, true);
          }
        } catch (err) {
          console.warn("Failed to delete workout logs from Supabase:", err);
        }
      }

      // 7. Sync profiles stats
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          streak: state.streak || 0,
          completion_history: state.completionHistory || {},
          last_active_date: state.lastActiveDate || new Date().toDateString(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Failed to sync profile to Supabase:", err);
      }

      console.log("Supabase background sync success.");
    } catch (e) {
      console.warn("Supabase background sync connection failed (will retry on next change):", e.message);
    }
  }, 2000); // 2 second debounce delay
}

/**
 * Pulls all remote state data from Supabase.
 * Returns the unified state object to update local storage.
 * Queries each table resiliently to prevent partial failures from crashing the sync.
 */
export async function pullSyncData() {
  if (!supabase) return null;

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    const userId = user.id;

    // Resilient table helper
    const fetchTable = async (table, columns = '*') => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(columns)
          .eq(table === 'profiles' ? 'id' : 'user_id', userId);
        
        if (error) {
          console.warn(`Supabase warning pulling table "${table}":`, error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.warn(`Supabase exception pulling table "${table}":`, err.message);
        return null;
      }
    };

    // Fetch from all tables in parallel with catch-all resiliency
    const [
      tasksData,
      sessionsData,
      goalsData,
      journalsData,
      routinesData,
      logsData,
      profileData
    ] = await Promise.all([
      fetchTable('tasks'),
      fetchTable('sessions'),
      fetchTable('goals'),
      fetchTable('journals'),
      fetchTable('workout_routines'),
      fetchTable('workout_logs'),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(res => res.error ? null : res.data).catch(() => null)
    ]);

    const newState = {};

    if (tasksData) {
      newState.tasks = tasksData.map(t => ({ id: t.id, name: t.name, cat: t.cat, done: t.done }));
    }
    if (sessionsData) {
      newState.sessions = sessionsData.map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, steps: s.steps, open: false }));
    }
    if (goalsData) {
      newState.weekly = goalsData.filter(g => g.type === 'weekly').map(g => ({ id: g.id, name: g.name, target: g.target, current: g.current }));
      newState.monthly = goalsData.filter(g => g.type === 'monthly').map(g => ({ id: g.id, name: g.name, target: g.target, current: g.current }));
      newState.static = goalsData.filter(g => g.type === 'static').map(g => ({ id: g.id, name: g.name, emoji: g.emoji, note: g.note, cat: g.cat, progress: g.progress }));
    }
    if (journalsData) {
      newState.journals = journalsData.map(j => ({ id: j.id, title: j.title, content: j.content }));
    }
    if (routinesData) {
      newState.workoutRoutines = routinesData.map(r => ({ id: r.id, name: r.name, exercises: r.exercises }));
    }
    if (logsData) {
      newState.workoutLogs = logsData.map(l => ({ id: l.id, name: l.name, duration: l.duration, exercises: l.exercises, created_at: l.created_at }));
    }
    if (profileData) {
      newState.streak = profileData.streak;
      newState.completionHistory = profileData.completion_history;
      newState.lastActiveDate = profileData.last_active_date;
    }

    return Object.keys(newState).length > 0 ? newState : null;
  } catch (e) {
    console.error("Error pulling data from Supabase:", e);
    return null;
  }
}
