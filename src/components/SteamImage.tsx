import React, { useState } from 'react';
import Image from 'next/image';
import { getSteamIconUrl, getFallbackImageUrl, getAlternativeSteamIconUrl, getAllSteamIconUrls } from '../lib/utils';

interface SteamImageProps {
  iconPath: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export function SteamImage({ iconPath, alt, className, sizes }: SteamImageProps) {
  const [currentSrc, setCurrentSrc] = useState(getSteamIconUrl(iconPath));
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbackUrls = getAllSteamIconUrls(iconPath);

  const handleError = () => {
    console.log('Image failed to load:', currentSrc);
    
    if (fallbackIndex < fallbackUrls.length - 1) {
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackUrls[nextIndex]);
      console.log('Trying fallback URL:', fallbackUrls[nextIndex]);
    } else {
      console.log('All Steam URLs failed, using final fallback');
      setCurrentSrc(getFallbackImageUrl());
      setHasError(true);
    }
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', currentSrc);
    setHasError(false);
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={handleError}
      onLoad={handleLoad}
      priority={false}
    />
  );
} 