import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { query, location, isRandom } = await request.json()
    
    // Prevent random search with location filter
    if (isRandom && location) {
      return NextResponse.json(
        { error: 'Random search is not available when filtering by location' },
        { status: 400 }
      )
    }
    
    if (!isRandom && (!query || typeof query !== 'string')) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      )
    }

    const searchServerUrl = process.env.SEARCH_SERVER_URL || 'http://localhost:3001'

    // Generate random seed for vector search
    const randomSeed = Math.floor(Math.random() * 1000000)

    // Call your server's search endpoint
    const response = await fetch(`${searchServerUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        criteria: {
          advanced_text_search: isRandom ? {
            random: true,
            seed: randomSeed,  // Pass random seed to server
            limit: 100,  // Get 100 random results
            strategy: 'random_sample'  // Tell server to use random sampling
          } : {
            search_text: query
          }
        }
      }),
    })

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()
    
    // Filter by location first if specified
    if (location && data.results) {
      data.results = data.results.filter((result: any) => {
        // Check if org_state exists in the organization object
        if (!result.organization?.org_state) return false;
        
        // First try direct state code match
        if (result.organization.org_state === location) return true;
        
        // If that doesn't work, try matching in the full address
        const orgAddress = result.organization?.org_city?.toUpperCase() + ', ' + 
                         result.organization?.org_state + ' ' + 
                         result.organization?.org_zipcode;
        
        // Updated pattern to match:
        // 1. ", XX " (comma followed by state code)
        // 2. " XX " (space-surrounded state code)
        const statePattern = new RegExp(`(,\\s*${location}\\s)|(\\s${location}\\s)`, 'i');
        return statePattern.test(orgAddress);
      });
    }

    // For random searches, take a random subset if we have more than 50 results
    if (isRandom && data.results && data.results.length > 50) {
      // Fisher-Yates shuffle one more time for good measure
      for (let i = data.results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data.results[i], data.results[j]] = [data.results[j], data.results[i]];
      }
      
      // Take first 50 results after shuffle
      data.results = data.results.slice(0, 50);
    }
    
    data.total = data.results?.length || 0

    // If no results found, return a helpful message
    if (data.results.length === 0) {
      let message = "Sorry, we couldn't find any research opportunities"
      if (location) {
        message += ` in ${location}`
      }
      if (!isRandom) {
        message += ` matching "${query}"`
      }
      message += "\nTry:"
      const suggestions = [
        "Using different search terms",
        "Searching in a different location",
        "Using the Random search button to explore opportunities"
      ]
      
      return NextResponse.json({
        results: [],
        total: 0,
        message,
        suggestions
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 