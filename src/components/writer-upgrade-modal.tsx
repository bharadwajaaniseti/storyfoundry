'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check, Star, Zap, Shield, Users, Crown, ChevronDown, ChevronUp } from 'lucide-react'

interface WriterUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

// Writer pricing plans
const writerPlans = [
  {
    name: 'Writer Starter',
    price: { monthly: 29, yearly: 290 },
    description: 'Perfect for individual creators and writers',
    features: [
      'Up to 5 active projects',
      'Basic AI writing assistance',
      'IP timestamping',
      'Standard templates',
      'Email support',
      '10GB storage',
      'Basic analytics'
    ],
    cta: 'Start Free Trial',
    popular: false,
    type: 'writer'
  },
  {
    name: 'Writer Professional',
    price: { monthly: 79, yearly: 790 },
    description: 'Ideal for serious creators and small teams',
    features: [
      'Unlimited projects',
      'Advanced AI writing assistance',
      'Blockchain IP protection',
      'Premium templates',
      'Collaboration tools',
      'Priority support',
      '100GB storage',
      'Custom branding',
      'Advanced analytics',
      'Pitch room access'
    ],
    cta: 'Start Free Trial',
    popular: true,
    type: 'writer'
  },
  {
    name: 'Writer Enterprise',
    price: { monthly: 199, yearly: 1990 },
    description: 'For studios and large creative teams',
    features: [
      'Everything in Writer Professional',
      'Unlimited team members',
      'Advanced analytics dashboard',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage',
      'White-label options',
      'SLA guarantee',
      'Custom contract management'
    ],
    cta: 'Contact Sales',
    popular: false,
    type: 'writer'
  }
]

function PricingCard({ plan, isYearly }: { plan: any; isYearly: boolean }) {
  return (
    <div className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
      plan.popular 
        ? 'border-orange-500 shadow-orange-100 shadow-lg scale-105' 
        : 'border-gray-200 hover:border-orange-300'
    }`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            ⭐ Most Popular
          </div>
        </div>
      )}
      
      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
          <p className="text-gray-600 mb-6">{plan.description}</p>
          
          <div className="mb-4">
            {plan.price.monthly === 0 ? (
              <div className="text-4xl font-bold text-gray-900">Free</div>
            ) : (
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold text-gray-900">
                  ${isYearly ? plan.price.yearly : plan.price.monthly}
                </span>
                <span className="text-gray-600 font-medium">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
            )}
          </div>
          
          {isYearly && plan.price.monthly > 0 && (
            <div className="text-sm font-semibold mt-3 px-3 py-1 rounded-full inline-block text-orange-700 bg-orange-100">
              Save ${(plan.price.monthly * 12) - plan.price.yearly}/year
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8 px-8">
        <ul className="space-y-4">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-orange-100">
                <Check className="w-3 h-3 text-orange-600" />
              </div>
              <span className="text-gray-700 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-8 pb-8">
        <button className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
          plan.popular
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}>
          {plan.cta}
        </button>
      </div>
    </div>
  )
}

export default function WriterUpgradeModal({ isOpen, onClose }: WriterUpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isScrollable = scrollHeight > clientHeight
    
    setShowScrollIndicator(isScrollable)
    setCanScrollUp(scrollTop > 20)
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 20)
  }

  useEffect(() => {
    if (isOpen) {
      // Check scroll on mount and after content loads
      setTimeout(checkScroll, 100)
      
      // Prevent background scroll
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden relative">
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
            <div className="bg-gradient-to-t from-gray-50 to-transparent h-8 w-full absolute -bottom-4"></div>
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-3 py-1 text-xs text-gray-500 font-medium animate-pulse">
              ↓ Scroll down
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto scrollbar-hide"
          style={{ 
            maxHeight: '90vh',
          }}
          onScroll={checkScroll}
        >
          {/* Header */}
          <div className="p-6 bg-white rounded-t-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Writer Plans</h2>
                  <p className="text-gray-600">Professional tools for serious creators</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <span className={`font-semibold text-lg ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                    isYearly ? 'bg-orange-500' : 'bg-gray-300'
                  } shadow-inner`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      isYearly ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`font-semibold text-lg ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                  Yearly
                </span>
              </div>
            </div>

            {/* Savings Badge */}
            <div className="flex justify-center mb-8 h-10 items-center">
              <div className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 transform ${
                isYearly 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-100 opacity-100' 
                  : 'bg-gray-200 text-gray-500 scale-95 opacity-0'
              }`}>
                💰 Save up to 20% with yearly billing
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="px-6 pb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {writerPlans.map((plan, index) => (
                <PricingCard key={plan.name} plan={plan} isYearly={isYearly} />
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="px-6 pb-8">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Professional Tools for Writers
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">IP Protection</h4>
                  <p className="text-gray-600">Blockchain-powered intellectual property protection for your creative works</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Writing Assistant</h4>
                  <p className="text-gray-600">Advanced AI tools for plot, character, and dialogue development</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Collaboration</h4>
                  <p className="text-gray-600">Real-time collaboration tools for teams and creative partners</p>
                </div>
              </div>
            </div>
          </div>

          {/* Money-back guarantee */}
          <div className="px-6 pb-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-green-100 border border-green-200 rounded-full px-6 py-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
