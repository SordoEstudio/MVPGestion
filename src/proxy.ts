import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/login');

  if (isPublic) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return Response.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
