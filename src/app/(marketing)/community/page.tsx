'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, MessageSquare, BookOpen, Mic, Calendar, Trophy, Heart, Sparkles, ArrowRight, ExternalLink, Github, Twitter, Youtube, TrendingUp } from 'lucide-react'

const communityStats = [
  { label: 'Active Members', value: '12,500+', icon: Users },
  { label: 'Stories Shared', value: '45,000+', icon: BookOpen },
  { label: 'Monthly Events', value: '20+', icon: Calendar },
  { label: 'Expert Mentors', value: '150+', icon: Trophy }
]

const communityChannels = [
  {
    icon: MessageSquare,
    title: 'Discord Community',
    description: 'Join 10K+ creators in our active Discord server. Get real-time feedback, share your work, and connect with fellow storytellers.',
    members: '10,247 members',
    link: 'https://discord.gg/storyfoundry',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Github,
    title: 'GitHub Discussions',
    description: 'Technical discussions, feature requests, and open-source contributions. Perfect for developers building on our platform.',
    members: '1,892 members',
    link: 'https://github.com/storyfoundry/community',
    color: 'from-gray-700 to-gray-900'
  },
  {
    icon: Twitter,
    title: 'Twitter Community',
    description: 'Follow along for product updates, writing tips, and showcase your work to our Twitter audience.',
    members: '8,431 followers',
    link: 'https://twitter.com/storyfoundry',
    color: 'from-blue-400 to-blue-600'
  },
  {
    icon: Youtube,
    title: 'YouTube Channel',
    description: 'Tutorials, workshops, creator spotlights, and behind-the-scenes content from the StoryFoundry team.',
    members: '5,623 subscribers',
    link: 'https://youtube.com/@storyfoundry',
    color: 'from-red-500 to-red-700'
  }
]

const upcomingEvents = [
  {
    title: 'Screenwriting Workshop',
    date: 'Nov 15, 2024',
    time: '2:00 PM PST',
    type: 'Workshop',
    host: 'Sarah Chen',
    description: 'Learn the fundamentals of compelling screenplay structure.',
    attendees: 145,
    spots: 200
  },
  {
    title: 'AI Writing Tools Demo',
    date: 'Nov 18, 2024',
    time: '11:00 AM PST',
    type: 'Demo',
    host: 'StoryFoundry Team',
    description: 'Live demonstration of our latest AI features.',
    attendees: 89,
    spots: 150
  },
  {
    title: 'Creator Spotlight: SciFi Week',
    date: 'Nov 22, 2024',
    time: '4:00 PM PST',
    type: 'Community',
    host: 'Community Team',
    description: 'Showcase your best science fiction stories.',
    attendees: 234,
    spots: 500
  },
  {
    title: 'Monthly Writing Challenge',
    date: 'Dec 1, 2024',
    time: 'All Day',
    type: 'Challenge',
    host: 'Community',
    description: 'Monthly prompt-based writing competition with prizes.',
    attendees: 678,
    spots: 1000
  }
]

const communityPrograms = [
  {
    icon: Mic,
    title: 'Creator Spotlight',
    description: 'Get featured on our blog, social media, and newsletter. Share your story with thousands of creators.',
    badge: 'Apply Now'
  },
  {
    icon: Trophy,
    title: 'Writing Challenges',
    description: 'Monthly themed challenges with cash prizes, pro memberships, and recognition in our community.',
    badge: 'Join Challenge'
  },
  {
    icon: Heart,
    title: 'Mentor Program',
    description: 'Connect with experienced writers and industry professionals for one-on-one guidance.',
    badge: 'Find Mentor'
  },
  {
    icon: BookOpen,
    title: 'Resource Library',
    description: 'Access exclusive guides, templates, and educational content from industry experts.',
    badge: 'Browse Library'
  }
]

