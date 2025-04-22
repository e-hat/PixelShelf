import { Metadata } from 'next';

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  path?: string;
  noIndex?: boolean;
}

export function generateMetadata({
  title,
  description,
  image,
  type = 'website',
  path = '',
  noIndex = false,
}: SeoProps): Metadata {
  // Default image if none provided
  const metaImage = image || '/images/og-image.png';
  // Full URL for path
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pixelshelf.dev'}${path}`;
  
  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: 'PixelShelf',
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [metaImage],
      creator: '@pixelshelf',
    },
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}