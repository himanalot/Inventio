"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CookiePolicy() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <nav className="fixed top-0 w-full border-b border-ink-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-ink-700">
              inkr<span className="text-accent-500">.</span>
            </span>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="border-2 hover:bg-ink-50"
          >
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto prose prose-ink">
          <h1>Cookie Policy</h1>
          <p className="text-ink-600">Last Updated: 2025-03-02</p>

          <h2>1. Introduction</h2>
          <p>This Cookie Policy explains how inkr ("we," "our," or "us") uses cookies and similar technologies on our website at inkr.pro. This policy is designed to help you understand what cookies are, how we use them, and your choices regarding their use.</p>

          <h2>2. What Are Cookies?</h2>
          <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit websites. They are widely used to make websites work more efficiently, as well as to provide information to the website owners. Cookies help enhance your browsing experience by:</p>
          <ul>
            <li>Remembering your preferences and settings</li>
            <li>Keeping you signed in to your account</li>
            <li>Understanding how you use our website</li>
            <li>Improving your experience based on your browsing habits</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          
          <h3>3.1 Necessary Cookies</h3>
          <p>These cookies are essential for the operation of our website. They enable core functionality such as security, network management, and authentication. You cannot opt out of these cookies as the website cannot function properly without them.</p>
          
          <h3>3.2 Functional Cookies</h3>
          <p>These cookies enable us to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, some or all of these services may not function properly.</p>
          
          <h3>3.3 Performance/Analytics Cookies</h3>
          <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.</p>

          <h2>4. Specific Cookies We Use</h2>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>supabase-auth-token</td>
                <td>Used for authentication with Supabase</td>
                <td>Session</td>
                <td>Necessary</td>
              </tr>
              <tr>
                <td>inkr-preferences</td>
                <td>Stores user preferences</td>
                <td>1 year</td>
                <td>Functional</td>
              </tr>
              <tr>
                <td>_ga</td>
                <td>Used by Google Analytics to distinguish users</td>
                <td>2 years</td>
                <td>Analytics</td>
              </tr>
            </tbody>
          </table>

          <h2>5. Third-Party Cookies</h2>
          <p>Some cookies are placed by third parties on our website. These third parties include:</p>
          <ul>
            <li><strong>Supabase:</strong> For user authentication and data storage</li>
            <li><strong>Google Analytics:</strong> For website analytics</li>
          </ul>
          <p>We do not control the use of these third-party cookies and recommend that you check the respective privacy policies of these third parties to understand how they use your information.</p>

          <h2>6. Managing Cookies</h2>
          <p>Most web browsers allow you to manage your cookie preferences. You can:</p>
          <ul>
            <li>Delete cookies from your device</li>
            <li>Block cookies by activating the setting on your browser that allows you to refuse all or some cookies</li>
            <li>Set your browser to notify you when you receive a cookie</li>
          </ul>
          <p>Please note that if you choose to block or delete cookies, you may not be able to access certain areas or features of our website, and some services may not function properly.</p>

          <h3>6.1 Browser Settings</h3>
          <p>You can manage cookies through your browser settings. Here are links to instructions for common browsers:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <h2>7. Do Not Track Signals</h2>
          <p>Some browsers have a "Do Not Track" feature that signals to websites that you visit that you do not want to have your online activity tracked. Our website currently does not respond to "Do Not Track" signals.</p>

          <h2>8. Changes to Our Cookie Policy</h2>
          <p>We may update our Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.</p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about our use of cookies, please contact us at buckefps67@gmail.com</p>
        </div>
      </main>
    </div>
  )
} 