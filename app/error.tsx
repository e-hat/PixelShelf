'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, RefreshCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">Something went wrong!</h1>
          <p className="text-muted-foreground">
            Sorry about that! An unexpected error has occurred.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="my-4 p-4 bg-muted rounded-md text-left overflow-auto max-h-[200px]">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
        </div>
        
        <div className="py-6">
          <div className="flex justify-center items-center">
            <div className="w-16 h-16 bg-pixelshelf-light rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-pixelshelf-primary"
              >
                <path d="m8 2 1.5 1.5" />
                <path d="M14.5 3.5 16 2" />
                <path d="M8 22v-2a4 4 0 0 1 8 0v2" />
                <path d="M12 17v.01" />
                <path d="M12 14a4 4 0 0 1-4-4v-2a4 4 0 1 1 8 0v2a4 4 0 0 1-4 4Z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="pixel">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </div>
        
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-8">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}