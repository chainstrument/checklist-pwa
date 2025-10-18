"use client";

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

type Habit = {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
};

export default function ManageHabitsPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
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
    if (!error) setHabits(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from('habits')
      .insert({ name: newName, description: newDesc, user_id: user.id });
    setNewName("");
    setNewDesc("");
    if (!error) fetchHabits(user.id);
    setLoading(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!user) return;
    if (!confirm(`Supprimer l'habitude "${name}" ?`)) return;
    setLoading(true);
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);
    if (!error) fetchHabits(user.id);
    setLoading(false);
  };

  const startEdit = (habit: Habit) => {
    setEditId(habit.id);
    setEditName(habit.name);
    setEditDesc(habit.description || "");
  };

  const handleEdit = async () => {
    if (!user || !editId || !editName.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from('habits')
      .update({ name: editName, description: editDesc })
      .eq('id', editId);
    setEditId(null);
    setEditName("");
    setEditDesc("");
    if (!error) fetchHabits(user.id);
    setLoading(false);
  };

  if (!sessionChecked) return null;

  return (
    <>
      <Header />
      <main className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Gérer mes habitudes</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Ajouter une habitude</h2>
          <input
            className="w-full border p-2 mb-2"
            placeholder="Nom de l'habitude"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            disabled={loading}
          />
          <input
            className="w-full border p-2 mb-2"
            placeholder="Description (optionnelle)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            Ajouter
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-2">Mes habitudes</h2>
        {loading && <div className="text-gray-500 mb-2">Chargement...</div>}
        <ul>
          {habits.map(habit => (
            <li key={habit.id} className="py-2 border-b flex justify-between items-center">
              {editId === habit.id ? (
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    className="border p-1"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    disabled={loading}
                  />
                  <input
                    className="border p-1"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    disabled={loading}
                  />
                  <div className="flex gap-2 mt-1">
                    <button onClick={handleEdit} className="text-green-600 underline" disabled={loading}>Valider</button>
                    <button onClick={() => setEditId(null)} className="text-gray-600 underline" disabled={loading}>Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium">{habit.name}</div>
                    {habit.description && <div className="text-sm text-gray-600">{habit.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(habit)} className="text-blue-600 underline" disabled={loading}>Modifier</button>
                    <button onClick={() => handleDelete(habit.id, habit.name)} className="text-red-600 underline" disabled={loading}>Supprimer</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}