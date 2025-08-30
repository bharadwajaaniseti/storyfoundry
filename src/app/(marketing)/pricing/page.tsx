'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Star, Zap, Shield, Users, Crown, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

// Pricing plans
const plans = [
  {
    name: 'Starter',
    price: { monthly: 29, yearly: 290 },
    description: 'Perfect for individual creators and writers',
    features: [
      'Up to 5 active projects',
      'Basic AI writing assistance',
      'IP timestamping',
      'Standard templates',
      'Email support',
      '10GB storage'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
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
      'Custom branding'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: { monthly: 199, yearly: 1990 },
    description: 'For studios and large creative teams',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage',
      'White-label options',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

// FAQ data
const faqs = [
  {
    question: 'What is included in the free trial?',
    answer: 'All plans include a 14-day free trial with full access to features. No credit card required to start.'
  },
  {
    question: 'How does IP protection work?',
    answer: 'We use blockchain technology to create immutable timestamps of your work, providing legal proof of creation that\'s recognized globally.'
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, we\'ll provide a full refund.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade encryption and are SOC 2 compliant. Your intellectual property is protected with the highest security standards.'
  }
]

// Feature highlights
const features = [
  {
    icon: Shield,
    title: 'IP Protection',
    description: 'Blockchain-powered intellectual property protection'
  },
  {
    icon: Zap,
    title: 'AI Writing Assistant',
    description: 'Advanced AI tools for plot, character, and dialogue development'
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Real-time collaboration tools for teams and partners'
  }
]

// Pricing card component
const PricingCard = ({ plan, isYearly }: any) => (
  <div className={`pricing-card ${plan.popular ? 'featured' : ''} relative`}>
    <div className="text-center mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-800">
          ${isYearly ? plan.price.yearly : plan.price.monthly}
        </span>
        <span className="text-gray-600 ml-2">
          {isYearly ? '/year' : '/month'}
        </span>
        {isYearly && (
          <div className="text-sm text-orange-600 font-medium mt-2">
            Save ${(plan.price.monthly * 12) - plan.price.yearly}
          </div>
        )}
      </div>
    </div>
    
    <ul className="space-y-3 mb-8">
      {plan.features.map((feature: string, index: number) => (
        <li key={index} className="flex items-start space-x-3">
          <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700 text-sm">{feature}</span>
        </li>
      ))}
    </ul>
    
    <button className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center space-x-2`}>
      <span>{plan.cta}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
)

// FAQ component
const FAQItem = ({ faq, index }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-800 text-lg">{faq.question}</span>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? (
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChevronUp className="w-5 h-5 text-orange-600" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ChevronDown className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="mt-4 text-gray-600 leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  )
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-2 mb-8">
              <Crown className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Simple, Transparent Pricing</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-800">
              Choose Your <span className="text-gradient">Creative Plan</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Start for free, then choose a plan that grows with your creative ambitions. 
              All plans include our core features with no hidden fees.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-16">
              <div className="flex items-center space-x-4">
                <span className={`font-medium ${!isYearly ? 'text-gray-800' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isYearly ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isYearly ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`font-medium ${isYearly ? 'text-gray-800' : 'text-gray-500'}`}>
                  Yearly
                </span>
              </div>
              <div className="ml-4 w-24 flex justify-start">
                {isYearly && (
                  <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Save up to 20%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} isYearly={isYearly} />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">
              Why Choose <span className="text-gradient">StoryFoundry</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade tools that adapt to your creative workflow, backed by industry expertise.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-800">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about our plans and features.
              </p>
            </div>
            
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <FAQItem key={index} faq={faq} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              Ready to Start Your <span className="text-gradient">Creative Journey</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust StoryFoundry to protect and develop their stories.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app/signup" className="btn-primary group flex items-center space-x-2 text-lg px-8 py-4 glow-effect">
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/contact" className="btn-ghost group flex items-center space-x-2 text-lg px-8 py-4">
                <span>Contact Sales</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
