'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

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
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo-placeholder.svg"
                alt="CS2 Derivatives Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href) ? 'bg-blue-600' : ''
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.href) ? 'bg-blue-600' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {link.label}
                </Link>
              ))}
              
              {session ? (
                <>
                  <div className="px-4 py-2 border-t border-gray-800 mt-4 pt-4">
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
                <div className="px-4 py-2 border-t border-gray-800 mt-4 pt-4 space-y-2">
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