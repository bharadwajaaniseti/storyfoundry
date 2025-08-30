'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Lightbulb, Users, Zap, FileText, Brain, Palette, Globe, Lock, Clock, Star, CheckCircle, Play, Monitor, Smartphone, Code, Download, Layers, Settings, BarChart3 } from 'lucide-react'

// Feature categories
const featureCategories = [
  {
    id: 'ai-tools',
    name: 'AI-Powered Tools',
    description: 'Revolutionary AI assistance for every stage of storytelling',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    description: 'Seamless team workflows and real-time collaboration',
    icon: Users,
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    id: 'protection',
    name: 'IP Protection',
    description: 'Blockchain-powered intellectual property security',
    icon: Shield,
    gradient: 'from-green-500 to-blue-500'
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Professional tools that streamline your creative process',
    icon: Zap,
    gradient: 'from-orange-500 to-red-500'
  }
]

// Main features
const features = [
  {
    category: 'ai-tools',
    title: 'StoryAI Assistant',
    description: 'Get intelligent suggestions for plot development, character arcs, and dialogue enhancement.',
    icon: Brain,
    benefits: ['Plot hole detection', 'Character consistency checks', 'Genre-specific suggestions', 'Real-time feedback'],
    demo: 'Watch Demo'
  },
  {
    category: 'ai-tools',
    title: 'Logline Generator',
    description: 'Transform your story concepts into compelling, market-ready loglines with AI assistance.',
    icon: FileText,
    benefits: ['Multiple variations', 'Industry standard format', 'Market analysis', 'Instant feedback'],
    demo: 'Try Now'
  },
  {
    category: 'ai-tools',
    title: 'Coverage Analysis',
    description: 'Get professional-grade script coverage and analysis powered by industry knowledge.',
    icon: BarChart3,
    benefits: ['Detailed feedback', 'Market potential scoring', 'Industry benchmarks', 'Improvement suggestions'],
    demo: 'See Example'
  },
  {
    category: 'collaboration',
    title: 'Real-time Collaboration',
    description: 'Work together seamlessly with writers, producers, and development teams.',
    icon: Users,
    benefits: ['Live editing', 'Version control', 'Comment system', 'Role-based permissions'],
    demo: 'Experience Live'
  },
  {
    category: 'collaboration',
    title: 'Pitch Rooms',
    description: 'Virtual spaces for presenting and developing projects with industry professionals.',
    icon: Monitor,
    benefits: ['Video conferencing', 'Screen sharing', 'Interactive feedback', 'Recording capability'],
    demo: 'Join Room'
  },
  {
    category: 'collaboration',
    title: 'Project Management',
    description: 'Track development stages, deadlines, and team progress with visual dashboards.',
    icon: Settings,
    benefits: ['Timeline tracking', 'Milestone management', 'Team analytics', 'Automated reporting'],
    demo: 'View Dashboard'
  },
  {
    category: 'protection',
    title: 'Blockchain Timestamping',
    description: 'Immutable proof of creation with legally recognized blockchain certificates.',
    icon: Clock,
    benefits: ['Legal protection', 'Tamper-proof records', 'Global recognition', 'Instant verification'],
    demo: 'Get Certificate'
  },
  {
    category: 'protection',
    title: 'Secure Sharing',
    description: 'Share your work safely with encrypted links, watermarks, and access controls.',
    icon: Lock,
    benefits: ['Encrypted storage', 'Access expiration', 'Download tracking', 'Watermark protection'],
    demo: 'Share Securely'
  },
  {
    category: 'protection',
    title: 'Rights Management',
    description: 'Track ownership, licensing, and revenue sharing across all your projects.',
    icon: Shield,
    benefits: ['Ownership tracking', 'Revenue splits', 'License management', 'Legal templates'],
    demo: 'Manage Rights'
  },
  {
    category: 'productivity',
    title: 'Professional Formatting',
    description: 'Industry-standard formatting for scripts, treatments, and pitch decks.',
    icon: FileText,
    benefits: ['Auto-formatting', 'Multiple templates', 'Export options', 'Industry compliance'],
    demo: 'Format Script'
  },
  {
    category: 'productivity',
    title: 'Multi-Device Sync',
    description: 'Access your projects anywhere with seamless synchronization across all devices.',
    icon: Smartphone,
    benefits: ['Cloud storage', 'Offline access', 'Auto-sync', 'Cross-platform'],
    demo: 'Sync Now'
  },
  {
    category: 'productivity',
    title: 'Export & Integration',
    description: 'Export to popular formats and integrate with industry-standard tools.',
    icon: Download,
    benefits: ['PDF export', 'Final Draft compatibility', 'API access', 'Custom integrations'],
    demo: 'Export Options'
  }
]

