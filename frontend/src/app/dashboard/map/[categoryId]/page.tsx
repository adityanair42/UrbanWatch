'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Category } from '@/types';

// Load map only on client — Leaflet requires browser APIs
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-3">🗺️</div>
        <p>Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loadingCat, setLoadingCat] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && categoryId) {
      api
        .get('/categories')
        .then((res) => {
          const cat = (res.data as Category[]).find((c) => c._id === categoryId);
          if (cat) {
            setCategory(cat);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoadingCat(false));
    }
  }, [user, categoryId]);

  if (isLoading || !user || loadingCat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-gray-700">Category not found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />

      {/* Sub-header with category info */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-gray-700 transition text-sm font-medium"
        >
          ← Back
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${category.color}22` }}
        >
          {category.icon}
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900 text-sm leading-tight truncate">{category.name}</h1>
          <p className="text-xs text-gray-400 truncate">{category.description}</p>
        </div>
        <div className="ml-auto text-xs text-gray-400 italic hidden sm:block">
          Click anywhere on the map to add a marker
        </div>
      </div>

      {/* Map fills the remaining space */}
      <div className="flex-1 min-h-0">
        <MapComponent
          categoryId={categoryId}
          categoryName={category.name}
          categoryColor={category.color}
        />
      </div>
    </div>
  );
}
