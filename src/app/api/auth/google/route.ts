import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Helper function to wait for specified milliseconds
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  // Define baseUrl outside try block so it's accessible everywhere
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://inkr.pro'
    : requestUrl.origin
    
  try {
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(`${baseUrl}/signin?error=oauth&message=${encodeURIComponent(error_description || 'Authentication failed')}`)
    }

    if (!code) {
      console.error('No code provided in OAuth callback')
      return NextResponse.redirect(`${baseUrl}/signin?error=no_code`)
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

    // Implement retry logic with exponential backoff
    const maxRetries = 3
    const baseDelay = 1000 // Start with 1 second delay

    let lastError = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        // If successful, proceed without retries
        if (!exchangeError) {
          if (!data.session) {
            console.error('No session returned after code exchange')
            return NextResponse.redirect(`${baseUrl}/signin?error=no_session`)
          }

          // Successful authentication
          return NextResponse.redirect(`${baseUrl}/dashboard`, {
            status: 302,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'Pragma': 'no-cache'
            }
          })
        }
        
        // Store the error for later use
        lastError = exchangeError
        
        // If it's a rate limit error and we have retries left, wait and try again
        if (exchangeError.message?.toLowerCase().includes('rate limit') && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await sleep(delay)
          continue
        }
        
        // For other errors or last attempt, break out and handle the error
        break
      } catch (error) {
        lastError = error
        // If this is not the last attempt and it might be a rate limit issue, retry
        if (attempt < maxRetries - 1 && 
            (error instanceof Error && error.message?.toLowerCase().includes('rate limit'))) {
          const delay = baseDelay * Math.pow(2, attempt)
          console.log(`Exception during auth, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await sleep(delay)
          continue
        }
        break
      }
    }

    // If we got here, all retries failed or we encountered a non-retryable error
    if (lastError) {
      console.error('Error exchanging code for session after retries:', lastError)
      
      const errorMessage = lastError instanceof Error 
        ? lastError.message 
        : 'Authentication failed';
      
      return NextResponse.redirect(`${baseUrl}/signin?error=exchange&message=${encodeURIComponent(errorMessage)}`)
    }

    return NextResponse.redirect(`${baseUrl}/signin?error=exchange_failed`)

  } catch (error) {
    console.error('Unexpected error in auth flow:', error)
    return NextResponse.redirect(`${baseUrl}/signin?error=unexpected`, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    })
  }
} 