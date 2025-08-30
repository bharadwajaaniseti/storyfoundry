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
    <div className={`pricing-card ${plan.popular ? 'featured' : ''} relative`}>
      {plan.popular && (
        <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${
          planType === 'reader' ? 'bg-purple-500' : 'bg-orange-500'
        } text-white px-4 py-2 rounded-full text-sm font-medium`}>
          Most Popular
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        
        <div className="mb-6">
          {plan.price.monthly === 0 ? (
            <span className="text-4xl font-bold text-gray-800">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-800">
                ${isYearly ? plan.price.yearly : plan.price.monthly}
              </span>
              <span className="text-gray-600 ml-2">
                {isYearly ? '/year' : '/month'}
              </span>
            </>
          )}
          {isYearly && plan.price.monthly > 0 && (
            <div className={`text-sm font-medium mt-2 ${
              planType === 'reader' ? 'text-purple-600' : 'text-orange-600'
            }`}>
              Save ${(plan.price.monthly * 12) - plan.price.yearly}
            </div>
          )}
        </div>
      </div>
      
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              planType === 'reader' ? 'text-purple-500' : 'text-orange-500'
            }`} />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button className={`w-full flex items-center justify-center space-x-2 ${
        plan.popular 
          ? (planType === 'reader' ? 'btn-purple' : 'btn-primary')
          : 'btn-secondary'
      }`}>
        <span>{plan.cta}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
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
              Whether you're a reader discovering amazing stories or a writer creating them, 
              we have the perfect plan for your creative journey.
            </p>
            
            {/* Plan Type Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-1 flex">
                <button
                  onClick={() => setPlanType('reader')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    planType === 'reader'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Reader Plans
                </button>
                <button
                  onClick={() => setPlanType('writer')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    planType === 'writer'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Writer Plans
                </button>
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-16">
              <div className="flex items-center space-x-4">
                <span className={`font-medium ${!isYearly ? 'text-gray-800' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isYearly ? (planType === 'reader' ? 'bg-purple-500' : 'bg-orange-500') : 'bg-gray-300'
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
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    planType === 'reader' 
                      ? 'text-purple-600 bg-purple-100' 
                      : 'text-orange-600 bg-orange-100'
                  }`}>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
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
            <p className="text-gray-600 max-w-2xl mx-auto">
              {planType === 'reader' 
                ? 'Discover amazing stories and connect with your favorite writers. Perfect for readers who want exclusive access to premium content.'
                : 'Create, protect, and share your stories with the world. Professional tools for serious writers and creative teams.'
              }
            </p>
          </div>
          
          <div className={`grid gap-8 max-w-6xl mx-auto ${
            planType === 'reader' ? 'lg:grid-cols-2 justify-center' : 'lg:grid-cols-3'
          }`}>
            {currentPlans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} isYearly={isYearly} planType={planType} />
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
                {planType === 'reader' 
                  ? 'Common questions about our reader plans and features.'
                  : 'Everything you need to know about our writer plans and features.'
                }
              </p>
            </div>
            
            <div className="space-y-0">
              {(planType === 'reader' ? readerFaqs : writerFaqs).map((faq, index) => (
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
