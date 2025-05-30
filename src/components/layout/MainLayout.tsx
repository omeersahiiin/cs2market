'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              CS2 Derivatives
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/market"
                  className={`hover:text-blue-400 transition-colors ${
                    isActive('/market') ? 'text-blue-400' : ''
                  }`}
                >
                  Market
                </Link>
                <Link
                  href="/trading"
                  className={`hover:text-blue-400 transition-colors ${
                    isActive('/trading') ? 'text-blue-400' : ''
                  }`}
                >
                  Trading
                </Link>
                <Link
                  href="/portfolio"
                  className={`hover:text-blue-400 transition-colors ${
                    isActive('/portfolio') ? 'text-blue-400' : ''
                  }`}
                >
                  Portfolio
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    {session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            © 2024 CS2 Derivatives. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 