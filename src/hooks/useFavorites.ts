import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UseFavoritesReturn {
  favorites: string[];
  isLoading: boolean;
  isUpdating: boolean;
  isFavorite: (skinId: string) => boolean;
  toggleFavorite: (skinId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!session) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favoriteIds || []);
      } else if (response.status !== 401) {
        console.error('Failed to fetch favorites:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Load favorites on mount and when session changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a skin is favorited
  const isFavorite = useCallback((skinId: string) => {
    return favorites.includes(skinId);
  }, [favorites]);

  // Toggle favorite with optimistic updates
  const toggleFavorite = useCallback(async (skinId: string) => {
    if (!session) {
      console.warn('User must be logged in to manage favorites');
      return;
    }

    const wasLiked = isFavorite(skinId);
    const action = wasLiked ? 'remove' : 'add';

    setIsUpdating(true);

    // Optimistic update
    setFavorites(prev => 
      wasLiked 
        ? prev.filter(id => id !== skinId)
        : [...prev, skinId]
    );

    try {
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skinId, action }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setFavorites(prev => 
          wasLiked 
            ? [...prev, skinId]
            : prev.filter(id => id !== skinId)
        );
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to toggle favorite:', errorData.error);
        throw new Error(errorData.error || 'Failed to update favorite');
      }

      const result = await response.json();
      console.log('Favorite toggled:', result.message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // The optimistic update revert is already handled above
    } finally {
      setIsUpdating(false);
    }
  }, [session, isFavorite]);

  return {
    favorites,
    isLoading,
    isUpdating,
    isFavorite,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
} 