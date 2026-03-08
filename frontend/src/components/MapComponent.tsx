'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Marker as MarkerType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

// Fix Leaflet's broken default icon in webpack/Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColoredIcon = (color: string) =>
  L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -28],
  });

interface MapComponentProps {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
}

interface PendingMarker {
  lat: number;
  lng: number;
}

interface FormData {
  title: string;
  description: string;
  images: File[];
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent({ categoryId, categoryName, categoryColor }: MapComponentProps) {
  const { user } = useAuth();
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [pending, setPending] = useState<PendingMarker | null>(null);
  const [form, setForm] = useState<FormData>({ title: '', description: '', images: [] });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const coloredIcon = createColoredIcon(categoryColor);

  const fetchMarkers = useCallback(async () => {
    try {
      const res = await api.get(`/markers?categoryId=${categoryId}`);
      setMarkers(res.data);
    } catch {
      // silently fail — map still usable
    }
  }, [categoryId]);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  const handleMapClick = (lat: number, lng: number) => {
    setPending({ lat, lng });
    setForm({ title: '', description: '', images: [] });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setSubmitting(true);
    setFormError('');

    const fd = new FormData();
    fd.append('categoryId', categoryId);
    fd.append('lat', pending.lat.toString());
    fd.append('lng', pending.lng.toString());
    fd.append('title', form.title);
    fd.append('description', form.description);
    form.images.forEach((img) => fd.append('images', img));

    try {
      await api.post('/markers', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchMarkers();
      setPending(null);
    } catch {
      setFormError('Failed to add marker. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (markerId: string) => {
    if (!confirm('Delete this marker?')) return;
    try {
      await api.delete(`/markers/${markerId}`);
      setMarkers((prev) => prev.filter((m) => m._id !== markerId));
    } catch {
      alert('Failed to delete marker.');
    }
  };

  const getMarkerId = (marker: MarkerType): string => {
    if (typeof marker.userId === 'string') return marker.userId;
    return marker.userId._id;
  };

  const getMarkerUsername = (marker: MarkerType): string => {
    if (typeof marker.userId === 'string') return 'Unknown';
    return marker.userId.username;
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />

        {markers.map((marker) => (
          <Marker key={marker._id} position={[marker.lat, marker.lng]} icon={coloredIcon}>
            <Popup minWidth={220}>
              <div>
                <p className="font-bold text-base leading-tight">{marker.title}</p>
                {marker.description && (
                  <p className="text-gray-600 text-sm mt-1">{marker.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">By {getMarkerUsername(marker)}</p>

                {marker.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {marker.images.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={`${backendUrl}/uploads/${img}`}
                        alt={`Marker image ${i + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                {user && getMarkerId(marker) === user.id && (
                  <button
                    onClick={() => handleDelete(marker._id)}
                    className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-medium transition"
                  >
                    Delete Marker
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Add Marker Modal — rendered on top of the map */}
      {pending && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-0.5">Add {categoryName} Marker</h2>
            <p className="text-xs text-gray-400 mb-4">
              {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
            </p>

            {formError && (
              <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg mb-3">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Large pothole near intersection"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Additional details about this issue..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos <span className="text-gray-400 font-normal">(up to 5, max 5 MB each)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 5);
                    setForm((p) => ({ ...p, images: files }));
                  }}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {form.images.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{form.images.length} file(s) selected</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition"
                  style={{ backgroundColor: submitting ? '#9CA3AF' : categoryColor }}
                >
                  {submitting ? 'Adding...' : 'Add Marker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
