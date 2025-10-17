'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Vérifie si l'utilisateur est connecté
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login'); // redirige si non connecté
      } else {
        setUser(session.user);
      }

      setSessionChecked(true); // on a vérifié
    };

    checkSession();
  }, [router]);

  if (!sessionChecked) return null; // ou un spinner

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bienvenue {user?.email}</h1>
      {/* ... le reste de ta checklist ici ... */}
      <button
        className="text-sm text-blue-600 underline mb-4 float-right"
        onClick={async () => { 
          router.push('/checklist');
        }}
        
      >
        Checklist
      </button>



    </main>
  );
}
