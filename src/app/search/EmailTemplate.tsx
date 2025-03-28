"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { ResearchProject } from '../types/types';

interface EmailTemplateProps {
  project: ResearchProject;
  email: string;
}

export function EmailTemplate({ project, email }: EmailTemplateProps) {
  const generateEmailBody = () => {
    const template = `Dear Dr. ${project.principal_investigators[0]?.full_name?.split(' ').pop()},

I hope this email finds you well. I recently came across your research project titled "${project.project_title}" and I am very interested in the work you're doing.

[Briefly describe your relevant expertise and how it aligns with their research]

I would greatly appreciate the opportunity to discuss potential collaboration opportunities and learn more about your current research directions. I am particularly interested in [specific aspect of their research that interests you].

Would you be available for a brief conversation to discuss this further? I am happy to accommodate your schedule.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Title/Institution]
[Your Contact Information]`;

    return template;
  };

  const handleEmailClick = () => {
    const emailBody = generateEmailBody();
    const subject = `Research Collaboration Interest: ${project.project_title}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
  };

  return (
    <div className="inline-block">
      <Button
        variant="outline"
        size="sm"
        className="text-ink-600 hover:text-ink-700 border-ink-200 hover:border-ink-300"
        onClick={handleEmailClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Compose Email
      </Button>
    </div>
  );
} 