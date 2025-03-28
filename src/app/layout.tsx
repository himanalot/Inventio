import "./globals.css"
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { Toaster } from "@/components/ui/toaster"
import '@/lib/polyfills'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Absolute URL for assets
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const logoUrl = '/mentorilogo.png'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Mentori - Connect with Peer Tutors & Find Learning Opportunities',
  description: 'Find tutoring sessions and connect directly with peer tutors. Discover learning opportunities across subjects for all academic levels - from high school to graduate courses.',
  keywords: [
    'peer tutoring',
    'find tutors',
    'student tutoring',
    'high school tutoring',
    'undergraduate tutoring',
    'college tutoring',
    'academic help',
    'learning assistance',
    'study sessions',
    'subject help',
    'math tutoring',
    'science tutoring',
    'humanities tutoring',
    'peer learning',
    'academic support',
    'student mentoring',
    'connect with tutors',
    'educational assistance',
    'study help',
    'academic mentorship'
  ].join(', '),
  icons: {
    icon: [
      {
        url: logoUrl,
        type: 'image/png',
      }
    ],
    shortcut: logoUrl,
    apple: logoUrl,
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Mentori - Connect with Peer Tutors for Academic Success',
    description: 'Find qualified peer tutors and connect directly with them. Search through available tutoring sessions and reach out to potential mentors across subjects.',
    url: siteUrl,
    siteName: 'Mentori',
    images: [
      {
        url: logoUrl,
        width: 800,
        height: 800,
        alt: 'Mentori - Peer Tutoring Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect with Peer Tutors & Find Academic Support | Mentori',
    description: 'Search available tutoring sessions and connect with qualified peer tutors. Find support that matches your academic needs across subjects.',
    images: [logoUrl],
  },
  alternates: {
    canonical: siteUrl
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Add your Google verification code here
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <Script
          id="schema-org-script"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Mentori",
              "url": siteUrl,
              "logo": logoUrl,
              "sameAs": [],
              "description": "Connect with peer tutors and find academic learning opportunities across subjects.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ClientProviders>
          {children}
          <Toaster />
        </ClientProviders>
        
        {/* Add basic auth debugging */}
        {process.env.NODE_ENV === 'development' && (
          <Script id="auth-debug">
            {`
              console.log('[Auth Debug] Page loaded at', window.location.pathname);
              setTimeout(() => {
                const authCookies = document.cookie.includes('sb-');
                console.log('[Auth Debug] Auth cookies present:', authCookies);
              }, 500);
            `}
          </Script>
        )}
      </body>
    </html>
  )
} 