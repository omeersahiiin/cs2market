import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface FavoriteButtonProps {
  skinId: string;
  initialFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({ skinId, initialFavorited = false, onToggle }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link click propagation
    e.stopPropagation();
    
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsAnimating(true);
    
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skinId }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        onToggle?.(!isFavorited);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-full transition-all duration-300 ${
        isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      }`}
    >
      <svg
        className={`w-6 h-6 transform ${isAnimating ? 'scale-125' : 'scale-100'} transition-transform duration-300`}
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
} 