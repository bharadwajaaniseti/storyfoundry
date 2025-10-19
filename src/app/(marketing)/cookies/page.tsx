'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cookie, Shield, Settings, Eye, CheckCircle, Info, ArrowRight, AlertCircle } from 'lucide-react'

const cookieCategories = [
  {
    id: 'essential',
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be disabled in our systems.',
    required: true,
    cookies: [
      { name: 'session_id', purpose: 'Maintains user session and login state', duration: '2 weeks' },
      { name: 'csrf_token', purpose: 'Prevents cross-site request forgery attacks', duration: 'Session' },
      { name: 'cookie_consent', purpose: 'Stores your cookie preferences', duration: '1 year' }
    ]
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization.',
    required: false,
    cookies: [
      { name: 'user_preferences', purpose: 'Stores UI preferences and settings', duration: '1 year' },
      { name: 'language', purpose: 'Remembers your language preference', duration: '1 year' },
      { name: 'theme', purpose: 'Stores light/dark mode preference', duration: '1 year' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors use our website.',
    required: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - distinguishes users', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics - distinguishes users', duration: '24 hours' },
      { name: '_gat', purpose: 'Google Analytics - throttles request rate', duration: '1 minute' }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing Cookies',
    description: 'These cookies track your activity to help us deliver more relevant advertising.',
    required: false,
    cookies: [
      { name: 'ads_tracking', purpose: 'Tracks ad campaign performance', duration: '90 days' },
      { name: 'conversion_pixel', purpose: 'Measures conversion from ads', duration: '90 days' }
    ]
  }
]

const CookieCategoryCard = ({ category, enabled, onToggle }: any) => (
  <div className="card-modern p-6 mb-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
      </div>
      <div className="ml-4">
        {category.required ? (
          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">
            Always Active
          </span>
        ) : (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => onToggle(category.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        )}
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Cookies in this category:</h4>
      <div className="space-y-3">
        {category.cookies.map((cookie: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-mono text-gray-800">{cookie.name}</span>
              <span className="text-xs text-gray-500">{cookie.duration}</span>
            </div>
            <p className="text-xs text-gray-600">{cookie.purpose}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default function CookiesPage() {
  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false
  })

  const handleToggle = (categoryId: string) => {
    setCookieSettings(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId as keyof typeof prev]
    }))
  }

  const handleAcceptAll = () => {
    setCookieSettings({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    })
  }

  const handleRejectAll = () => {
    setCookieSettings({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    })
  }

  const handleSavePreferences = () => {
    // Save cookie preferences
    console.log('Saving preferences:', cookieSettings)
    // In a real app, this would save to localStorage and update consent
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-2 mb-8">
              <Cookie className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Cookie Policy</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Cookie <span className="text-gradient">Policy</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Learn about how StoryFoundry uses cookies and similar technologies to improve your experience.
            </p>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Info className="w-4 h-4" />
                <span>Last updated: October 19, 2024</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-8 bg-gradient-to-br from-blue-50 to-purple-50">
              <h2 className="text-2xl font-bold mb-6 text-center">Cookie Policy Summary</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Essential Only</h3>
                  <p className="text-sm text-gray-600">Required for basic website functionality</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Customizable</h3>
                  <p className="text-sm text-gray-600">Control which cookies you allow</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Privacy First</h3>
                  <p className="text-sm text-gray-600">We respect your privacy choices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">What Are Cookies?</h2>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="mb-4 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our service.
              </p>
              
              <p className="mb-4 leading-relaxed">
                We use both session cookies (which expire when you close your browser) and persistent 
                cookies (which stay on your device for a set period or until you delete them).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Categories & Management */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">
              Manage Your <span className="text-gradient">Cookie Preferences</span>
            </h2>
            
            <div className="mb-8 card-modern p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 leading-relaxed">
                  <strong>Note:</strong> Disabling certain cookies may impact your experience on StoryFoundry. 
                  Essential cookies cannot be disabled as they are necessary for the website to function.
                </div>
              </div>
            </div>
            
            {cookieCategories.map((category) => (
              <CookieCategoryCard
                key={category.id}
                category={category}
                enabled={cookieSettings[category.id as keyof typeof cookieSettings]}
                onToggle={handleToggle}
              />
            ))}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleAcceptAll}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Accept All Cookies</span>
              </button>
              
              <button
                onClick={handleRejectAll}
                className="btn-secondary flex-1"
              >
                Reject Non-Essential
              </button>
              
              <button
                onClick={handleSavePreferences}
                className="btn-secondary flex-1"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Third-Party Cookies */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Third-Party Cookies</h2>
            
            <div className="prose prose-lg max-w-none text-gray-600 mb-8">
              <p className="mb-4 leading-relaxed">
                We work with trusted third-party services that may also set cookies on your device. 
                These include:
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-modern p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Google Analytics</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Helps us understand how visitors use our website through anonymous analytics data.
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm font-semibold inline-flex items-center space-x-1"
                >
                  <span>Privacy Policy</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Stripe</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Processes payments securely and prevents fraudulent transactions.
                </p>
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm font-semibold inline-flex items-center space-x-1"
                >
                  <span>Privacy Policy</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Intercom</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Powers our customer support chat and helps us provide better service.
                </p>
                <a
                  href="https://www.intercom.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-sm font-semibold inline-flex items-center space-x-1"
                >
                  <span>Privacy Policy</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              
              <div className="card-modern p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Social Media</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Social media platforms may set cookies when you interact with embedded content.
                </p>
                <span className="text-sm text-gray-500">Various providers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browser Controls */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Browser Cookie Controls</h2>
            
            <div className="prose prose-lg max-w-none text-gray-600 mb-6">
              <p className="mb-4 leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can typically:
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-modern p-6">
                <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">View Cookies</h3>
                <p className="text-sm text-gray-600">See what cookies are stored in your browser</p>
              </div>
              
              <div className="card-modern p-6">
                <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">Delete Cookies</h3>
                <p className="text-sm text-gray-600">Remove all or specific cookies from your device</p>
              </div>
              
              <div className="card-modern p-6">
                <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">Block Cookies</h3>
                <p className="text-sm text-gray-600">Prevent websites from setting new cookies</p>
              </div>
              
              <div className="card-modern p-6">
                <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">Configure Privacy</h3>
                <p className="text-sm text-gray-600">Set cookie preferences for all websites</p>
              </div>
            </div>
            
            <div className="mt-8 card-modern p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Warning:</strong> If you disable cookies entirely, some features of StoryFoundry 
                  may not work properly. We recommend using our cookie preference controls above instead.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Related Links */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-12 text-center bg-gradient-to-br from-orange-50 to-red-50">
              <h2 className="text-3xl font-bold mb-4">Questions About Cookies?</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                If you have any questions about our cookie policy or how we use cookies, 
                please don't hesitate to contact us.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/contact" className="btn-primary">
                  Contact Us
                </Link>
                <Link href="/privacy" className="btn-secondary">
                  Privacy Policy
                </Link>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Email: <a href="mailto:privacy@storyfoundry.com" className="text-orange-600 hover:text-orange-700 font-semibold">privacy@storyfoundry.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
