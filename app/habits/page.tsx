"use client";

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

function todayDateString() {
  const d = new Date();
  // format YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export default function HabitsPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  type HabitTask = { id: number; name: string; done_count: number; day: string; created_at?: string };

  const [user, setUser] = useState<User | null>(null);
  const [taskName, setTaskName] = useState("Faire 10 push up");
  const [tasks, setTasks] = useState<HabitTask[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchTodayTasks(session.user.id);
      }

      setSessionChecked(true);
    };

    checkSession();
  }, [router]);

  const fetchTodayTasks = async (userId: string) => {
    const day = todayDateString();
    const { data, error } = await supabase
      .from('habits_task')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .order('created_at', { ascending: false });

    if (!error) setTasks(data || []);
  };

  const validateTask = async () => {
    if (!taskName.trim()) return;
    const day = todayDateString();
    if (!user) return;

    // Try to find existing task for this user/day/name
    const { data: existing, error: selectError } = await supabase
      .from('habits_task')
      .select('*')
      .eq('user_id', user.id)
      .eq('day', day)
      .eq('name', taskName)
      .limit(1)
      .single();

    if (selectError && (selectError as { code?: string }).code !== 'PGRST116') {
      // PGRST116 is 'No rows found' from PostgREST in some setups; ignore absence
      console.error('Erreur lecture habits_task:', selectError.message || selectError);
    }

    if (existing) {
      // Update incrementing `do`
      const { error } = await supabase
        .from('habits_task')
        .update({ done_count: (existing.done_count || 0) + 1 })
        .eq('id', existing.id)
        .select();

      if (!error) {
        fetchTodayTasks(user.id);
      } else {
        console.error('Erreur update done_count:', error.message);
      }
    } else {
      // Insert new task with do = 1
      const { error } = await supabase
        .from('habits_task')
        .insert({ name: taskName, user_id: user.id, day, done_count: 1 })
        .select();

      if (!error) {
        fetchTodayTasks(user.id);
      } else {
        console.error('Erreur insert habits_task:', error.message);
      }
    }
  };

  if (!sessionChecked) return null;

  return (
    <>
      <Header />
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Habits</h1>

        <div className="mb-4">
          <label className="block mb-2">Tâche</label>
          <input
            className="w-full border p-2 mb-2"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <button onClick={validateTask} className="bg-green-600 text-white w-full py-2 rounded">
            Valider
          </button>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-2">Aujourd&apos;hui ({todayDateString()})</h2>
          <ul>
            {tasks.length === 0 && <li className="text-gray-500">Aucune habitude validée aujourd&apos;hui.</li>}
            {tasks.map((t) => (
              <li key={t.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-600">Fait: {t.done_count || 0} fois</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-sm text-yellow-600 hover:underline"
                    onClick={async () => {
                      // decrement but not below 0
                      if (!user) return;
                      const newVal = Math.max(0, (t.done_count || 0) - 1);
                      const { error } = await supabase
                        .from('habits_task')
                        .update({ done_count: newVal })
                        .eq('id', t.id)
                        .select()
                        .single();

                      if (!error && user) fetchTodayTasks(user.id);
                    }}
                  >
                    -1
                  </button>

                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={async () => {
                      // quick increment
                      if (!user) return;
                      const { error } = await supabase
                        .from('habits_task')
                        .update({ done_count: (t.done_count || 0) + 1 })
                        .eq('id', t.id)
                        .select()
                        .single();

                      if (!error && user) fetchTodayTasks(user.id);
                    }}
                  >
                    +1
                  </button>

                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={async () => {
                      if (!confirm(`Voulez-vous supprimer "${t.name}" ?`)) return;
                      const { error } = await supabase
                        .from('habits_task')
                        .delete()
                        .eq('id', t.id);

                      if (!error && user) fetchTodayTasks(user.id);
                    }}
                  >
                    Supprimer
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
