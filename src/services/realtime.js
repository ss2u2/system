import { supabase } from './supabase';
import { store } from './db';

let realtimeChannel = null;

export function setupRealtimeSubscription(userId) {
  if (!supabase || realtimeChannel) return;

  console.log('Setting up Supabase Realtime subscription for user:', userId);

  realtimeChannel = supabase.channel(`realtime-db-changes-${userId}`);

  // Helper to handle updates for standard tables
  const handleTableChange = (table, stateKey, mapRow = row => row) => {
    realtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: table },
      (payload) => {
        // Safe check for user ID ownership (realtime RLS policies filter this automatically, but extra check is good)
        if (payload.new && payload.new.user_id && payload.new.user_id !== userId) return;
        if (payload.old && payload.old.user_id && payload.old.user_id !== userId) return;

        const currentState = store.getState();
        const currentItems = currentState[stateKey] || [];

        if (payload.eventType === 'INSERT') {
          const newItem = mapRow(payload.new);
          if (!currentItems.some(item => item.id === newItem.id)) {
            store.setState({ [stateKey]: [...currentItems, newItem] }, true);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = mapRow(payload.new);
          const updatedItems = currentItems.map(item =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          );
          if (!currentItems.some(item => item.id === updatedItem.id)) {
            updatedItems.push(updatedItem);
          }
          store.setState({ [stateKey]: updatedItems }, true);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          const updatedItems = currentItems.filter(item => item.id !== deletedId);
          store.setState({ [stateKey]: updatedItems }, true);
        }
      }
    );
  };

  // 1. Subscribe to Tasks
  handleTableChange('tasks', 'tasks', row => ({
    id: row.id,
    name: row.name,
    cat: row.cat,
    done: row.done
  }));

  // 2. Subscribe to Sessions
  handleTableChange('sessions', 'sessions', row => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    steps: row.steps,
    open: false // Default open state to false when fetched/synced
  }));

  // 3. Subscribe to Workout Routines
  handleTableChange('workout_routines', 'workoutRoutines', row => ({
    id: row.id,
    name: row.name,
    exercises: row.exercises
  }));

  // 4. Subscribe to Workout Logs
  handleTableChange('workout_logs', 'workoutLogs', row => ({
    id: row.id,
    name: row.name,
    duration: row.duration,
    exercises: row.exercises,
    created_at: row.created_at
  }));

  // 5. Subscribe to Journals
  handleTableChange('journals', 'journals', row => ({
    id: row.id,
    title: row.title,
    content: row.content
  }));

  // 6. Subscribe to Goals (requires custom split since they populate weekly, monthly, or static in state)
  realtimeChannel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'goals' },
    (payload) => {
      if (payload.new && payload.new.user_id && payload.new.user_id !== userId) return;
      if (payload.old && payload.old.user_id && payload.old.user_id !== userId) return;

      const currentState = store.getState();
      
      const getTargetListKey = (type) => {
        if (type === 'weekly') return 'weekly';
        if (type === 'monthly') return 'monthly';
        if (type === 'static') return 'static';
        return null;
      };

      const mapGoal = (row) => {
        if (row.type === 'static') {
          return {
            id: row.id,
            name: row.name,
            emoji: row.emoji,
            note: row.note,
            cat: row.cat,
            progress: row.progress || 0
          };
        }
        return {
          id: row.id,
          name: row.name,
          target: row.target,
          current: row.current
        };
      };

      if (payload.eventType === 'INSERT') {
        const row = payload.new;
        const listKey = getTargetListKey(row.type);
        if (!listKey) return;
        const items = currentState[listKey] || [];
        const newItem = mapGoal(row);
        if (!items.some(item => item.id === newItem.id)) {
          store.setState({ [listKey]: [...items, newItem] }, true);
        }
      } else if (payload.eventType === 'UPDATE') {
        const row = payload.new;
        const listKey = getTargetListKey(row.type);
        if (!listKey) return;
        const items = currentState[listKey] || [];
        const updatedItem = mapGoal(row);
        const updatedItems = items.map(item =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        );
        if (!items.some(item => item.id === updatedItem.id)) {
          updatedItems.push(updatedItem);
        }
        store.setState({ [listKey]: updatedItems }, true);
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        // Since we don't receive type on delete (unless replica identity is FULL),
        // we can filter out from weekly, monthly, and static goals safely since IDs are unique.
        store.setState({
          weekly: (currentState.weekly || []).filter(item => item.id !== deletedId),
          monthly: (currentState.monthly || []).filter(item => item.id !== deletedId),
          static: (currentState.static || []).filter(item => item.id !== deletedId)
        }, true);
      }
    }
  );

  // 7. Subscribe to Profiles (Updates streak, completionHistory, and lastActiveDate)
  realtimeChannel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => {
      if (payload.new && payload.new.id !== userId) return;
      if (payload.old && payload.old.id !== userId) return;

      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const row = payload.new;
        store.setState({
          streak: row.streak,
          completionHistory: row.completion_history,
          lastActiveDate: row.last_active_date
        }, true);
      }
    }
  );

  realtimeChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime database changes subscribed successfully.');
    } else {
      console.warn('Realtime channel subscription status change:', status);
    }
  });
}

export function cleanupRealtimeSubscription() {
  if (realtimeChannel) {
    console.log('Cleaning up Supabase Realtime subscription...');
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}
