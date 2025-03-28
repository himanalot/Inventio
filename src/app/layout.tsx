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
const logoUrl = '/inkrlogo.png'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Inventio - Academic Research Platform',
  description: 'A comprehensive platform for academic research, literature review, and scholarly collaboration that transforms how researchers discover, organize, and extract insights from academic literature.',
  keywords: [
    'academic research platform',
    'literature review',
    'research workflow',
    'scholarly collaboration',
    'citation management',
    'research notes',
    'semantic search',
    'cross-reference identification',
    'concept mapping',
    'collaborative annotations',
    'document analysis',
    'figure extraction',
    'citation network',
    'literature organization',
    'research methodology',
    'academic writing',
    'dissertation research',
    'scientific collaboration',
    'knowledge management',
    'research output'
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
    title: 'Inventio - Academic Research Platform',
    description: 'Transform how you discover, organize, and extract insights from academic literature with intelligent document management and analysis tools for researchers and scholars.',
    url: siteUrl,
    siteName: 'Inventio',
    images: [
      {
        url: logoUrl,
        width: 800,
        height: 800,
        alt: 'Inventio - Academic Research Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academic Research Platform for Scholars | Inventio',
    description: 'Streamline your research workflow with powerful literature organization, semantic search, and collaborative annotation tools designed for academic researchers.',
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
              "name": "Inventio",
              "url": siteUrl,
              "logo": logoUrl,
              "sameAs": [],
              "description": "An academic research platform designed to transform how researchers discover, organize, and extract insights from scholarly literature through intelligent document management and analysis tools.",
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