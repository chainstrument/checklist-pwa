"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function SidebarMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Burger button */}
      <button
        className="md:hidden p-2 rounded focus:outline-none"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <nav className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-lg font-bold">Menu</span>
          <button className="p-2" aria-label="Fermer" onClick={() => setOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col gap-2 p-4">
          <li><Link href="/" className="block py-2 px-3 rounded hover:bg-gray-100 text-black" onClick={() => setOpen(false)}>🏠 Accueil</Link></li>
          <li><Link href="/checklist" className="block py-2 px-3 rounded hover:bg-gray-100 text-black" onClick={() => setOpen(false)}>✅ Checklist</Link></li>
          <li><Link href="/habits" className="block py-2 px-3 rounded hover:bg-gray-100 text-black" onClick={() => setOpen(false)}>🔁 Habits</Link></li>
          <li><Link href="/habits/view" className="block py-2 px-3 rounded hover:bg-gray-100 text-black" onClick={() => setOpen(false)}>📅 Vue calendrier</Link></li>
          <li><Link href="/habits/manage" className="block py-2 px-3 rounded hover:bg-gray-100 text-black" onClick={() => setOpen(false)}>⚙️ Gérer habitudes</Link></li>
        </ul>
      </nav>
    </>
  );
}
