'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Item = {
  id: string;
  text: string;
  checked: boolean;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) setItems(data);
  }

  async function addItem() {
    if (!newItem.trim()) return;
    const { data, error } = await supabase
      .from('checklist')
      .insert({ text: newItem })
      .select()
      .single();

    if (data) {
      setItems([...items, data]);
      setNewItem('');
    }
  }

  async function toggleCheck(item: Item) {
    await supabase
      .from('checklist')
      .update({ checked: !item.checked })
      .eq('id', item.id);
    fetchItems();
  }

  async function deleteItem(id: string) {
    await supabase.from('checklist').delete().eq('id', id);
    fetchItems();
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">📝 Ma Checklist</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Nouvelle tâche"
          className="flex-grow border rounded px-2 py-1"
        />
        <button onClick={addItem} className="bg-blue-600 text-white px-3 py-1 rounded">
          Ajouter
        </button>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheck(item)}
              />
              <span className={item.checked ? 'line-through text-gray-500' : ''}>
                {item.text}
              </span>
            </label>
            <button onClick={() => deleteItem(item.id)} className="text-red-500">
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
