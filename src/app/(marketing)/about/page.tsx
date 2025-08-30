'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Target, Users, Lightbulb, Award, Globe, Zap, Heart, Clock, TrendingUp, Star, CheckCircle, Shield } from 'lucide-react'

// Team member data
const teamMembers = [
  {
    name: 'Sarah Chen',
    role: 'Co-Founder & CEO',
    bio: 'Former Netflix executive with 10+ years in content development. Led acquisition of $2B+ worth of original content.',
    avatar: 'SC',
    color: 'from-blue-500 to-purple-500'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Co-Founder & CTO',
    bio: 'Ex-Google AI researcher specializing in natural language processing. PhD in Computer Science from Stanford.',
    avatar: 'MR',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Emma Thompson',
    role: 'Head of Product',
    bio: 'Former Apple product designer. Led design teams for consumer-facing applications used by millions.',
    avatar: 'ET',
    color: 'from-pink-500 to-red-500'
  },
  {
    name: 'David Kim',
    role: 'Head of AI Research',
    bio: 'Former OpenAI researcher focused on creative AI applications. Published 20+ papers on language models.',
    avatar: 'DK',
    color: 'from-green-500 to-blue-500'
  }
]

// Company values
const values = [
  {
    icon: Heart,
    title: 'Creator-First',
    description: 'Every decision we make prioritizes the needs and success of storytellers worldwide.'
  },
  {
    icon: Shield,
    title: 'IP Protection',
    description: 'We believe creators deserve complete ownership and protection of their intellectual property.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We push the boundaries of what\'s possible with AI while maintaining human creativity at the core.'
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Stories have the power to change the world. We\'re building tools to amplify that impact.'
  }
]

// Timeline data
const timeline = [
  {
    year: '2023',
    quarter: 'Q1',
    title: 'The Spark',
    description: 'Founded by Sarah and Marcus after witnessing countless talented writers struggle with industry barriers.'
  },
  {
    year: '2023',
    quarter: 'Q2',
    title: 'First Investment',
    description: 'Raised $2M seed round from Andreessen Horowitz and leading entertainment industry executives.'
  },
  {
    year: '2023',
    quarter: 'Q3',
    title: 'Beta Launch',
    description: 'Launched private beta with 100 select screenwriters and producers. Average user engagement: 4.2 hours/day.'
  },
  {
    year: '2024',
    quarter: 'Q1',
    title: 'Public Launch',
    description: 'Opened platform to all creators. Reached 10,000+ users in first month with 98% satisfaction rate.'
  },
  {
    year: '2024',
    quarter: 'Q2',
    title: 'AI Breakthrough',
    description: 'Launched proprietary StoryAI model, trained on 50,000+ successful scripts and treatments.'
  },
  {
    year: '2024',
    quarter: 'Q4',
    title: 'Today',
    description: 'Serving 50,000+ creators worldwide. $2.4M+ in creator revenue generated through our platform.'
  }
]

// Stats component
const StatsCounter = () => {
  const [stats, setStats] = useState({ creators: 0, stories: 0, revenue: 0, countries: 0 })
  
  useEffect(() => {
    const targets = { creators: 50000, stories: 125000, revenue: 2.4, countries: 85 }
    const duration = 2500
    const steps = 60
    const stepTime = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setStats({
        creators: Math.floor(targets.creators * progress),
        stories: Math.floor(targets.stories * progress),
        revenue: Number((targets.revenue * progress).toFixed(1)),
        countries: Math.floor(targets.countries * progress)
      })
      
      if (currentStep >= steps) clearInterval(timer)
    }, stepTime)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="text-center">
        <div className="text-4xl font-bold text-gradient mb-2">{stats.creators.toLocaleString()}+</div>
        <div className="text-gray-400">Active Creators</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-gradient mb-2">{stats.stories.toLocaleString()}+</div>
        <div className="text-gray-400">Stories Created</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-gold-gradient mb-2">${stats.revenue}M+</div>
        <div className="text-gray-400">Creator Revenue</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-gradient mb-2">{stats.countries}+</div>
        <div className="text-gray-400">Countries</div>
      </div>
    </div>
  )
}

