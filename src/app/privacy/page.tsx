"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <nav className="fixed top-0 w-full border-b border-ink-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-ink-700">
              Inventio<span className="text-accent-500">.</span>
            </span>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-2 hover:bg-ink-50"
          >
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto prose prose-ink">
          <h1>Privacy Policy for Inventio PDF Viewer</h1>
          <p className="text-ink-600">Last Updated: 2025-03-02</p>

          <h2>1. Introduction</h2>
          <p>Welcome to Inventio PDF Viewer ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This privacy policy explains how we collect, use, and safeguard your data when you use our platform.</p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Email address and basic profile information through Google Sign-In</li>
            <li>Academic information you choose to share (institution, department, research interests)</li>
            <li>Professional profile information (position/year of study, bio)</li>
            <li>Optional social media links (website, Twitter, LinkedIn, ORCID)</li>
          </ul>

          <h3>2.2 Information We Receive from Third Parties</h3>
          <ul>
            <li>Google account information when you sign in with Google</li>
            <li>Gmail access tokens (only when you authorize Gmail integration)</li>
          </ul>

          <h3>2.3 Information We Collect Automatically</h3>
          <ul>
            <li>Usage data (how you interact with our platform)</li>
            <li>Search queries for research opportunities</li>
            <li>Research opportunities you save</li>
            <li>Technical information (browser type, device information)</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and manage your Inkr account</li>
            <li>Provide research opportunity search functionality</li>
            <li>Enable email communication with principal investigators through Gmail integration</li>
            <li>Save your preferred research opportunities</li>
            <li>Improve our platform and user experience</li>
            <li>Send important account-related notifications</li>
          </ul>

          <h2>4. Gmail Integration</h2>
          
          <h3>4.1 Scope of Gmail Access</h3>
          <ul>
            <li>We only request access to send emails (https://www.googleapis.com/auth/gmail.send)</li>
            <li>We cannot read your emails or access your Gmail inbox</li>
            <li>Emails are sent directly through your Gmail account</li>
          </ul>

          <h3>4.2 Use of Gmail Data</h3>
          <ul>
            <li>Gmail integration is used solely for sending emails to principal investigators about research opportunities</li>
            <li>We do not store the content of emails sent through our platform</li>
            <li>Email tokens are stored securely and used only for authentication</li>
          </ul>

          <h2>5. Data Storage and Security</h2>
          <ul>
            <li>We use Supabase for secure data storage and authentication</li>
            <li>All data is encrypted in transit and at rest</li>
            <li>Access tokens are stored securely and never shared with third parties</li>
            <li>We implement industry-standard security measures to protect your information</li>
          </ul>

          <h2>6. Data Sharing</h2>
          <p>We do not sell your personal information. We only share your information:</p>
          <ul>
            <li>When you explicitly choose to send emails to principal investigators</li>
            <li>With service providers who help us operate our platform (under strict confidentiality agreements)</li>
            <li>If required by law or to protect our legal rights</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Revoke Gmail access permissions</li>
            <li>Export your data</li>
          </ul>

          <h2>8. Data Retention</h2>
          <ul>
            <li>Account information is retained while your account is active</li>
            <li>You can delete your account at any time</li>
            <li>Gmail tokens are deleted when you revoke access or delete your account</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any significant changes through our platform or via email.</p>

          <h2>11. Contact Us</h2>
          <p>If you have questions about this privacy policy or your data, please contact us at support@inventio-pdf.com</p>

          <h2>12. Specific Data Processing Activities</h2>

          <h3>12.1 Research Opportunity Search</h3>
          <ul>
            <li>Search queries are used to match you with relevant research opportunities</li>
            <li>Search history is stored to improve search functionality</li>
            <li>Saved opportunities are linked to your profile for easy access</li>
          </ul>

          <h3>12.2 Email Templates</h3>
          <ul>
            <li>Email templates are provided as a service</li>
            <li>Template content is customizable</li>
            <li>Sent emails are processed through your Gmail account</li>
          </ul>

          <h2>13. Third-Party Services</h2>
          <p>Our platform uses:</p>
          <ul>
            <li>Supabase for authentication and data storage</li>
            <li>Google OAuth for authentication and Gmail integration</li>
            <li>Railway for hosting</li>
          </ul>
          <p>Each third-party service has its own privacy policy and data handling practices.</p>

          <h2>14. International Data Transfer</h2>
          <p>While our service is primarily intended for users in the United States, your data may be processed in different countries. We ensure appropriate safeguards are in place for international data transfers.</p>

          <h2>15. California Privacy Rights</h2>
          <p>California residents have additional rights under the CCPA. Please contact us for more information about exercising these rights.</p>

          <h2>16. Cookie Policy</h2>
          <p>We use essential cookies for authentication and platform functionality. No third-party tracking cookies are used.</p>
        </div>
      </main>
    </div>
  )
} 