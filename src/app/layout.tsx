import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/providers/AuthProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SystemInitializer from '@/components/SystemInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CS2 Stock Market - Professional Skin Trading Platform',
  description: 'Advanced stock market trading platform for CS2 skins with real-time data, professional tools, and institutional-grade security.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0F1419] text-white`}>
        <ErrorBoundary>
        <AuthProvider>
          <SystemInitializer />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
