"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ResearchProject } from '../types/types';
import Link from 'next/link';
import { EmailTemplate } from './EmailTemplate';
import { supabase } from '@/lib/supabase';

interface ResearchOpportunityProps {
  project: ResearchProject;
  showSaveButton?: boolean;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export const ResearchOpportunity: React.FC<ResearchOpportunityProps> = ({ 
  project, 
  showSaveButton = true,
  onSaveToggle,
  isSaved = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);
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
        throw new Error('You must be logged in to save opportunities');
      }

      if (!savedStatus) {
        // Save the opportunity
        const { error } = await supabase
          .from('saved_opportunities')
          .insert({
            user_id: user.id,
            project_id: project.appl_id,
            project_data: project,
            saved_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Remove from saved
        const { error } = await supabase
          .from('saved_opportunities')
          .delete()
          .match({ 
            user_id: user.id, 
            project_id: project.appl_id 
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Date not available';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Amount not available';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (e) {
      return 'Amount not available';
    }
  };

  const formatKeywords = (terms: string) => {
    if (!terms) return [];
    return terms.split(';').filter(Boolean).map(term => term.trim());
  };

  const properCapitalize = (name: string) => {
    if (!name) return '';
    
    return name.toLowerCase()
      .split(' ')
      .map(word => {
        // If it's a single letter (potential middle initial) and doesn't end with a period
        if (word.length === 1 && !word.endsWith('.')) {
          return word.charAt(0).toUpperCase() + '.';
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const keywords = formatKeywords(project.pref_terms);
  const abstractParagraphs = project.abstract_text.split('\n\n');
  const firstParagraph = abstractParagraphs[0];
  const remainingParagraphs = abstractParagraphs.slice(1).join('\n\n');

  const piName = project.principal_investigators[0]?.full_name || 
                 `${project.principal_investigators[0]?.first_name} ${project.principal_investigators[0]?.last_name}` ||
                 project.contact_pi_name || '';

  return (
    <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-ink-100 hover:border-ink-200 overflow-hidden">
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ink-500 to-coral-500" />
      
      <div className="p-6">
        {/* Title section with Save button */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-ink-800 group-hover:text-ink-900 transition-colors duration-300 mb-2">
              {project.project_title}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {keywords.slice(0, 4).map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-ink-50 text-ink-600 rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
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
                  ? 'bg-ink-50 text-ink-700 hover:bg-ink-100' 
                  : 'hover:bg-ink-50'
              }`}
            >
              <svg 
                className={`w-5 h-5 mr-2 ${savedStatus ? 'text-ink-700' : 'text-ink-400'}`} 
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
            <div className="bg-ink-50/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Principal Investigator
              </h3>
              <div className="space-y-2">
                <p className="text-xl font-medium text-ink-800">
                  {properCapitalize(piName)}
                </p>
                {project.principal_investigators[0]?.title && (
                  <p className="text-ink-600">
                    {properCapitalize(project.principal_investigators[0].title)}
                  </p>
                )}
                {project.principal_investigators[0]?.email && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100">
                    <p className="text-ink-500 text-sm">
                      {project.principal_investigators[0].email}
                    </p>
                    <EmailTemplate 
                      project={project} 
                      email={project.principal_investigators[0].email} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-ink-50/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Institution
              </h3>
              <p className="text-xl font-medium text-ink-800 mb-2">
                {project.organization.org_name || 'Institution not available'}
              </p>
              <p className="text-ink-600">
                {project.organization.org_city && project.organization.org_state ? (
                  `${project.organization.org_city}, ${project.organization.org_state} ${project.organization.org_zipcode}`
                ) : (
                  'Location not available'
                )}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-ink-50/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Funding Details
              </h3>
              <p className="text-2xl font-bold text-ink-800 mb-2 font-mono">
                {formatCurrency(project.award_amount)}
              </p>
              <div className="flex items-center text-ink-600">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {project.project_start_date || project.project_end_date ? (
                    `${formatDate(project.project_start_date)} - ${formatDate(project.project_end_date)}`
                  ) : (
                    'Date range not available'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Section */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAbstract(!showAbstract)}
            className="w-full justify-center mb-4 bg-ink-50 hover:bg-ink-100 border-ink-200"
          >
            <svg
              className={`w-5 h-5 mr-2 transition-transform duration-200 ${showAbstract ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAbstract ? 'Hide Abstract' : 'Show Abstract'}
          </Button>

          {showAbstract && (
            <div className="bg-gradient-to-br from-ink-50/50 to-ink-100/30 rounded-lg p-6 border border-ink-100">
              <h3 className="text-lg font-semibold text-ink-700 mb-4">
                Research Summary
              </h3>
              <div className="prose prose-ink max-w-none">
                <p className="text-ink-700 leading-relaxed mb-4">{firstParagraph}</p>
                {remainingParagraphs && (
                  <>
                    {expanded && (
                      <p className="text-ink-700 leading-relaxed mb-4">{remainingParagraphs}</p>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setExpanded(!expanded)}
                      className="text-ink-600 hover:text-ink-700 hover:bg-ink-100/50 -ml-2"
                    >
                      {expanded ? (
                        <><span>Show Less</span><span className="ml-2">↑</span></>
                      ) : (
                        <><span>Read More</span><span className="ml-2">↓</span></>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How to Apply Section */}
        <div className="mt-6 pt-6 border-t border-ink-100">
          <h3 className="text-lg font-semibold text-ink-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Additional Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-ink-600">
              <span className="text-ink-400">1.</span>
              <span>Reference grant number:</span>
              <code className="px-3 py-1 bg-ink-50 text-ink-700 rounded font-mono text-sm">
                {project.project_num}
              </code>
            </div>
            <div className="flex items-center gap-3 text-ink-600">
              <span className="text-ink-400">2.</span>
              <span>View full project details:</span>
              <Link
                href={`https://reporter.nih.gov/project-details/${project.appl_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-700 hover:text-ink-900 underline inline-flex items-center gap-1 group"
              >
                NIH Reporter Link
                <svg 
                  className="w-4 h-4 transform transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 