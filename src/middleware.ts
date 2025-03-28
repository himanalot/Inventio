import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder middleware that passes through all requests
// We're using client-side auth with AuthProvider and ProtectedRoute components
export function middleware(request: NextRequest) {
  // Simply return the request as-is
  return NextResponse.next();
} 