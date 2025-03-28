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
  title: 'Inventio - Advanced PDF Viewer and Document Management',
  description: 'A powerful PDF viewer with search, annotation, and document management capabilities. Perfect for researchers, students, and professionals.',
  keywords: [
    'pdf viewer',
    'document management',
    'pdf search',
    'pdf annotation',
    'pdf highlights',
    'document library',
    'research tools',
    'document viewer',
    'academic research',
    'professional documents',
    'pdf navigation',
    'pdf thumbnails',
    'document storage',
    'text search',
    'pdf document viewer',
    'document organization',
    'study tools',
    'research documents',
    'pdf management'
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
    title: 'Inventio - Advanced PDF Viewer and Document Management',
    description: 'A powerful PDF viewer with search, annotation, and document management capabilities. Manage your documents with ease and precision.',
    url: siteUrl,
    siteName: 'Inventio',
    images: [
      {
        url: logoUrl,
        width: 800,
        height: 800,
        alt: 'Inventio - PDF Viewer and Document Management',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advanced PDF Viewer and Document Management | Inventio',
    description: 'Explore documents with our powerful PDF viewer featuring search, annotation, and document management capabilities.',
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
              "description": "Advanced PDF viewer and document management system for researchers, students, and professionals.",
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