'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import SidebarMenu from './SidebarMenu';

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user.email || null);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b mb-4">
      {/* Menu burger sur mobile */}
      <SidebarMenu />
      {/* Liens classiques sur desktop */}
      <div className="gap-6 hidden md:flex items-center">
        <Link href="/" className="text-lg font-semibold text-gray-700 hover:text-blue-600">
          Accueil
        </Link>
        <Link href="/checklist" className="text-lg font-semibold text-blue-600 hover:underline">
          ✅  
        </Link>
        <Link href="/habits" className="text-lg font-semibold text-blue-600 hover:underline">
          🔁  
        </Link>
        <Link href="/habits/view" className="text-lg font-semibold text-blue-600 hover:underline">
          📅  
        </Link>
        <Link href="/habits/manage" className="text-lg font-semibold text-blue-600 hover:underline">
          ⚙️  
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 underline"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
