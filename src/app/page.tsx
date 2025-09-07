'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X, Star, Shield, Zap, Play, Check, Sparkles, TrendingUp, Award, Clock, Globe, ChevronRight, Users } from 'lucide-react'

// Navigation items
const navigation = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
]

// Footer links
const footerLinks = {
  product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Security', href: '/security' },
    { name: 'API', href: '/docs/api' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Community', href: '/community' },
    { name: 'Status', href: '/status' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookies', href: '/cookies' },
  ],
}

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SF</span>
            </div>
            <span className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">
              StoryFoundry
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-orange-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/signin"
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/app/dashboard"
              className="btn-primary group flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 p-6 mt-4 shadow-lg">
              <div className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-orange-500'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <hr className="border-gray-200" />
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/app/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary group flex items-center space-x-2 w-full justify-center"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Hero Statistics Component
const HeroStats = () => {
  const [counters, setCounters] = useState({ projects: 0, users: 0, revenue: 0 })
  
  useEffect(() => {
    const targets = { projects: 1247, users: 8943, revenue: 2.4 }
    const duration = 2000
    const steps = 60
    const stepTime = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setCounters({
        projects: Math.floor(targets.projects * progress),
        users: Math.floor(targets.users * progress),
        revenue: Number((targets.revenue * progress).toFixed(1))
      })
      
      if (currentStep >= steps) clearInterval(timer)
    }, stepTime)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="grid grid-cols-3 gap-8 mt-12">
      <div className="text-center">
        <div className="text-3xl font-bold text-gradient">{counters.projects.toLocaleString()}+</div>
        <div className="text-sm text-gray-600 mt-1">Projects Created</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-gradient">{counters.users.toLocaleString()}+</div>
        <div className="text-sm text-gray-600 mt-1">Active Creators</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-gold-gradient">${counters.revenue}M+</div>
        <div className="text-sm text-gray-600 mt-1">Revenue Generated</div>
      </div>
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay }: any) => (
  <div 
    className="card-modern group animate-slide-up" 
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start space-x-4">
      <div className="p-3 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-all duration-300">
        <Icon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-gradient transition-all duration-300">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
)

// Testimonial Component
const TestimonialCard = ({ name, role, company, content, avatar, rating }: any) => (
  <div className="card-modern">
    <div className="flex items-center space-x-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-orange-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
    <p className="text-gray-700 mb-6 leading-relaxed italic">"{content}"</p>
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
        {avatar}
      </div>
      <div>
        <div className="font-semibold text-gray-800">{name}</div>
        <div className="text-sm text-gray-600">{role} at {company}</div>
      </div>
    </div>
  </div>
)

// Floating Animation Component
const FloatingElement = ({ children, delay = 0 }: any) => (
  <div 
    className="animate-float" 
    style={{ animationDelay: `${delay}s` }}
  >
    {children}
  </div>
)

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6 py-16">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SF</span>
              </div>
              <span className="text-xl font-bold text-gray-800">StoryFoundry</span>
            </Link>
            <p className="text-gray-600 mb-6 max-w-sm">
              Where stories come to life through collaboration, protection, and innovation. 
              Empowering creators worldwide.
            </p>
            
            {/* Trust indicators */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

          {/* Link sections */}
          <div>
            <h4 className="text-gray-800 font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-800 font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-800 font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-800 font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-gray-200 pt-12 mb-8">
          <div className="max-w-md">
            <h4 className="text-gray-800 font-semibold mb-2">Stay Updated</h4>
            <p className="text-gray-600 mb-4 text-sm">
              Get the latest features and storytelling tips delivered to your inbox.
            </p>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                suppressHydrationWarning
              />
              <button className="btn-primary px-6">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-600 text-sm">
            © 2024 StoryFoundry. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>Made with ⚡ in San Francisco</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 hero-gradient"></div>
          
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <FloatingElement delay={0}>
              <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 blur-xl"></div>
            </FloatingElement>
            <FloatingElement delay={2}>
              <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 blur-xl"></div>
            </FloatingElement>
            <FloatingElement delay={4}>
              <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/10 to-yellow-500/10 blur-xl"></div>
            </FloatingElement>
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-2 mb-8">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Powered by Advanced AI</span>
                  <ChevronRight className="w-4 h-4 text-orange-600" />
                </div>
                
                <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-gray-800">
                  Create <span className="text-gradient">Cinematic</span><br />
                  Stories with AI
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Transform your ideas into Hollywood-quality screenplays, pitch decks, and production materials. 
                  StoryFoundry empowers creators with intelligent tools for every stage of storytelling.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <Link href="/app/dashboard" className="btn-primary group flex items-center space-x-2 text-lg px-8 py-4">
                    <span>Start Creating Free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <button className="btn-ghost group flex items-center space-x-2 text-lg px-8 py-4">
                    <Play className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </button>
                </div>
                
                <HeroStats />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Powerful Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Everything You Need to <span className="text-gradient">Succeed</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                From concept to production, our AI-powered platform provides comprehensive tools for modern storytellers.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Sparkles}
                title="AI Story Generation"
                description="Generate compelling narratives, character arcs, and plot structures with advanced AI that understands storytelling principles."
                delay={100}
              />
              <FeatureCard
                icon={Users}
                title="Real-time Collaboration"
                description="Work seamlessly with your team in real-time. Share feedback, track changes, and maintain version control effortlessly."
                delay={200}
              />
              <FeatureCard
                icon={TrendingUp}
                title="Market Analysis"
                description="Get insights into trending genres, audience preferences, and market opportunities to maximize your project's success."
                delay={300}
              />
              <FeatureCard
                icon={Shield}
                title="IP Protection"
                description="Built-in copyright protection and timestamping ensure your creative work is secure and legally protected."
                delay={400}
              />
              <FeatureCard
                icon={Award}
                title="Industry Standards"
                description="Export professional formats including Final Draft, PDF screenplays, and pitch deck templates used by Hollywood."
                delay={500}
              />
              <FeatureCard
                icon={Globe}
                title="Global Distribution"
                description="Connect with producers, investors, and distributors worldwide through our integrated marketplace platform."
                delay={600}
              />
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Trusted by <span className="text-gradient">Creative Professionals</span>
              </h2>
              <p className="text-xl text-gray-400">Join thousands of creators who have brought their stories to life</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                name="Sarah Chen"
                role="Screenwriter"
                company="Netflix"
                content="StoryFoundry transformed my writing process. The AI suggestions helped me break through writer's block and create my most compelling characters yet."
                avatar="SC"
                rating={5}
              />
              <TestimonialCard
                name="Marcus Rodriguez"
                role="Producer"
                company="A24 Films"
                content="The collaboration features are game-changing. Our entire team can work on projects simultaneously, and the version control is seamless."
                avatar="MR"
                rating={5}
              />
              <TestimonialCard
                name="Emma Thompson"
                role="Independent Filmmaker"
                company="Indie Studios"
                content="From script to pitch deck, StoryFoundry covers everything. I secured funding 3x faster with their professional presentation tools."
                avatar="ET"
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Create Your <span className="text-gradient">Masterpiece</span>?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the next generation of storytellers using AI to bring their visions to life. 
                Start your journey today with our free tier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/app/dashboard" className="btn-primary group flex items-center space-x-2 text-lg px-8 py-4 glow-effect">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link href="/pricing" className="btn-ghost group flex items-center space-x-2 text-lg px-8 py-4">
                  <span>View Pricing</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
