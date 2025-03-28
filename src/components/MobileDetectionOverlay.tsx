'use client';

import React from 'react';

interface MobileDetectionOverlayProps {
  // Add any customization props if needed in the future
  message?: string;
}

export default function MobileDetectionOverlay({ 
  message = "Inventio is designed for larger screens to provide an optimal research experience. Please visit us on a desktop or laptop computer."
}: MobileDetectionOverlayProps) {
  return (
    <div className="lg:hidden fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12.5 6h.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Desktop Experience Recommended</h2>
      <p className="text-gray-600 mb-4 max-w-md">
        {message}
      </p>
      <div className="flex gap-2 items-center text-indigo-600 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <rect width="8" height="2" x="8" y="2" />
          <line x1="2" x2="22" y1="20" y2="20" />
        </svg>
        <span>For the best experience</span>
      </div>
    </div>
  );
} 