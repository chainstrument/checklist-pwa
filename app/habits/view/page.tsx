"use client";

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function HabitView() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string>(formatDate(now));

  const [dayTotals, setDayTotals] = useState<Record<string, number>>({});
  type HabitRow = { id: number; name: string; done_count: number; day: string; created_at?: string };
  type AggregateRow = { day: string; done_count: number };
  const [dayTasks, setDayTasks] = useState<HabitRow[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchMonthTotals(session.user.id, year, month);
        fetchTasksForDay(session.user.id, selectedDay);
      }
      setSessionChecked(true);
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMonthTotals(user.id, year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, user]);

  useEffect(() => {
    if (!user) return;
    fetchTasksForDay(user.id, selectedDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, user]);

  const fetchMonthTotals = async (userId: string, y: number, m: number) => {
    const start = formatDate(startOfMonth(y, m));
    const end = formatDate(endOfMonth(y, m));

    // aggregate sums by day
    const { data, error } = await supabase
      .from('habits_task')
      .select('day, done_count')
      .eq('user_id', userId)
      .gte('day', start)
      .lte('day', end);

    if (error) {
      console.error('Erreur fetchMonthTotals', error.message || error);
      return;
    }

    const totals: Record<string, number> = {};
    (data || []).forEach((row: AggregateRow) => {
      const d = row.day;
      totals[d] = (totals[d] || 0) + (row.done_count || 0);
    });

    setDayTotals(totals);
  };

  const fetchTasksForDay = async (userId: string, day: string) => {
    const { data, error } = await supabase
      .from('habits_task')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur fetchTasksForDay', error.message || error);
      return;
    }

  setDayTasks((data as HabitRow[]) || []);
  };

  if (!sessionChecked) return null;

  const firstDay = startOfMonth(year, month);
  const lastDay = endOfMonth(year, month);
  const daysInMonth = lastDay.getDate();

  return (
    <>
      <Header />
      <main className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Vue Habits - {year} / {month + 1}</h1>

        <div className="flex items-center gap-2 mb-4">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => {
              const prev = new Date(year, month - 1, 1);
              setYear(prev.getFullYear());
              setMonth(prev.getMonth());
            }}
          >
            ←
          </button>
          <div className="font-medium">{year} - {month + 1}</div>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => {
              const nxt = new Date(year, month + 1, 1);
              setYear(nxt.getFullYear());
              setMonth(nxt.getMonth());
            }}
          >
            →
          </button>
          <button className="ml-4 px-3 py-1 border rounded" onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelectedDay(formatDate(d)); }}>Aujourd&apos;hui</button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {/* Weekday headers */}
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((w) => (
            <div key={w} className="text-center text-sm font-semibold">{w}</div>
          ))}

          {/* blank cells for offset */}
          {Array.from({ length: (firstDay.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = formatDate(new Date(year, month, dayNum));
            const total = dayTotals[dateStr] || 0;
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={dateStr}
                className={`p-2 border rounded text-sm ${isSelected ? 'bg-blue-100' : ''}`}
                onClick={() => setSelectedDay(dateStr)}
              >
                <div className="font-medium">{dayNum}</div>
                <div className="text-xs text-gray-600">{total} fois</div>
              </button>
            );
          })}
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-2">Détails pour {selectedDay}</h2>
          {dayTasks.length === 0 && <div className="text-gray-500">Aucune tâche pour ce jour.</div>}
          <ul>
            {dayTasks.map((t) => (
              <li key={t.id} className="py-2 border-b flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-600">Fait: {t.done_count || 0} fois</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
