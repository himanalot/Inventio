"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RiGraduationCapFill } from "react-icons/ri"
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Database } from "@/lib/database.types"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/components/providers/AuthProvider"
import { NavBar } from "@/components/NavBar"

type Session = Database['public']['Tables']['sessions']['Row']

function ScheduleContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week">("month")
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simplified function to fetch sessions directly
  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user) {
        setError("Unable to fetch sessions. Please refresh the page.")
        return
      }
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*, profiles!sessions_tutor_id_fkey(full_name)')
        .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        setError("Failed to load your sessions. Please try again.")
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      setError("There was a problem loading your sessions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch sessions when the component mounts or when user changes
  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-white mb-2">Loading schedule...</h2>
          <p className="text-[#666]">Please wait while we load your sessions.</p>
        </div>
      </div>
    )
  }

  // Just show error state (no auth error handling)
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#141414] rounded-xl border border-[#232323] p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Schedule Access</h2>
          <div className="mb-6 text-slate-300">
            {error}
          </div>
          
          <div className="mt-6 flex gap-3 justify-center">
            <Button 
              onClick={() => fetchSessions()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Add previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false })
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    
    // Add next month's days
    const remainingDays = 42 - days.length // Always show 6 weeks
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    
    return days
  }

  const days = getDaysInMonth(selectedDate)
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))
  }

  const hasSessionOnDate = (date: Date) => {
    return sessions.some(session => session.date === date.toISOString().split('T')[0])
  }

  const getSessionsForDate = (date: string) => {
    return sessions.filter(session => session.date === date)
  }

  // Get upcoming sessions (next 30 days)
  const upcomingSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    return sessionDate >= today && sessionDate <= thirtyDaysFromNow
  })

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            onClick={() => router.push('/search')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Book New Session
          </Button>
        </div>

        {/* Calendar and sessions grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-[#232323] p-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-[#232323] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white opacity-60 hover:opacity-100" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-[#232323] transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white opacity-60 hover:opacity-100" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-[#232323]/50 rounded-lg p-1">
              {/* Day names */}
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-[#666] py-1.5">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map(({ date, isCurrentMonth }, index) => {
                const hasSession = hasSessionOnDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <button
                    key={index}
                    className={`
                      relative group h-9 rounded-md flex items-center justify-center
                      ${isCurrentMonth ? 'text-white' : 'text-[#666]'}
                      ${isToday ? 'bg-[#232323]' : ''}
                      ${hasSession ? 'bg-emerald-500/5' : ''}
                      hover:bg-[#232323] transition-colors
                    `}
                  >
                    <span className={`
                      text-xs z-10 relative
                      ${hasSession ? 'font-medium text-emerald-400' : ''}
                      ${isToday ? 'font-bold' : ''}
                    `}>
                      {date.getDate()}
                    </span>
                    {hasSession && (
                      <div className="absolute inset-1 rounded-md ring-1 ring-emerald-500/20"></div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Session count summary */}
            <div className="mt-4 pt-4 border-t border-[#232323] flex items-center justify-between text-xs">
              <div className="text-[#666]">
                {upcomingSessions.length} upcoming sessions this month
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[#666]">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-[#666]">Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming sessions */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white mb-3">Upcoming Sessions</h2>
            {upcomingSessions.length === 0 ? (
              <div className="bg-[#141414] rounded-xl border border-[#232323] p-4 text-center">
                <p className="text-[#666] text-sm">No upcoming sessions</p>
              </div>
            ) : (
              upcomingSessions.map(session => (
                <div 
                  key={session.id}
                  className="bg-[#141414] rounded-xl border border-[#232323] p-4 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium text-sm">{session.title}</h3>
                      <div className="flex items-center gap-2 text-[#666] text-xs mt-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{(session as any).profiles?.full_name}</span>
                      </div>
                    </div>
                    <div className={`
                      px-2 py-0.5 rounded-full text-xs
                      ${session.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}
                    `}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-[#666]">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{new Date(session.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{session.start_time} - {session.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{session.location || 'Online'}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#232323] flex justify-end gap-2">
                    {session.status === 'confirmed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-[#666] border-[#232323] hover:bg-[#232323] hover:text-white text-xs"
                        >
                          Reschedule
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                        >
                          Join Session
                        </Button>
                      </>
                    )}
                    {session.status === 'pending' && (
                      <Button 
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                      >
                        Confirm Session
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleContent />
    </ProtectedRoute>
  )
} 