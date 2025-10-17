'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import Header from '@/components/Header';


export default function ChecklistPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  type ChecklistItem = { id: number; text: string; checked?: boolean; created_at?: string };

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchItems(session.user.id);
      }

      setSessionChecked(true);
    };

    checkSession();
  }, [router]);

  const fetchItems = async (userId: string) => {
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setItems(data || []);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    if (!user) return;

    const { data, error } = await supabase
      .from('checklist')
      .insert({ text: newItem, user_id: user.id })
      .select()
      .single();

    if (!error) {
      setItems([data, ...items]);
      setNewItem('');
    }
  };

  // toggleItem removed because not yet wired to UI

const handleDelete = (id: number, text: string) => {
  if (confirm(`Voulez-vous vraiment supprimer "${text}" ?`)) {
    deleteItem(id);
  }
};

   async function deleteItem(id: number) {
    const { error } = await supabase
      .from('checklist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression:', error.message);
    } else {
      // Mise à jour locale après suppression
      setItems(prev => prev.filter(item => item.id !== id));
    }
  }


  if (!sessionChecked) return null;

  return (
    <>
          <Header />
     <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ma checklist</h1>

     

      <input
        className="w-full border p-2 mb-2"
        placeholder="Nouvel item..."
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addItem()}
      />
      <button onClick={addItem} className="bg-blue-600 text-white w-full py-2 mb-4 rounded">
        Ajouter
      </button>

      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center py-2 border-b">
            {/* Groupe checkbox + texte */}
                <div className="flex items-center gap-2">
                    <input type="checkbox" id={`item-${item.id}`} className="w-4 h-4" />
                    <label htmlFor={`item-${item.id}`} className="select-none">
                    {item.text}
                    </label>
                </div>
             <button
             onClick={() => handleDelete(item.id, item.text)} 
              className="ml-4 text-red-600 hover:underline"
              aria-label={`Supprimer ${item.text}`}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
    </>
   
  );
}
