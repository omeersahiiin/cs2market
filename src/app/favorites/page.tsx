'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SteamImage } from '@/components/SteamImage';
import FavoriteButton from '@/components/FavoriteButton';

interface Skin {
  id: string;
  name: string;
  price: number;
  iconPath: string;
  type: string;
  rarity: string;
  volume24h?: number;
}

interface Favorite {
  id: string;
  skinId: string;
  skin: Skin;
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session) {
        window.location.href = '/api/auth/signin';
        return;
      }

      try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        setFavorites(data.favorites);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  const handleRemoveFavorite = (skinId: string) => {
    setFavorites(prev => prev.filter(fav => fav.skinId !== skinId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8">Your Favorites</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#23262F] rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg skeleton"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-700 rounded mb-2 skeleton"></div>
                    <div className="w-20 h-3 bg-gray-700 rounded skeleton"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-700 rounded skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Your Favorites</h1>
          <Link
            href="/skins"
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            Browse All Skins
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Favorites Yet</h2>
            <p className="text-gray-400 mb-8">Start adding skins to your favorites to track them easily.</p>
            <Link
              href="/skins"
              className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              Browse Skins
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(({ skin }) => (
              <Link key={skin.id} href={`/skins/${skin.id}`} className="block group">
                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 hover:bg-[#2A2D3A]">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 bg-[#181A20] rounded-lg flex items-center justify-center overflow-hidden">
                      <SteamImage
                        iconPath={skin.iconPath}
                        alt={skin.name}
                        className="object-contain group-hover:scale-110 transition-transform duration-300"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                        {skin.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{skin.type}</p>
                      <div className="mt-2">
                        <span className="text-green-400 font-bold">${skin.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <FavoriteButton
                      skinId={skin.id}
                      initialFavorited={true}
                      onToggle={(isFavorited) => {
                        if (!isFavorited) {
                          handleRemoveFavorite(skin.id);
                        }
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 