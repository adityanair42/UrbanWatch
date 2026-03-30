'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Category } from '@/types';

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', icon: '📍', color: '#3B82F6' });
  const [adding, setAdding] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api
        .get('/categories')
        .then((res) => setCategories(res.data))
        .catch(() => {})
        .finally(() => setLoadingCats(false));
    }
  }, [user]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setModalError('');
    try {
      const res = await api.post('/categories', newCat);
      setCategories((prev) => [...prev, res.data]);
      setShowModal(false);
      setNewCat({ name: '', description: '', icon: '📍', color: '#3B82F6' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setModalError(axiosErr.response?.data?.message || 'Failed to add category.');
    } finally {
      setAdding(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError('');
    setNewCat({ name: '', description: '', icon: '📍', color: '#3B82F6' });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issue Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Select a category to open its map and report or view issues.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap"
          >
            + Add Issue Type
          </button>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🗂️</div>
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-1">Add your first issue type to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => router.push(`/dashboard/map/${cat._id}`)}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition text-left border border-gray-100 hover:border-gray-200 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}22` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {cat.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>
                  </div>
                </div>
                <div
                  className="mt-3 h-1 rounded-full w-full opacity-40"
                  style={{ backgroundColor: cat.color }}
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Issue Type</h2>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCat.name}
                  onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Broken Sidewalk"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={newCat.description}
                  onChange={(e) => setNewCat((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description of this issue type"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
                  <input
                    type="text"
                    value={newCat.icon}
                    onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="📍"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCat((p) => ({ ...p, color: c }))}
                        className="w-6 h-6 rounded-full border-2 transition"
                        style={{
                          backgroundColor: c,
                          borderColor: newCat.color === c ? '#1D4ED8' : 'transparent',
                          outline: newCat.color === c ? '2px solid #BFDBFE' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition"
                >
                  {adding ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
