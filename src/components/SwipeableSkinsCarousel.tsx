'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSteamIconUrl, getFallbackImageUrl, getAllSteamIconUrls } from '../lib/utils';

interface Skin {
  id: string;
  name: string;
  price: number;
  iconPath: string;
  type: string;
  rarity: string;
}

interface SteamImageProps {
  iconPath: string;
  alt: string;
  className?: string;
  sizes?: string;
}

function SteamImage({ iconPath, alt, className, sizes }: SteamImageProps) {
  const [currentSrc, setCurrentSrc] = useState(getSteamIconUrl(iconPath));
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbackUrls = getAllSteamIconUrls(iconPath);

  const handleError = () => {
    if (fallbackIndex < fallbackUrls.length - 1) {
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackUrls[nextIndex]);
    } else {
      setCurrentSrc(getFallbackImageUrl());
      setHasError(true);
    }
  };

  const handleLoad = () => {
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

interface SwipeableSkinsCarouselProps {
  skins: Skin[];
  loading: boolean;
}

export default function SwipeableSkinsCarousel({ skins, loading }: SwipeableSkinsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  const getItemsPerView = () => {
    if (typeof window === 'undefined') return itemsPerView.desktop;
    if (window.innerWidth < 768) return itemsPerView.mobile;
    if (window.innerWidth < 1024) return itemsPerView.tablet;
    return itemsPerView.desktop;
  };

  const [itemsVisible, setItemsVisible] = useState(getItemsPerView());

  useEffect(() => {
    const handleResize = () => {
      setItemsVisible(getItemsPerView());
      setCurrentIndex(0);
      setTranslateX(0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, skins.length - itemsVisible);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    const maxTranslate = maxIndex * (100 / itemsVisible);
    
    const newTranslateX = Math.max(
      Math.min(translateX + (diff / window.innerWidth) * 100, maxTranslate),
      0
    );
    
    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const newIndex = Math.round(translateX / (100 / itemsVisible));
    setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
    setTranslateX(newIndex * (100 / itemsVisible));
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    const maxTranslate = maxIndex * (100 / itemsVisible);
    
    const newTranslateX = Math.max(
      Math.min(translateX + (diff / window.innerWidth) * 100, maxTranslate),
      0
    );
    
    setTranslateX(newTranslateX);
  };

  const handleMouseEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const newIndex = Math.round(translateX / (100 / itemsVisible));
    setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
    setTranslateX(newIndex * (100 / itemsVisible));
  };

  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
    setTranslateX(clampedIndex * (100 / itemsVisible));
  };

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#23262F] rounded-2xl p-6 animate-pulse">
            <div className="w-full h-48 bg-gray-700 rounded-xl mb-4 skeleton"></div>
            <div className="w-3/4 h-6 bg-gray-700 rounded mb-2 skeleton"></div>
            <div className="w-1/2 h-4 bg-gray-700 rounded skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Grid View */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8">
        {skins.map((skin) => (
          <SkinCard key={skin.id} skin={skin} />
        ))}
      </div>

      {/* Mobile/Tablet Carousel */}
      <div className="lg:hidden relative overflow-hidden">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-out mobile-optimized"
          style={{
            transform: `translateX(-${translateX}%)`,
            width: `${(skins.length / itemsVisible) * 100}%`
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseEnd}
          onMouseLeave={handleMouseEnd}
        >
          {skins.map((skin) => (
            <div
              key={skin.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / skins.length}%` }}
            >
              <SkinCard skin={skin} />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {skins.length > itemsVisible && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all duration-200 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all duration-200 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {skins.length > itemsVisible && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-blue-400 w-6'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Skin Card Component
function SkinCard({ skin }: { skin: Skin }) {
  return (
    <Link href={`/skins/${skin.id}`} className="block group">
      <div className="bg-[#23262F] rounded-2xl overflow-hidden border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105 hover-lift">
        <div className="relative w-full h-48 bg-[#181A20] flex items-center justify-center overflow-hidden">
          <SteamImage
            iconPath={skin.iconPath}
            alt={skin.name}
            className="object-contain group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${
              skin.rarity === 'Covert' ? 'bg-red-900/30 text-red-300' :
              skin.rarity === 'Classified' ? 'bg-purple-900/30 text-purple-300' :
              skin.rarity === 'Restricted' ? 'bg-blue-900/30 text-blue-300' :
              skin.rarity === 'Contraband' ? 'bg-yellow-900/30 text-yellow-300' :
              'bg-gray-900/30 text-gray-300'
            }`}>
              {skin.rarity}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors mobile-text">
            {skin.name}
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{skin.type}</span>
            <span className="text-xl font-bold text-green-400">
              ${skin.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 