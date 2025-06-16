'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getSteamIconUrl, getFallbackImageUrl, getAlternativeSteamIconUrl, getAllSteamIconUrls } from '../lib/utils';
import SwipeableSkinsCarousel from '@/components/SwipeableSkinsCarousel';
import LazySection from '@/components/LazySection';
import { SteamImage } from '@/components/SteamImage';
import GunTypeFilter from '@/components/GunTypeFilter';
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

interface MarketStats {
  totalSkins: number;
  totalVolume: number;
  activeTraders: number;
  avgPrice: number;
}

interface TradingActivity {
  id: string;
  skinName: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: Date;
}

// Animated Background Particles Component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}

// Live Trading Activity Ticker
function TradingTicker({ activities }: { activities: TradingActivity[] }) {
  return (
    <div className="bg-[#181A20] border-b border-[#2A2D3A] py-3 overflow-hidden">
      <div className="flex animate-scroll-left whitespace-nowrap">
        {activities.concat(activities).map((activity, index) => (
          <div key={`${activity.id}-${index}`} className="flex items-center mx-8 text-sm">
            <span className={`w-2 h-2 rounded-full mr-2 ${activity.priceChangePercent >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className="text-gray-300 mr-2">{activity.skinName}</span>
            <span className="text-gray-300 mr-2">${activity.price.toLocaleString()}</span>
            <span className={`font-semibold ${activity.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {activity.priceChangePercent >= 0 ? '↗' : '↘'} {activity.priceChangePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Testimonials Component
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Alex Chen",
      role: "Professional Trader",
      content: "The most advanced CS2 trading platform I've used. The derivatives features are game-changing.",
      avatar: "AC",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      role: "Skin Collector",
      content: "Finally, a platform that treats CS2 skins like real financial instruments. Love the analytics!",
      avatar: "SJ",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Day Trader",
      content: "Lightning-fast execution and professional-grade tools. This is the future of skin trading.",
      avatar: "MR",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-[#0F1419] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Trusted by Professional Traders
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of traders who've made the switch to professional CS2 derivatives trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredSkins, setFeaturedSkins] = useState<Skin[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradingActivities, setTradingActivities] = useState<TradingActivity[]>([]);
  const [selectedGunType, setSelectedGunType] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured skins (top 6 by price)
        const skinsResponse = await fetch('/api/skins');
        const data = await skinsResponse.json();
        
        // Handle the new API response format
        const skins = data.skins || data || [];
        
        if (!Array.isArray(skins)) {
          console.error('Expected skins to be an array, got:', typeof skins);
          throw new Error('Invalid skins data format');
        }
        
        // Sort by volume24h to get most liquid skins (most orders/trading activity)
        const topSkins = skins
          .sort((a: Skin, b: Skin) => (b.volume24h || 0) - (a.volume24h || 0))
          .slice(0, 6);
        setFeaturedSkins(topSkins);

        // Calculate market stats
        const totalVolume = skins.reduce((sum: number, skin: Skin) => sum + skin.price, 0);
        const avgPrice = skins.length > 0 ? totalVolume / skins.length : 0;
        setMarketStats({
          totalSkins: skins.length,
          totalVolume,
          activeTraders: 1247, // Mock data
          avgPrice
        });

        // Generate mock trading activities
        const mockActivities: TradingActivity[] = skins.slice(0, 10).map((skin, index) => {
          const priceChangePercent = (Math.random() - 0.5) * 20; // -10% to +10%
          const priceChange = skin.price * (priceChangePercent / 100);
          return {
            id: `activity-${index}`,
            skinName: skin.name.length > 20 ? skin.name.substring(0, 20) + '...' : skin.name,
            price: skin.price,
            priceChange,
            priceChangePercent,
            timestamp: new Date(Date.now() - Math.random() * 3600000) // Random time within last hour
          };
        });
        setTradingActivities(mockActivities);

        // Fetch user's favorites if logged in
        if (session) {
          const favoritesResponse = await fetch('/api/favorites');
          const favoritesData = await favoritesResponse.json();
          setFavorites(favoritesData.favorites.map((f: any) => f.skinId));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default values on error
        setFeaturedSkins([]);
        setMarketStats({
          totalSkins: 0,
          totalVolume: 0,
          activeTraders: 0,
          avgPrice: 0
        });
        setTradingActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Filter skins by gun type
  const filteredSkins = selectedGunType === 'All'
    ? featuredSkins
    : featuredSkins.filter(skin => skin.type === selectedGunType);

  return (
    <div className="min-h-screen bg-[#0F1419]">
      {/* Live Trading Activity Ticker - Moved to top */}
      {tradingActivities.length > 0 && (
        <TradingTicker activities={tradingActivities} />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1419] via-[#1A1F2E] to-[#2A2D3A] py-20">
        <AnimatedBackground />
        <div className="relative container mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="mb-6 animate-fade-in-up">
                <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm">
                  🚀 Professional CS2 Stock Market Trading
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Trade CS2 Skins
                <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                  Like a Pro
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                Advanced stock market trading platform for CS2 skins with real-time data, 
                professional tools, and institutional-grade security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                {session ? (
                  <Link
                    href="/trade"
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 relative overflow-hidden"
                  >
                    <span className="relative z-10">Start Trading Now</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                ) : (
                  <Link
                    href="/api/auth/signin"
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 relative overflow-hidden"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                )}
                <Link
                  href="/skins"
                  className="px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition-all duration-300 backdrop-blur-sm hover:bg-white/5"
                >
                  Explore Market
                </Link>
              </div>
            </div>

            {/* Right side - Top Traded Skins */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">🔥 Top Traded Skins</h2>
                <p className="text-gray-400">Most liquid skins with highest trading volume</p>
              </div>

              {/* Gun Type Filter */}
              <GunTypeFilter selectedType={selectedGunType} onTypeChange={setSelectedGunType} />
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
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
              ) : (
                <div className="space-y-4">
                  {filteredSkins.slice(0, 4).map((skin, index) => (
                    <Link key={skin.id} href={`/skins/${skin.id}`} className="block group">
                      <div className="bg-[#23262F] rounded-xl p-4 border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 hover:bg-[#2A2D3A]">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-16 h-16 bg-[#181A20] rounded-lg flex items-center justify-center overflow-hidden">
                            <SteamImage
                              iconPath={skin.iconPath}
                              alt={skin.name}
                              className="object-contain group-hover:scale-110 transition-transform duration-300"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                              {skin.name}
                            </h3>
                            <p className="text-gray-400 text-sm">{skin.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">${skin.price.toLocaleString()}</div>
                            <div className={`text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                              {Math.random() > 0.5 ? '↗' : '↘'} {(Math.random() * 10).toFixed(1)}%
                            </div>
                          </div>
                          <FavoriteButton
                            skinId={skin.id}
                            initialFavorited={favorites.includes(skin.id)}
                            onToggle={(isFavorited) => {
                              setFavorites(prev =>
                                isFavorited
                                  ? [...prev, skin.id]
                                  : prev.filter(id => id !== skin.id)
                              );
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="mt-6 text-center lg:text-left flex items-center justify-between">
                <Link
                  href="/skins"
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  View All Skins
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {session && (
                  <Link
                    href="/favorites"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    View Favorites
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Statistics */}
      <section className="py-16 bg-[#181A20]">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-8 bg-gray-700 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="w-24 h-4 bg-gray-700 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                  {marketStats?.totalSkins || 0}
                </div>
                <div className="text-gray-400 font-medium">Available Skins</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                  ${marketStats?.totalVolume.toLocaleString() || 0}
                </div>
                <div className="text-gray-400 font-medium">Total Market Value</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                  {marketStats?.activeTraders.toLocaleString() || 0}
                </div>
                <div className="text-gray-400 font-medium">Active Traders</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                  ${marketStats?.avgPrice ? marketStats.avgPrice.toFixed(0) : '0'}
                </div>
                <div className="text-gray-400 font-medium">Average Price</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <LazySection 
        fallback={
          <div className="py-20 bg-[#0F1419]">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="w-64 h-8 bg-gray-700 rounded mx-auto mb-4 skeleton"></div>
                <div className="w-96 h-6 bg-gray-700 rounded mx-auto skeleton"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#23262F] p-8 rounded-2xl">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl mb-6 skeleton"></div>
                    <div className="w-32 h-6 bg-gray-700 rounded mb-4 skeleton"></div>
                    <div className="w-full h-16 bg-gray-700 rounded skeleton"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <section className="py-20 bg-[#0F1419]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Professional-grade tools and features designed for serious CS2 skin traders
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Real-Time Trading</h3>
              <p className="text-gray-400 leading-relaxed">
                Execute trades instantly with live market data, advanced order types, and professional charting tools.
              </p>
            </div>

            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-green-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">High Liquidity</h3>
              <p className="text-gray-400 leading-relaxed">
                Trade only the most liquid CS2 skins to ensure fair pricing and prevent market manipulation.
              </p>
            </div>

            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-purple-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Secure & Reliable</h3>
              <p className="text-gray-400 leading-relaxed">
                Bank-grade security with encrypted transactions and secure wallet management for peace of mind.
              </p>
            </div>

            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-yellow-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Advanced Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Comprehensive market analysis, price history, and trading insights to make informed decisions.
              </p>
            </div>

            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-red-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Ultra-low latency trading engine with instant order execution and real-time market updates.
              </p>
            </div>

            <div className="bg-[#23262F] p-8 rounded-2xl border border-[#2A2D3A] hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">24/7 Support</h3>
              <p className="text-gray-400 leading-relaxed">
                Round-the-clock customer support and comprehensive documentation to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      {/* Featured Skins Section */}
      <section className="py-20 bg-[#181A20]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              All Available Skins
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore our complete collection of tradeable CS2 skins with professional tools
            </p>
          </div>

          <SwipeableSkinsCarousel skins={featuredSkins} loading={loading} />

          <div className="text-center mt-12">
            <Link
              href="/skins"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              View All Skins
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <LazySection 
        fallback={
          <div className="py-20 bg-[#0F1419]">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="w-64 h-8 bg-gray-700 rounded mx-auto mb-4 skeleton"></div>
                <div className="w-96 h-6 bg-gray-700 rounded mx-auto skeleton"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#23262F] p-8 rounded-2xl">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gray-700 rounded-full mr-4 skeleton"></div>
                      <div>
                        <div className="w-24 h-4 bg-gray-700 rounded mb-2 skeleton"></div>
                        <div className="w-20 h-3 bg-gray-700 rounded skeleton"></div>
                      </div>
                    </div>
                    <div className="w-full h-20 bg-gray-700 rounded skeleton"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <TestimonialsSection />
      </LazySection>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who trust our platform for professional CS2 skin derivatives trading.
          </p>
          {session ? (
            <Link
              href="/skins"
              className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl relative overflow-hidden"
            >
              <span className="relative z-10">Start Trading Now</span>
              <svg className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl relative overflow-hidden"
            >
              <span className="relative z-10">Get Started Free</span>
              <svg className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          )}
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>
    </div>
  );
}
