'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition">
        🗺️ CivicMap
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">
            Hello, <span className="font-semibold text-gray-800">{user.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-lg font-medium transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
