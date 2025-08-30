'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Star, Zap, Shield, Users, Crown, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

// Pricing plans for Readers
const readerPlans = [
  {
    name: 'Reader Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for discovering great stories',
    features: [
      'Browse public story previews',
      'Follow favorite writers',
      'Basic reading lists',
      'Community discussions',
      'Email notifications'
    ],
    cta: 'Start Reading',
    popular: false,
    type: 'reader'
  },
  {
    name: 'Reader Plus',
    price: { monthly: 9, yearly: 90 },
    description: 'Enhanced reading experience with exclusive access',
    features: [
      'Everything in Reader Free',
      'Access preview stories',
      'Request full story access',
      'Advanced reading lists',
      'Offline reading',
      'Early access to new releases',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true,
    type: 'reader'
  }
]

// Pricing plans for Writers
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

// FAQ data
const readerFaqs = [
  {
    question: 'What can I access with Reader Free?',
    answer: 'Reader Free gives you access to browse public story previews, follow writers, and participate in community discussions. Perfect for discovering new content!'
  },
  {
    question: 'How does story access work for readers?',
    answer: 'With Reader Plus, you can request access to full stories from writers. Writers can approve your requests, giving you exclusive access to their complete works.'
  },
  {
    question: 'Can I read stories offline?',
    answer: 'Yes! Reader Plus includes offline reading capabilities, so you can download approved stories and read them anywhere, even without internet connection.'
  },
  {
    question: 'Do you offer refunds for Reader Plus?',
    answer: 'Yes, we offer a 30-day money-back guarantee for Reader Plus. If you\'re not satisfied with the content access, we\'ll provide a full refund.'
  }
]

const writerFaqs = [
  {
    question: 'What is included in the free trial?',
    answer: 'All Writer plans include a 14-day free trial with full access to features. No credit card required to start creating your first project.'
  },
  {
    question: 'How does IP protection work?',
    answer: 'We use blockchain technology to create immutable timestamps of your work, providing legal proof of creation that\'s recognized globally and can help protect your intellectual property.'
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your Writer plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle.'
  },
  {
    question: 'Is my content secure?',
    answer: 'Yes, we use enterprise-grade encryption and are SOC 2 compliant. Your creative works are protected with the highest security standards and remain your intellectual property.'
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
const PricingCard = ({ plan, isYearly, planType }: any) => {
  const primaryColor = planType === 'reader' ? 'purple' : 'orange'
  
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
      plan.popular 
        ? (planType === 'reader' 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-white scale-105' 
            : 'border-orange-500 bg-gradient-to-br from-orange-50 to-white scale-105'
          )
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {plan.popular && (
        <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 ${
          planType === 'reader' ? 'bg-purple-500' : 'bg-orange-500'
        } text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg`}>
          Most Popular
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
        <p className="text-gray-600 mb-6 min-h-[3rem] flex items-center justify-center">{plan.description}</p>
        
        <div className="mb-6">
          {plan.price.monthly === 0 ? (
            <div className="text-5xl font-bold text-gray-900">Free</div>
          ) : (
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-bold text-gray-900">
                ${isYearly ? plan.price.yearly : plan.price.monthly}
              </span>
              <span className="text-gray-600 ml-2 text-lg">
                {isYearly ? '/year' : '/month'}
              </span>
            </div>
          )}
          {isYearly && plan.price.monthly > 0 && (
            <div className={`text-sm font-semibold mt-3 px-3 py-1 rounded-full inline-block ${
              planType === 'reader' 
                ? 'text-purple-700 bg-purple-100' 
                : 'text-orange-700 bg-orange-100'
            }`}>
              Save ${(plan.price.monthly * 12) - plan.price.yearly}/year
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <ul className="space-y-4">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                planType === 'reader' ? 'bg-purple-100' : 'bg-orange-100'
              }`}>
                <Check className={`w-3 h-3 ${
                  planType === 'reader' ? 'text-purple-600' : 'text-orange-600'
                }`} />
              </div>
              <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-auto">
        <button className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
          plan.popular 
            ? (planType === 'reader' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-200' 
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-orange-200'
              )
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
        }`}>
          <span>{plan.cta}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

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
  const [planType, setPlanType] = useState<'reader' | 'writer'>('writer')

  const currentPlans = planType === 'reader' ? readerPlans : writerPlans

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-24 pb-8 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-200 rounded-full px-6 py-3 mb-8">
              <Crown className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">Simple, Transparent Pricing</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-gray-900">
              Choose Your <span className="text-gradient">Creative Plan</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Whether you're a reader discovering amazing stories or a writer creating them, 
              we have the perfect plan for your creative journey.
            </p>
            
            {/* Plan Type Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-2 flex shadow-lg">
                <button
                  onClick={() => setPlanType('reader')}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    planType === 'reader'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📚 Reader Plans
                </button>
                <button
                  onClick={() => setPlanType('writer')}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    planType === 'writer'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  ✍️ Writer Plans
                </button>
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-4">
                <span className={`font-semibold text-lg ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                    isYearly ? (planType === 'reader' ? 'bg-purple-500' : 'bg-orange-500') : 'bg-gray-300'
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
            
            {/* Savings Badge - Fixed height container to prevent movement */}
            <div className="flex justify-center mb-8 h-10 items-center">
              <div className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 transform ${
                isYearly ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } ${
                planType === 'reader' 
                  ? 'text-purple-700 bg-purple-100 border border-purple-200' 
                  : 'text-orange-700 bg-orange-100 border border-orange-200'
              }`}>
                💰 Save up to 20%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {planType === 'reader' ? (
                <>
                  <span className="text-purple-600">Reader</span> Plans
                </>
              ) : (
                <>
                  <span className="text-orange-600">Writer</span> Plans
                </>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {planType === 'reader' 
                ? 'Discover amazing stories and connect with your favorite writers. Perfect for readers who want exclusive access to premium content.'
                : 'Create, protect, and share your stories with the world. Professional tools for serious writers and creative teams.'
              }
            </p>
          </div>
          
          <div className={`grid gap-8 max-w-7xl mx-auto ${
            planType === 'reader' 
              ? 'md:grid-cols-2 lg:max-w-4xl' 
              : 'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {currentPlans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} isYearly={isYearly} planType={planType} />
            ))}
          </div>

          {/* Money-back guarantee badge */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-6 py-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">30-day money-back guarantee</span>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Try any paid plan risk-free. If you're not completely satisfied, we'll refund your money within 30 days.
            </p>
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {planType === 'reader' 
                  ? 'Common questions about our reader plans and features.'
                  : 'Everything you need to know about our writer plans and features.'
                }
              </p>
            </div>
            
            <div className="space-y-4">
              {(planType === 'reader' ? readerFaqs : writerFaqs).map((faq, index) => (
                <FAQItem key={index} faq={faq} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your <span className={`${planType === 'reader' ? 'text-purple-400' : 'text-orange-400'}`}>Creative Journey</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              {planType === 'reader' 
                ? 'Join thousands of readers discovering amazing stories and connecting with talented writers.'
                : 'Join thousands of creators who trust StoryFoundry to protect and develop their stories.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/signup" 
                className={`flex items-center space-x-3 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                  planType === 'reader' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/contact" 
                className="flex items-center space-x-3 text-lg px-8 py-4 rounded-xl font-semibold border border-gray-400 text-gray-200 hover:bg-white hover:text-gray-900 transition-all duration-300"
              >
                <span>Contact Sales</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">50K+</div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">1M+</div>
                <div className="text-gray-400 text-sm">Stories Protected</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-gray-400 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-400 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
