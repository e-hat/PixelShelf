import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '@/components/layout/navbar';
import { Toaster } from 'sonner';
import AuthProvider from '@/context/auth-provider';
import { ThemeProvider } from '@/context/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PixelShelf - The Game Developer Portfolio Platform',
  description: 'Create, share, and discover game development portfolios with PixelShelf',
  keywords: ['game development', 'portfolio', 'pixel art', '3D models', 'game design', 'game assets', 'game developers'],
  authors: [{ name: 'PixelShelf' }],
  creator: 'PixelShelf',
  publisher: 'PixelShelf',
  metadataBase: new URL('https://pixelshelf.dev'), // Update to real domain for deployment
  openGraph: {
    title: 'PixelShelf - The Game Developer Portfolio Platform',
    description: 'Create, share, and discover game development portfolios with PixelShelf',
    url: 'https://pixelshelf.dev',
    siteName: 'PixelShelf',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PixelShelf',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixelShelf - The Game Developer Portfolio Platform',
    description: 'Create, share, and discover game development portfolios with PixelShelf',
    images: ['/images/og-image.png'],
    creator: '@pixelshelf',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <footer className="border-t py-6 md:py-8">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-1 mb-4 md:mb-0">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 bg-pixelshelf-primary rounded-sm"></div>
                        <div className="absolute inset-0 border-2 border-pixelshelf-dark rounded-sm"></div>
                      </div>
                      <span className="text-lg font-bold text-pixelshelf-primary">PixelShelf</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} PixelShelf. All rights reserved.
                    </div>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}