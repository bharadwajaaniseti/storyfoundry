import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Terms of Service</h1>
            <div className="w-5" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <p className="text-gray-600 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using StoryFoundry ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                StoryFoundry is a creative writing platform that provides tools for writers to create, develop, and protect their intellectual property. 
                Our services include project management, collaboration tools, IP protection through blockchain timestamping, and content discovery features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="text-gray-600 space-y-3">
                <p>To access certain features of the Service, you must create an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Notify us immediately of any unauthorized access to your account</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property Rights</h2>
              <div className="text-gray-600 space-y-3">
                <p><strong>Your Content:</strong> You retain all rights to the creative content you upload to StoryFoundry. 
                By using our Service, you grant us a limited license to store, process, and display your content solely for the purpose of providing our services.</p>
                
                <p><strong>Our Platform:</strong> The StoryFoundry platform, including its design, features, and underlying technology, 
                is protected by copyright, trademark, and other laws. You may not copy, modify, or create derivative works based on our platform.</p>
                
                <p><strong>IP Protection Services:</strong> Our blockchain timestamping service creates immutable records of your content creation dates. 
                While this provides evidence of creation, it does not constitute legal copyright registration or guarantee legal protection.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Conduct</h2>
              <div className="text-gray-600 space-y-3">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload content that violates any law or infringes upon others' rights</li>
                  <li>Share content that is hateful, threatening, or harassing</li>
                  <li>Attempt to gain unauthorized access to other users' accounts or content</li>
                  <li>Use automated systems to scrape or collect data from the platform</li>
                  <li>Interfere with the proper functioning of the Service</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-600 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, 
                which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as outlined in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription and Payment Terms</h2>
              <div className="text-gray-600 space-y-3">
                <p><strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis. 
                All fees are non-refundable except as required by law or as specifically stated in our refund policy.</p>
                
                <p><strong>Price Changes:</strong> We reserve the right to modify our pricing. 
                Current subscribers will be notified at least 30 days before any price changes take effect.</p>
                
                <p><strong>Cancellation:</strong> You may cancel your subscription at any time. 
                Cancellation will take effect at the end of your current billing period.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Content Moderation</h2>
              <p className="text-gray-600 mb-4">
                While we don't pre-screen user content, we reserve the right to review and remove content that violates these Terms. 
                We may also suspend or terminate accounts that repeatedly violate our community guidelines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability</h2>
              <p className="text-gray-600 mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                We may temporarily suspend the Service for maintenance, updates, or in response to circumstances beyond our control.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the maximum extent permitted by law, StoryFoundry shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
                or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-600 mb-4">
                Either party may terminate this agreement at any time. Upon termination, your right to use the Service will cease immediately. 
                We will provide reasonable notice before terminating your account, except in cases of violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. 
                Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="text-gray-600">
                <p>Email: <a href="mailto:legal@storyfoundry.com" className="text-orange-600 hover:text-orange-700">legal@storyfoundry.com</a></p>
                <p>Address: StoryFoundry Inc., 123 Creative Avenue, Suite 456, San Francisco, CA 94105</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                These Terms of Service are effective as of the date listed above and will remain in effect except with respect to any changes in their provisions in the future, 
                which will be in effect immediately after being posted on this page.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Documents</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/privacy" className="text-orange-600 hover:text-orange-700 text-sm block p-3 bg-gray-50 rounded-lg">
              Privacy Policy
            </Link>
            <Link href="/help" className="text-orange-600 hover:text-orange-700 text-sm block p-3 bg-gray-50 rounded-lg">
              Help Center
            </Link>
            <Link href="/contact" className="text-orange-600 hover:text-orange-700 text-sm block p-3 bg-gray-50 rounded-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