// Team card component
const TeamCard = ({ member, index }: any) => (
  <div className="card-modern animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
    <div className="text-center mb-4">
      <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${member.color} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
        {member.avatar}
      </div>
      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
      <p className="text-blue-400 mb-3">{member.role}</p>
    </div>
    <p className="text-gray-400 text-center">{member.bio}</p>
  </div>
)

// Value card component
const ValueCard = ({ value, index }: any) => (
  <div className="card-modern animate-slide-up" style={{ animationDelay: `${index * 200}ms` }}>
    <div className="flex items-start space-x-4">
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
        <value.icon className="w-6 h-6 text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
        <p className="text-gray-400">{value.description}</p>
      </div>
    </div>
  </div>
)

// Timeline item component
const TimelineItem = ({ item, index }: any) => (
  <div className="flex items-start space-x-6 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
    <div className="flex-shrink-0">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        {item.quarter}
      </div>
    </div>
    <div className="flex-1 pb-8">
      <div className="flex items-center space-x-3 mb-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <span className="text-sm text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">{item.year}</span>
      </div>
      <p className="text-gray-400">{item.description}</p>
    </div>
  </div>
)

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-8">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Our Mission</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Empowering the Next Generation of <span className="text-gradient">Storytellers</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                We believe every great story deserves to be told. StoryFoundry combines cutting-edge AI with industry expertise 
                to democratize storytelling and help creators turn their visions into reality.
              </p>
              
              <StatsCounter />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Our <span className="text-gradient">Vision</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                A world where every storyteller—regardless of background, connections, or resources—has the tools 
                and opportunity to bring their stories to life and reach global audiences.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Democratize access to professional storytelling tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Protect intellectual property with blockchain technology</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Connect creators with industry professionals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Enable global distribution and monetization</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="card-modern p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <Lightbulb className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">The Problem We Solve</h3>
                    <p className="text-gray-400">Breaking down industry barriers</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  The entertainment industry has historically been gatekept by a small number of studios and agencies. 
                  Talented creators often struggle to get their work seen, properly protected, or fairly compensated. 
                  We're changing that with technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              These principles guide every decision we make and feature we build.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <ValueCard key={value.title} value={value} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Meet Our <span className="text-gradient">Team</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Industry veterans and AI experts united by a passion for empowering creators.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <TeamCard key={member.name} member={member} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Our <span className="text-gradient">Journey</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From a simple idea to empowering thousands of creators worldwide.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <TimelineItem key={`${item.year}-${item.quarter}`} item={item} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Backed by <span className="text-gradient">Industry Leaders</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Supported by top-tier investors who believe in democratizing storytelling.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card-modern text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                a16z
              </div>
              <h3 className="text-lg font-semibold mb-2">Andreessen Horowitz</h3>
              <p className="text-gray-400">Leading venture capital firm investing in the future of media and entertainment.</p>
            </div>
            
            <div className="card-modern text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                CAA
              </div>
              <h3 className="text-lg font-semibold mb-2">CAA Ventures</h3>
              <p className="text-gray-400">Strategic investment arm of Creative Artists Agency, connecting us to Hollywood.</p>
            </div>
            
            <div className="card-modern text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                WME
              </div>
              <h3 className="text-lg font-semibold mb-2">WME Ventures</h3>
              <p className="text-gray-400">Investment fund from William Morris Endeavor, supporting creator economy innovations.</p>
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
              Ready to Join Our <span className="text-gradient">Mission</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Whether you're a creator, investor, or industry professional, there's a place for you in the StoryFoundry community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app/dashboard" className="btn-primary group flex items-center space-x-2 text-lg px-8 py-4 glow-effect">
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/careers" className="btn-ghost group flex items-center space-x-2 text-lg px-8 py-4">
                <span>Join Our Team</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
