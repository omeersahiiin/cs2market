'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getSteamIconUrl, getFallbackImageUrl } from '../lib/utils';

interface Skin {
  id: string;
  name: string;
  price: number;
  iconPath: string;
  type: string;
  rarity: string;
}

interface MarketStats {
  totalSkins: number;
  totalVolume: number;
  activeTraders: number;
  avgPrice: number;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredSkins, setFeaturedSkins] = useState<Skin[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        const topSkins = skins
          .sort((a: Skin, b: Skin) => b.price - a.price)
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1419]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1419] via-[#1A1F2E] to-[#2A2D3A] py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
                🚀 Professional CS2 Derivatives Trading
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Trade CS2 Skins
              <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Like a Pro
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Advanced derivatives trading platform for CS2 skins with real-time data, 
              professional tools, and institutional-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Link
                  href="/skins"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  Start Trading Now
                </Link>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  Get Started Free
                </Link>
              )}
              <Link
                href="/skins"
                className="px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition-all duration-300"
              >
                Explore Market
              </Link>
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
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {marketStats?.totalSkins || 0}
                </div>
                <div className="text-gray-400 font-medium">Available Skins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                  ${marketStats?.totalVolume.toLocaleString() || 0}
                </div>
                <div className="text-gray-400 font-medium">Total Market Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                  {marketStats?.activeTraders.toLocaleString() || 0}
                </div>
                <div className="text-gray-400 font-medium">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  ${marketStats?.avgPrice.toFixed(0) || 0}
                </div>
                <div className="text-gray-400 font-medium">Average Price</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
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

      {/* Featured Skins Section */}
      <section className="py-20 bg-[#181A20]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Premium Skins Collection
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Trade the most valuable and liquid CS2 skins with institutional-grade tools
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#23262F] rounded-2xl p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-700 rounded-xl mb-4"></div>
                  <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredSkins.map((skin) => (
                <Link key={skin.id} href={`/skins/${skin.id}`} className="block group">
                  <div className="bg-[#23262F] rounded-2xl overflow-hidden border border-[#2A2D3A] hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105">
                    <div className="relative w-full h-48 bg-[#181A20] flex items-center justify-center overflow-hidden">
                      <Image
                        src={getSteamIconUrl(skin.iconPath)}
                        alt={skin.name}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={(e) => {
                          console.log('Image failed to load:', getSteamIconUrl(skin.iconPath));
                          (e.target as HTMLImageElement).src = getFallbackImageUrl();
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', getSteamIconUrl(skin.iconPath));
                        }}
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
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
              ))}
            </div>
          )}

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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who trust our platform for professional CS2 skin derivatives trading.
          </p>
          {session ? (
            <Link
              href="/skins"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Trading Now
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
