"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TutoringSession } from '../types/types';

interface ContactModalProps {
  session: TutoringSession;
  email: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ session, email }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState(`Question about your ${session.subject} tutoring`);
  const [message, setMessage] = useState(
    `Hi ${session.tutor.full_name.split(' ')[0]},\n\nI'm interested in your tutoring session on ${session.subject}. I'd like to learn more about:\n\n- Your teaching approach\n- Your availability\n- What materials I should prepare\n\nLooking forward to hearing from you!\n\nThanks,\n[Your Name]`
  );

  const handleCopy = () => {
    const fullMessage = `Subject: ${subject}\n\n${message}`;
    navigator.clipboard.writeText(fullMessage);
    
    // Show a confirmation message
    const confirmationEl = document.getElementById('copy-confirmation');
    if (confirmationEl) {
      confirmationEl.classList.remove('opacity-0');
      setTimeout(() => {
        confirmationEl.classList.add('opacity-0');
      }, 2000);
    }
  };

  const handleEmailOpen = () => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
        >
          Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-slate-800 border border-slate-700 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Contact {session.tutor.full_name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Send a message to inquire about tutoring sessions. You can use our template or customize your message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-white">
              Subject
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-white focus:border-emerald-500 focus:ring focus:ring-emerald-500/20"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-white">
              Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full bg-slate-700 border-slate-600 text-white font-mono text-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20"
            />
          </div>
          
          <div 
            id="copy-confirmation" 
            className="text-sm text-emerald-400 opacity-0 transition-opacity duration-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Message copied to clipboard!
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-slate-700 pt-4">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="sm:w-auto w-full bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy to Clipboard
          </Button>
          <Button 
            onClick={handleEmailOpen}
            className="sm:w-auto w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-900/20"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Open in Email App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 