// Feature showcase component
const FeatureShowcase = ({ feature, index }: any) => (
  <div className="card-modern p-8 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
    <div className="flex items-start space-x-6">
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex-shrink-0">
        <feature.icon className="w-8 h-8 text-blue-400" />
      </div>
      
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
        
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {feature.benefits.map((benefit: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
        
        <button className="btn-secondary group flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span>{feature.demo}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  </div>
)

// Category filter component
const CategoryFilter = ({ categories, activeCategory, onCategoryChange }: any) => (
  <div className="flex flex-wrap justify-center gap-4 mb-16">
    <button
      onClick={() => onCategoryChange('all')}
      className={`px-6 py-3 rounded-full transition-all duration-300 ${
        activeCategory === 'all'
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
          : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
      }`}
    >
      All Features
    </button>
    {categories.map((category: any) => (
      <button
        key={category.id}
        onClick={() => onCategoryChange(category.id)}
        className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center space-x-2 ${
          activeCategory === category.id
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
        }`}
      >
        <category.icon className="w-4 h-4" />
        <span>{category.name}</span>
      </button>
    ))}
  </div>
)

// Stats component
const FeatureStats = () => {
  const [stats, setStats] = useState({ features: 0, updates: 0, uptime: 0, satisfaction: 0 })
  
  useEffect(() => {
    const targets = { features: 50, updates: 24, uptime: 99.9, satisfaction: 98 }
    const duration = 2000
    const steps = 60
    const stepTime = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setStats({
        features: Math.floor(targets.features * progress),
        updates: Math.floor(targets.updates * progress),
        uptime: Number((targets.uptime * progress).toFixed(1)),
        satisfaction: Math.floor(targets.satisfaction * progress)
      })
      
      if (currentStep >= steps) clearInterval(timer)
    }, stepTime)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <div className="text-3xl font-bold text-gradient mb-2">{stats.features}+</div>
        <div className="text-gray-600">Features</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gradient mb-2">{stats.updates}/7</div>
        <div className="text-gray-600">Updates/Week</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gradient mb-2">{stats.uptime}%</div>
        <div className="text-gray-600">Uptime</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gradient mb-2">{stats.satisfaction}%</div>
        <div className="text-gray-600">Satisfaction</div>
      </div>
    </div>
  )
}

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredFeatures = activeCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === activeCategory)

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-8">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Powerful Features</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Everything You Need to Create <span className="text-gradient">Amazing Stories</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                From AI-powered writing assistance to blockchain IP protection, StoryFoundry provides 
                professional-grade tools that adapt to your creative workflow.
              </p>
              
              <FeatureStats />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Categories Overview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Choose Your <span className="text-gradient">Creative Power</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive suite of tools designed for every aspect of the storytelling process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {featureCategories.map((category, index) => (
              <div key={category.id} className="card-modern text-center p-6 animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.gradient} flex items-center justify-center mx-auto mb-4`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{category.name}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Filter and List */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <CategoryFilter 
            categories={featureCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          
          <div className="space-y-8 max-w-6xl mx-auto">
            {filteredFeatures.map((feature, index) => (
              <FeatureShowcase key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Seamless <span className="text-gradient">Integrations</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect StoryFoundry with your favorite tools and platforms for a unified creative workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: 'Final Draft', icon: FileText },
              { name: 'Google Drive', icon: Globe },
              { name: 'Dropbox', icon: Layers },
              { name: 'Slack', icon: Users },
              { name: 'Zoom', icon: Monitor },
              { name: 'Adobe', icon: Palette }
            ].map((integration, index) => (
              <div key={integration.name} className="card-modern text-center p-6 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <integration.icon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-medium">{integration.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Built for <span className="text-gradient">Developers</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Integrate StoryFoundry's powerful features into your own applications with our comprehensive API.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">RESTful API with full documentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Webhook support for real-time updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">SDKs for popular programming languages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Sandbox environment for testing</span>
                </div>
              </div>
              
              <Link href="/docs/api" className="btn-primary group flex items-center space-x-2 w-fit">
                <Code className="w-5 h-5" />
                <span>API Documentation</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="card-modern p-8">
              <div className="bg-gray-900/50 rounded-lg p-6 font-mono text-sm">
                <div className="text-green-400 mb-2">// Initialize StoryFoundry API</div>
                <div className="text-blue-400">const</div> <span className="text-white">storyforge</span> = <span className="text-blue-400">new</span> <span className="text-yellow-400">StoryFoundry</span>({'{'}
                <div className="ml-4 text-gray-300">
                  apiKey: <span className="text-green-300">'your-api-key'</span>,<br/>
                  environment: <span className="text-green-300">'production'</span>
                </div>
                {'}'});
                
                <div className="mt-4 text-green-400">// Create a new project</div>
                <div className="text-blue-400">const</div> <span className="text-white">project</span> = <span className="text-blue-400">await</span> <span className="text-white">storyforge</span>.<span className="text-yellow-400">projects</span>.<span className="text-blue-400">create</span>({'{'}
                <div className="ml-4 text-gray-300">
                  title: <span className="text-green-300">'My Screenplay'</span>,<br/>
                  type: <span className="text-green-300">'screenplay'</span>,<br/>
                  genre: <span className="text-green-300">'thriller'</span>
                </div>
                {'}'});
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your <span className="text-gradient">Creative Process</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using StoryFoundry to bring their stories to life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app/dashboard" className="btn-primary group flex items-center space-x-2 text-lg px-8 py-4 glow-effect">
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/pricing" className="btn-ghost group flex items-center space-x-2 text-lg px-8 py-4">
                <span>View Pricing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
