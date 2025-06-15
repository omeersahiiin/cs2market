'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (session) {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => setBalance(data.balance))
        .catch(() => setBalance(null));
    }
  }, [session]);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/skins', label: 'Market' },
    { href: '/trade', label: 'Trading' },
    { href: '/portfolio', label: 'Portfolio' },
    ...(session ? [{ href: '/admin/risk', label: 'Risk Monitor' }] : []),
  ];

  return (
    <nav className="bg-[#0F1419] border-b border-[#2A2D3A] sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">CS2 Derivatives</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-blue-400 font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Balance</div>
                    <div className="text-green-400 font-semibold">
                      ${balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                    </div>
                  </div>
                  <Link
                    href="/deposit"
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                  >
                    Deposit
                  </Link>
                  <Link
                    href="/account"
                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive('/account')
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#2A2D3A] py-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {session ? (
                <>
                  <div className="px-4 py-2 border-t border-[#2A2D3A] mt-4 pt-4">
                    <div className="text-sm text-gray-400 mb-1">Balance</div>
                    <div className="text-green-400 font-semibold mb-4">
                      ${balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                    </div>
                    <Link
                      href="/deposit"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 mb-2 text-center font-medium"
                    >
                      Deposit
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg transition-colors duration-200 mb-2 ${
                        isActive('/account')
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Account
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: '/auth/signin' });
                      }}
                      className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-2 border-t border-[#2A2D3A] mt-4 pt-4 space-y-2">
                  <Link
                    href="/auth/signin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 