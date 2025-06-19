'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getSteamIconUrl, getFallbackImageUrl, getAlternativeSteamIconUrl, getAllSteamIconUrls } from '../lib/utils';
import SwipeableSkinsCarousel from '@/components/SwipeableSkinsCarousel';
import LazySection from '@/components/LazySection';

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

// Enhanced Steam Image Component with fallback support
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                {/* Logo Display */}
                <div className="flex justify-center lg:justify-start mb-8">
                  <Image
                    src="/logo-placeholder.svg"
                    alt="CS2 Derivatives - Professional Trading Platform"
                    width={400}
                    height={120}
                    className="w-auto h-24 hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
                
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Professional</span>{' '}
                  <span className="block text-blue-400 xl:inline">CS2 Trading</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Trade CS2 skin derivatives with advanced tools, real-time analytics, and professional-grade execution. 
                  Experience the future of skin trading.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/trading"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Start Trading
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/market"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-100 bg-blue-800 hover:bg-blue-900 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      View Market
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-400 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Advanced Trading Platform
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 lg:mx-auto">
              Everything you need to trade CS2 skins professionally
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Real-time Trading</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Execute trades instantly with our advanced matching engine and real-time price feeds.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Advanced Analytics</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Professional charts, technical indicators, and market analysis tools.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Secure Platform</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Bank-grade security with encrypted transactions and secure wallet integration.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-white">Portfolio Management</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-300">
                  Track your positions, P&L, and performance with comprehensive portfolio tools.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

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
