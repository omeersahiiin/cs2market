import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/providers/AuthProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SystemInitializer from '@/components/SystemInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CS2 Derivatives - Professional Skin Trading Platform',
  description: 'Advanced derivatives trading platform for CS2 skins with real-time data, professional tools, and institutional-grade security.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0F1419] text-white`}>
        <AuthProvider>
          <SystemInitializer />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