const testimonials = [
  {
    name: 'Alex Thompson',
    role: 'Screenplay Writer',
    avatar: 'AT',
    content: 'The StoryFoundry community helped me refine my first screenplay. The feedback was constructive and the connections invaluable.',
    color: 'from-blue-500 to-purple-500'
  },
  {
    name: 'Maria Garcia',
    role: 'Novelist',
    avatar: 'MG',
    content: 'I found my writing partner through the Discord community. We\'ve now published two novels together!',
    color: 'from-pink-500 to-red-500'
  },
  {
    name: 'James Kim',
    role: 'Content Creator',
    avatar: 'JK',
    content: 'The monthly challenges push me to write consistently. I\'ve won twice and it\'s been amazing for my portfolio.',
    color: 'from-green-500 to-blue-500'
  }
]

const CommunityChannelCard = ({ channel, index }: any) => (
  <div className="card-modern p-8 animate-slide-up hover:shadow-xl transition-all duration-300 group" style={{ animationDelay: `${index * 100}ms` }}>
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${channel.color} flex items-center justify-center mb-6`}>
      <channel.icon className="w-7 h-7 text-white" />
    </div>
    
    <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-gradient transition-all duration-300">
      {channel.title}
    </h3>
    
    <p className="text-gray-600 mb-4 leading-relaxed">{channel.description}</p>
    
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <span className="text-sm text-gray-500">{channel.members}</span>
      <a 
        href={channel.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center space-x-1 group"
      >
        <span>Join Now</span>
        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  </div>
)

const EventCard = ({ event }: any) => {
  const progress = (event.attendees / event.spots) * 100
  
  return (
    <div className="card-modern p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              {event.type}
            </span>
            <span className="text-sm text-gray-500">{event.date}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600 mb-2">Hosted by {event.host}</p>
        </div>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{event.description}</p>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{event.attendees} attending</span>
          <span>{event.spots - event.attendees} spots left</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm text-gray-600">{event.time}</span>
        <button className="btn-secondary text-sm px-4 py-2">
          Register
        </button>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-2 mb-8">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">12,500+ Active Creators</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Join the <span className="text-gradient">StoryFoundry Community</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with thousands of storytellers, share your work, get feedback, 
              and grow your craft in a supportive creative community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://discord.gg/storyfoundry" className="btn-primary group flex items-center justify-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Join Discord</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/get-started" className="btn-secondary">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {communityStats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Channels */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Where We <span className="text-gradient">Connect</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join our vibrant community across multiple platforms. Find your perfect creative space.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {communityChannels.map((channel, index) => (
              <CommunityChannelCard key={channel.title} channel={channel} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Community Programs */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Community <span className="text-gradient">Programs</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Take advantage of exclusive programs designed to accelerate your creative journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {communityPrograms.map((program, index) => (
              <div key={program.title} className="card-modern p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <program.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">{program.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{program.description}</p>
                <button className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
                  {program.badge} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Upcoming <span className="text-gradient">Events</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join workshops, challenges, and meetups designed to inspire and educate.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/events" className="btn-secondary inline-flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>View All Events</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Community <span className="text-gradient">Stories</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from creators who found their tribe in the StoryFoundry community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-modern p-6">
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.color} flex items-center justify-center text-white font-bold`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="card-modern p-12 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Community Guidelines</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our community thrives on respect, creativity, and mutual support. 
                  We're committed to maintaining a safe and inclusive space for all creators.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">✓ Do</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Be respectful and supportive</li>
                    <li>• Provide constructive feedback</li>
                    <li>• Share your knowledge freely</li>
                    <li>• Celebrate others' success</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">✗ Don't</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Spam or self-promote excessively</li>
                    <li>• Share plagiarized content</li>
                    <li>• Engage in harassment or hate speech</li>
                    <li>• Violate IP rights</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/community/guidelines" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Read Full Guidelines →
                </Link>
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
              Ready to <span className="text-gradient">Connect</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are building, learning, and growing together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://discord.gg/storyfoundry" className="btn-primary group flex items-center justify-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Join Discord Community</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/get-started" className="btn-secondary">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
