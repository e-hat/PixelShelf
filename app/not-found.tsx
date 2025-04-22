import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            Oops! Looks like this page has wandered off the map.
          </p>
        </div>
        
        {/* Pixel art style 404 */}
        <div className="py-8">
          <div className="grid grid-cols-9 gap-1 mx-auto w-fit">
            {/* Simplified pixel art "404" */}
            {[
              1,1,1,0,1,1,1,0,1,1,1,
              1,0,0,0,1,0,1,0,1,0,1,
              1,0,1,0,1,1,1,0,1,1,1,
              1,0,1,0,1,0,0,0,0,0,1,
              1,1,1,0,1,0,0,0,1,1,1,
            ].map((pixel, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 ${pixel ? 'bg-pixelshelf-primary' : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}