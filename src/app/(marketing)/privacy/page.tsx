'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {/* Introduction */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-800">Your Privacy Matters</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              At StoryFoundry, we take your privacy seriously. This policy explains how we collect, 
              use, and protect your personal information when you use our platform.
            </p>
          </div>

          {/* Information We Collect */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Information We Collect</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Account Information</h4>
                <p className="text-gray-600">
                  When you create an account, we collect your email address, display name, 
                  and any profile information you choose to provide.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Content Data</h4>
                <p className="text-gray-600">
                  We store the creative content you upload, including scripts, stories, 
                  and project metadata to provide our services.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Usage Information</h4>
                <p className="text-gray-600">
                  We collect information about how you use our platform to improve 
                  our services and user experience.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>To provide and maintain our services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To communicate with you about your account and our services</li>
              <li>To improve our platform and develop new features</li>
              <li>To protect against fraud and abuse</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-800">Data Protection</h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>End-to-end encryption for sensitive content</li>
              <li>Secure data centers and regular security audits</li>
              <li>Access controls and authentication systems</li>
              <li>Regular data backups and disaster recovery plans</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">Your Rights</h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Access and download your data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Restrict or object to certain data processing</li>
              <li>Data portability to other services</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Us</h3>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at{' '}
              <a href="mailto:privacy@storyfoundry.com" className="text-orange-600 hover:text-orange-700">
                privacy@storyfoundry.com
              </a>
            </p>
          </section>

          {/* Last Updated */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Last updated: August 30, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
