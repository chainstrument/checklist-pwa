"use client";

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

function todayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

type Habit = {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
};

export default function HabitsPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchHabits(session.user.id);
      }
      setSessionChecked(true);
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHabits = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) {
      setHabits(data || []);
      fetchCounts(userId, data || []);
    }
    setLoading(false);
  };

  const fetchCounts = async (userId: string, habitsList: Habit[]) => {
    const day = todayDateString();
    if (habitsList.length === 0) {
      setCounts({});
      return;
    }
    const habitIds = habitsList.map(h => h.id);
    const { data, error } = await supabase
      .from('habit_events')
      .select('habit_id, count')
      .eq('user_id', userId)
      .eq('event_date', day);
    const countMap: Record<number, number> = {};
    if (!error && data) {
      for (const row of data) {
        countMap[row.habit_id] = (countMap[row.habit_id] || 0) + (row.count || 1);
      }
    }
    setCounts(countMap);
  };

  const handlePlus = async (habit: Habit) => {
    if (!user) return;
    const day = todayDateString();
    // Insert a new event (one row per click)
    await supabase
      .from('habit_events')
      .insert({ habit_id: habit.id, user_id: user.id, event_date: day, count: 1 });
    fetchCounts(user.id, habits);
  };

  const handleMinus = async (habit: Habit) => {
    if (!user) return;
    const day = todayDateString();
    // Find the latest event for this habit/date/user and delete it (if any)
    const { data, error } = await supabase
      .from('habit_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('habit_id', habit.id)
      .eq('event_date', day)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!error && data) {
      await supabase
        .from('habit_events')
        .delete()
        .eq('id', data.id);
      fetchCounts(user.id, habits);
    }
  };

  if (!sessionChecked) return null;

  return (
    <>
      <Header />
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mes habitudes</h1>
        <section>
          <h2 className="text-xl font-semibold mb-2">Aujourd&apos;hui ({todayDateString()})</h2>
          {loading && <div className="text-gray-500 mb-2">Chargement...</div>}
          <ul>
            {habits.length === 0 && <li className="text-gray-500">Aucune habitude définie.</li>}
            {habits.map((habit) => (
              <li key={habit.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{habit.name}</div>
                  {habit.description && <div className="text-sm text-gray-600">{habit.description}</div>}
                  <div className="text-sm text-gray-600">Fait: {counts[habit.id] || 0} fois</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 shadow-sm transition"
                    title="Retirer une validation"
                    onClick={() => handleMinus(habit)}
                    disabled={!counts[habit.id]}
                  >
                    <span role="img" aria-label="moins">➖</span>
                  </button>
                  <button
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 shadow-sm transition"
                    title="Ajouter une validation"
                    onClick={() => handlePlus(habit)}
                  >
                    <span role="img" aria-label="plus">➕</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
