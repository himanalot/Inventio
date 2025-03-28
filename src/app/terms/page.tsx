"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TermsOfService() {
  const router = useRouter()
  
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
            onClick={() => router.push('/')}
            className="border-2 hover:bg-ink-50"
          >
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto prose prose-ink">
          <h1>Terms of Service</h1>
          <p className="text-ink-600">Last Updated: 2025-03-02</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Inventio's PDF Viewer ("we," "our," or "us"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

          <h2>2. Account Registration and Requirements</h2>
          <p>To use certain features of our platform, you must register for an account. When you register, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          
          <h3>2.1 Age Requirements</h3>
          <p>You must be at least 13 years of age to use our services. If you are under 18, you must have parent or guardian permission to create an account.</p>

          <h3>2.2 One Account Per User</h3>
          <p>You may maintain only one active account with Inventio. Multiple accounts owned by the same individual may be removed.</p>

          <h2>3. User Conduct</h2>
          <p>When using our platform, you agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Submit false or misleading information</li>
            <li>Upload or transmit viruses or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Harass, intimidate, or threaten other users</li>
            <li>Use our platform for any illegal activities</li>
          </ul>

          <h2>4. Intellectual Property</h2>
          <p>All content on the Inventio platform, including text, graphics, logos, icons, images, audio, video, and software, is the property of Inventio or its content suppliers and is protected by international copyright, trademark, and other intellectual property laws.</p>
          
          <h3>4.1 Limited License</h3>
          <p>We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use our platform for personal, non-commercial purposes.</p>

          <h3>4.2 User Content</h3>
          <p>By submitting content to our platform, including PDF files, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future media formats necessary to provide the PDF viewing service.</p>

          <h2>5. PDF Viewer and Document Library</h2>
          <p>Our platform provides PDF viewing and document library services. You acknowledge that:</p>
          <ul>
            <li>The documents you upload remain your property, but we require certain rights to display and process them</li>
            <li>We may analyze document content to improve our services</li>
            <li>We cannot guarantee 100% accuracy in document rendering for all file types</li>
            <li>Some features may require additional permissions or premium access</li>
          </ul>

          <h2>6. Document Storage and Privacy</h2>
          <p>Our document storage policies include:</p>
          <ul>
            <li>Secure storage of user-uploaded documents</li>
            <li>Automatic deletion of inactive documents after a specified period</li>
            <li>Privacy controls for document sharing</li>
            <li>Encrypted transmission and storage of sensitive documents</li>
          </ul>

          <h2>7. Limitations of Liability</h2>
          <p>To the maximum extent permitted by law, Inventio shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
          <ul>
            <li>Your access to or use of or inability to access or use the service</li>
            <li>Any conduct or content of any third party on the service</li>
            <li>Any content obtained from the service</li>
            <li>Unauthorized access, use or alteration of your transmissions or content</li>
          </ul>

          <h2>8. Disclaimer of Warranties</h2>
          <p>Our platform is provided on an "AS IS" and "AS AVAILABLE" basis. Inventio expressly disclaims all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>

          <h2>9. Termination</h2>
          <p>We reserve the right to suspend or terminate your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.</p>

          <h2>10. Changes to Terms</h2>
          <p>We may modify these Terms of Service at any time. We will notify you of significant changes by posting a notice on our platform or via email. Your continued use of the platform after such modifications constitutes your acceptance of the updated terms.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles.</p>

          <h2>12. Contact Us</h2>
          <p>If you have questions about these Terms of Service, please contact us at buckefps67@gmail.com</p>
        </div>
      </main>
    </div>
  )
} 