"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { TutoringSession } from '../types/types';
import Link from 'next/link';
import { ContactModal } from './ContactModal';
import { supabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";
import { Star } from 'lucide-react';

interface TutoringSessionCardProps {
  session: TutoringSession;
  showSaveButton?: boolean;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export const TutoringSessionCard: React.FC<TutoringSessionCardProps> = ({ 
  session, 
  showSaveButton = true,
  onSaveToggle,
  isSaved = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(isSaved);

  useEffect(() => {
    setSavedStatus(isSaved);
  }, [isSaved]);

  const handleSaveToggle = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to save tutoring sessions');
      }

      if (!savedStatus) {
        // Save the session
        const { error } = await supabase
          .from('saved_sessions')
          .insert({
            user_id: user.id,
            session_id: session.session_id,
            session_data: session,
            saved_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Remove from saved
        const { error } = await supabase
          .from('saved_sessions')
          .delete()
          .match({ 
            user_id: user.id, 
            session_id: session.session_id 
          });

        if (error) throw error;
      }

      setSavedStatus(!savedStatus);
      if (onSaveToggle) {
        onSaveToggle();
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTags = (tags: string) => {
    if (!tags) return [];
    return tags.split(';').filter(Boolean).map(tag => tag.trim());
  };

  const formatAvailability = (availability: string[]) => {
    if (!availability || availability.length === 0) return 'Flexible';
    return availability.join(', ');
  };
  
  const sessionTags = formatTags(session.subject_tags);
  
  // Format session format with icon
  const formatSessionType = (format: string) => {
    switch (format) {
      case 'online':
        return (
          <span className="flex items-center text-emerald-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Online
          </span>
        );
      case 'in-person':
        return (
          <span className="flex items-center text-emerald-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            In-Person
          </span>
        );
      case 'hybrid':
        return (
          <span className="flex items-center text-emerald-400">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Hybrid
          </span>
        );
      default:
        return format;
    }
  };

  // Star rating display
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} 
          />
        ))}
        <span className="ml-2 text-white text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="group relative bg-slate-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700 hover:border-emerald-500/50 overflow-hidden">
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      
      <div className="p-6">
        {/* Title section with Save button */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 mb-3">
              {session.session_title}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {sessionTags.slice(0, 4).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:bg-slate-600"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          {showSaveButton && (
            <Button
              variant="outline"
              onClick={handleSaveToggle}
              disabled={saving}
              className={`min-w-[100px] ${
                savedStatus 
                  ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/30' 
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              }`}
            >
              <svg 
                className={`w-5 h-5 mr-2 ${savedStatus ? 'text-emerald-400' : 'text-slate-400'}`} 
                fill={savedStatus ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {saving ? 'Saving...' : (savedStatus ? 'Saved' : 'Save')}
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Tutor
              </h3>
              <div className="flex items-center gap-4">
                {session.tutor.profile_image ? (
                  <img 
                    src={session.tutor.profile_image} 
                    alt={session.tutor.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 text-xl font-semibold border-2 border-emerald-500/30">
                    {session.tutor.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xl font-medium text-white">
                    {session.tutor.full_name}
                  </p>
                  {session.tutor.education_level && (
                    <p className="text-slate-400 text-sm">
                      {session.tutor.education_level}
                    </p>
                  )}
                  {session.rating && <StarRating rating={session.rating} />}
                </div>
              </div>
              
              {session.tutor.email && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-600">
                  <p className="text-slate-400 text-sm">
                    {session.tutor.sessions_completed ? `${session.tutor.sessions_completed} sessions completed` : 'New tutor'}
                  </p>
                  <ContactModal
                    session={session}
                    email={session.tutor.email}
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Location
              </h3>
              {session.location ? (
                <>
                  <p className="text-xl font-medium text-white mb-2">
                    {session.location.institution_name || 'Institution not provided'}
                  </p>
                  <p className="text-slate-400">
                    {session.location.city && session.location.state ? (
                      `${session.location.city}, ${session.location.state} ${session.location.zipcode}`
                    ) : (
                      'Location details not provided'
                    )}
                  </p>
                </>
              ) : (
                <p className="text-slate-400">Online session - no physical location</p>
              )}
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-white flex items-center">
                  <span className="font-medium mr-2">Format:</span> 
                  {formatSessionType(session.session_format)}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Session Details
              </h3>
              <p className="text-2xl font-bold text-emerald-400 mb-2 font-mono">
                {formatCurrency(session.hourly_rate)}<span className="text-slate-400 text-lg font-normal">/hour</span>
              </p>
              <div className="flex flex-col gap-2 text-slate-300">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-medium">Subject:</span>&nbsp;{session.subject}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Availability:</span>&nbsp;{formatAvailability(session.availability)}
                </div>
                {session.reviews_count && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="font-medium">Reviews:</span>&nbsp;{session.reviews_count}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all duration-200"
                  onClick={() => window.open(`/book/${session.session_id}`, '_blank')}
                >
                  Book Session
                </Button>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <div className={`prose prose-invert prose-sm max-w-none text-slate-300 ${!expanded && 'line-clamp-4'}`}>
                <p>{session.description}</p>
              </div>
              {session.description.length > 150 && (
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center"
                >
                  {expanded ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Read more
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 