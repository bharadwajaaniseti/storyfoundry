'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Crown, Check, Star, BookOpen, Heart, Clock, Download, ChevronDown } from 'lucide-react'

interface ReaderUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReaderUpgradeModal({ isOpen, onClose }: ReaderUpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Check scroll position and update indicators
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    setCanScrollUp(scrollTop > 10)
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10)
    setShowScrollIndicator(scrollHeight > clientHeight)
  }

  useEffect(() => {
    if (isOpen) {
      checkScroll()
      const container = scrollContainerRef.current
      if (container) {
        container.addEventListener('scroll', checkScroll)
        window.addEventListener('resize', checkScroll)
        return () => {
          container.removeEventListener('scroll', checkScroll)
          window.removeEventListener('resize', checkScroll)
        }
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const plans = {
    free: {
      name: 'Reader Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for discovering great stories',
      features: [
        'Browse public story previews',
        'Follow favorite writers',
        'Basic reading lists',
        'Community discussions',
        'Email notifications'
      ]
    },
    plus: {
      name: 'Reader Plus',
      price: { monthly: 0.00, yearly: 0.00 },
      description: 'Enhanced reading experience with exclusive access',
      features: [
        'Everything in Reader Free',
        'Access to premium stories',
        'Ad-free reading experience',
        'Offline reading capabilities',
        'Early access to new releases',
        'Advanced reading analytics',
        'Priority customer support',
        'Unlimited bookmarks',
        'Custom reading themes'
      ]
    }
  }

  const handleUpgrade = (planType: 'plus') => {
    // TODO: Implement Stripe checkout or subscription logic
    // For now, just close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Scroll Indicator - Top */}
        {showScrollIndicator && canScrollUp && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gradient-to-b from-white to-transparent h-8 w-full absolute -top-4"></div>
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-3 py-1 text-xs text-gray-500 font-medium animate-pulse">
              ↑ Scroll up
            </div>
          </div>
        )}

        {/* Scroll Indicator - Bottom */}
        {showScrollIndicator && canScrollDown && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gradient-to-t from-white to-transparent h-8 w-full absolute -bottom-4"></div>
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-3 py-1 text-xs text-gray-500 font-medium animate-pulse">
              ↓ Scroll down
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Reading Experience</h2>
            <p className="text-gray-600">Choose the perfect plan for your reading journey</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto scrollbar-hide"
          style={{ 
            maxHeight: 'calc(90vh - 120px)',
          }}
          onScroll={checkScroll}
        >
          <div className="p-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="border border-gray-200 rounded-xl p-6 relative">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                  <span>{plans.free.name}</span>
                </h3>
                <p className="text-gray-600 text-sm mt-1">{plans.free.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">Free</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plans.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center text-sm font-medium">
                Current Plan
              </div>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-purple-500 rounded-xl p-6 relative bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>Most Popular</span>
                </span>
              </div>

              <div className="mb-4 mt-2">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <span>{plans.plus.name}</span>
                </h3>
                <p className="text-gray-600 text-sm mt-1">{plans.plus.description}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${billingPeriod === 'monthly' ? plans.plus.price.monthly : plans.plus.price.yearly}
                </span>
                <span className="text-gray-600 ml-2">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm text-green-600 font-medium">
                    Save ${(plans.plus.price.monthly * 12 - plans.plus.price.yearly).toFixed(2)} per year
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plans.plus.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('plus')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade to Plus</span>
              </button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-12 bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Why upgrade to Reader Plus?
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Premium Stories</h5>
                <p className="text-sm text-gray-600">
                  Access exclusive stories and early releases from top writers
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Ad-Free Experience</h5>
                <p className="text-sm text-gray-600">
                  Enjoy uninterrupted reading without any advertisements
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Offline Reading</h5>
                <p className="text-sm text-gray-600">
                  Download stories to read anywhere, even without internet
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              30-day money-back guarantee • Cancel anytime • Secure payment
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
