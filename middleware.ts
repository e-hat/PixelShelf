import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/upload',
  '/projects/new',
  '/settings',
  '/chat',
  '/notifications',
];

// Routes that don't require authentication but need session data
const publicRoutes = [
  '/',
  '/explore',
  '/u/',
  '/assets/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;
  
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api');
  
  // Get session token
  const token = await getToken({ req: request, secret });

  // Special case for onboarding - redirect to home if already completed onboarding
  if (pathname === '/onboarding' && token) {
    const hasCompletedOnboarding = !!token.username;
    
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // If protected route but no session, redirect to login
    if (!token) {
      // Store the current URL to redirect back after login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      
      return NextResponse.redirect(redirectUrl);
    }

    // If user hasn't completed onboarding, redirect to onboarding
    if (!token.username && pathname !== '/settings/profile') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }
  
  // For subscription routes, check if the user has premium access
  if (pathname.includes('/api/premium/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isPremium = token.subscriptionTier === 'PREMIUM';
    
    if (!isPremium) {
      return NextResponse.json(
        { 
          error: 'Premium required', 
          message: 'This feature requires a premium subscription'
        }, 
        { status: 403 }
      );
    }
  }
  
  // Rate limiting for API routes
  if (isApiRoute) {
    // Add custom headers to API responses
    const response = NextResponse.next();
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }
  
  return NextResponse.next();
}

// Configure which routes use the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/auth/* (NextAuth.js authentication routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico, /robots.txt, /sitemap.xml (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};