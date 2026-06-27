import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Everything here is reachable WITHOUT a Clerk session:
// - the public marketing page and admin sign-in/sign-up (Clerk's own flow)
// - the student sign-in page
// - every /api/student/* route — students never get a Clerk session at all,
//   they authenticate through your own custom check in those routes (email +
//   the password stored on User.avatar). If this prefix isn't listed here,
//   Clerk's auth.protect() intercepts the fetch() call and returns a 404
//   before your route code ever runs — which is exactly what was happening.
// The entire /student section (every page, not just sign-in) and every
// /api/student/* route are public from Clerk's point of view -- students
// never get a Clerk session at all. Access control for those pages is handled
// separately, client-side, by StudentLayout's own localStorage session check.
// If any /student/* page is missing from this list, Clerk's auth.protect()
// redirects it to the ADMIN sign-in page instead, which is what just happened.
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/student(.*)',
  '/api/student(.*)',
  '/',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}