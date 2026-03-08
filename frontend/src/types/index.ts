export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface MarkerUser {
  _id: string;
  username: string;
}

export interface Marker {
  _id: string;
  categoryId: string;
  userId: MarkerUser | string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  images: string[];
  createdAt: string;
}
