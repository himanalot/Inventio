'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'

const ADMIN_USER_ID = 'bfea4cd9-8794-4807-a90c-425132192be0'

export default function AnalyticsPage() {
  const router = useRouter()
  const [dailyUsers, setDailyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDailyActiveUsers() {
      try {
        // Verify admin status
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.id !== ADMIN_USER_ID) {
          router.push('/signin')
          return
        }

        // Get data from view
        const { data, error } = await supabase
          .from('daily_active_users')
          .select('*')
          .order('activity_date', { ascending: true })
        
        if (error) throw error
        
        // Format data for chart
        const formattedData = (data || []).map(item => ({
          date: new Date(item.activity_date).toLocaleDateString(),
          users: item.active_users
        }))
        
        setDailyUsers(formattedData)
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchDailyActiveUsers()

    // Set up polling every 30 seconds to keep data fresh
    const interval = setInterval(fetchDailyActiveUsers, 30000)

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('user_activity_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activity'
      }, () => {
        fetchDailyActiveUsers()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [router])

  // Calculate stats
  const getTotalUsers = () => {
    return dailyUsers[dailyUsers.length - 1]?.users || 0
  }

  const get7DayAverage = () => {
    const last7Days = dailyUsers.slice(-7)
    if (last7Days.length === 0) return 0
    const sum = last7Days.reduce((acc, day) => acc + day.users, 0)
    return Math.round(sum / last7Days.length)
  }

  const get30DayTotal = () => {
    return dailyUsers.reduce((acc, day) => acc + day.users, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ink-50 to-white">
        <div className="text-xl text-ink-600 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-ink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading analytics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ink-50 to-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Error Loading Analytics</div>
          <p className="text-ink-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <nav className="fixed top-0 w-full border-b border-ink-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-2xl text-ink-700">
            inkr<span className="text-accent-500">.</span>
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border-2 border-ink-200 rounded-lg hover:bg-ink-50 transition-colors text-ink-600"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-ink-900">Analytics Dashboard</h1>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#4F83FF" 
                        strokeWidth={2}
                        dot={{ fill: '#4F83FF' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Users Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ink-900">
                    {getTotalUsers()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">7-Day Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ink-900">
                    {get7DayAverage()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">30-Day Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ink-900">
                    {get30DayTotal()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}