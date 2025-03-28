"use client"
import React from 'react';
import Image from 'next/image';

const universities = [
  {
    name: 'Boston College',
    logo: '/logos/Boston-College-Emblem.png',
  },
  {
    name: 'University of Michigan',
    logo: '/logos/University-of-Michigan-Logo.png',
  },
  {
    name: 'Northwestern University',
    logo: '/logos/northwestern-university.svg',
  },
  {
    name: 'University of Pennsylvania',
    logo: '/logos/upenn.png',
  }
];

export const UniversityLogoCarousel: React.FC = () => {
  // Double the array for seamless looping
  const doubledUniversities = [...universities, ...universities];

  return (
    <div className="w-full py-4 sm:py-8 overflow-hidden">
      {/* Mobile Carousel */}
      <div className="sm:hidden relative w-full">
        <div className="flex animate-scroll">
          {doubledUniversities.map((university, index) => (
            <div
              key={`${university.name}-${index}`}
              className="relative w-[180px] aspect-[3/1] flex-shrink-0 grayscale opacity-70 mx-4"
            >
              <Image
                src={university.logo}
                alt={university.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Static Layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between max-w-6xl mx-auto px-8">
        {universities.map((university) => (
          <div
            key={university.name}
            className="relative aspect-[3/1] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 w-[220px]"
          >
            <Image
              src={university.logo}
              alt={university.name}
              fill
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Add animation keyframes to your global CSS or use inline styles */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }

        /* Pause animation on hover */
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}; 