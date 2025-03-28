import { supabase } from '@/lib/supabase'

// Analytics functions
export async function trackEvent(eventName: string, eventData: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('analytics_events')
      .insert([
        {
          event_name: eventName,
          event_data: eventData,
          user_id: user?.id, // Optional user ID
          timestamp: new Date().toISOString()
        }
      ])
  } catch (error) {
    console.error('Error tracking event:', error)
    // Don't throw error to prevent app disruption
  }
}

export async function getUserActivity(userId: string) {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user activity:', error)
    return []
  }
}

export async function recordUserActivity() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return // Skip if no authenticated user

    const { error } = await supabase
      .from('user_activity')
      .insert([
        {
          user_id: session.user.id,
          timestamp: new Date().toISOString(),
          action: 'page_view'
        }
      ])
    
    if (error && error.code !== '42P01') { // Ignore table not found errors
      console.error('Error recording user activity:', error)
    }
  } catch (error) {
    console.error('Error recording user activity:', error)
    // Don't throw error to prevent app disruption
  }
} 