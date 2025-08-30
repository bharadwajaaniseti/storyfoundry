'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, MessageSquare, Mail, Phone, Clock } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Help & Support</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <HelpCircle className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-800">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-6">
                {/* Getting Started */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Getting Started</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-orange-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">How do I create my first project?</h4>
                      <p className="text-gray-600">
                        Click the "New Project" button on your dashboard, fill in the basic information 
                        like title and logline, select your format (screenplay, novel, etc.), and start writing!
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">What's the difference between Writer and Reader accounts?</h4>
                      <p className="text-gray-600">
                        Writers can create and manage projects, while Readers can discover and access 
                        content shared by writers. Writers focus on creation, Readers focus on consumption and feedback.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account & Billing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account & Billing</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">How do I upgrade my account?</h4>
                      <p className="text-gray-600">
                        Go to Settings → Subscription and choose your preferred plan. We accept all major 
                        credit cards and process payments securely through Stripe.
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">Can I cancel my subscription anytime?</h4>
                      <p className="text-gray-600">
                        Yes, you can cancel your subscription at any time. You'll continue to have access 
                        to premium features until the end of your current billing period.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">What is IP protection and how does it work?</h4>
                      <p className="text-gray-600">
                        IP protection creates timestamped records of your content to help establish creation dates. 
                        This can be valuable for intellectual property purposes and is available on Writer Plus plans.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">How do collaborations work?</h4>
                      <p className="text-gray-600">
                        Invite team members to your projects and assign roles like co-author, editor, or producer. 
                        You can also set royalty splits for revenue sharing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Support</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-purple-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">My content isn't saving. What should I do?</h4>
                      <p className="text-gray-600">
                        Try refreshing the page and logging in again. If the problem persists, 
                        check your internet connection and contact support if needed.
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">Can I export my projects?</h4>
                      <p className="text-gray-600">
                        Yes! You can export your projects as PDF or DOCX files using the export 
                        options in the project editor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-6">
            {/* Contact Options */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-800">Contact Support</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-700">Email Support</p>
                    <p className="text-sm text-gray-600">support@storyfoundry.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-700">Phone Support</p>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-xs text-gray-500">Pro+ members only</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-700">Support Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri: 9AM-6PM PST</p>
                    <p className="text-xs text-gray-500">Emergency support 24/7</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 btn-primary">
                Contact Support
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/features" className="block text-orange-600 hover:text-orange-700">
                  Platform Features
                </Link>
                <Link href="/pricing" className="block text-orange-600 hover:text-orange-700">
                  Pricing Plans
                </Link>
                <Link href="/privacy" className="block text-orange-600 hover:text-orange-700">
                  Privacy Policy
                </Link>
                <Link href="/about" className="block text-orange-600 hover:text-orange-700">
                  About Us
                </Link>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Last updated: 2 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
