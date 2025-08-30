'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  FileText, 
  Shield, 
  Users, 
  Brain,
  Plus,
  Clock,
  Star,
  CheckCircle,
  Play,
  TrendingUp
} from 'lucide-react'

export default function GetStartedPage() {
  const [step, setStep] = useState(1)

  const quickStartSteps = [
    {
      id: 1,
      title: "Create Your First Project",
      description: "Start with a new screenplay, treatment, or pitch deck.",
      action: "Create Project",
      icon: FileText,
      completed: false
    },
    {
      id: 2,
      title: "Secure Your IP",
      description: "Get blockchain timestamping for your creative work.",
      action: "Timestamp Now",
      icon: Shield,
      completed: false
    },
    {
      id: 3,
      title: "Try AI Assistance",
      description: "Get intelligent suggestions for your story development.",
      action: "Use StoryAI",
      icon: Brain,
      completed: false
    },
    {
      id: 4,
      title: "Invite Collaborators",
      description: "Share your project with writers, producers, or directors.",
      action: "Invite Team",
      icon: Users,
      completed: false
    }
  ]

  const templates = [
    {
      id: 'screenplay',
      title: 'Feature Screenplay',
      description: 'Industry-standard screenplay format',
      icon: FileText,
      popular: true
    },
    {
      id: 'treatment',
      title: 'Treatment',
      description: 'Narrative summary of your story',
      icon: FileText,
      popular: false
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck',
      description: 'Visual presentation for investors',
      icon: Play,
      popular: true
    },
    {
      id: 'series-bible',
      title: 'Series Bible',
      description: 'Comprehensive guide for TV series',
      icon: FileText,
      popular: false
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'project_created',
      title: 'Welcome to StoryFoundry!',
      description: 'Your account has been created successfully.',
      time: 'Just now',
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome to StoryFoundry!</h1>
              <p className="text-gray-600 mt-1">Let's get you started on your creative journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Progress: <span className="font-medium text-orange-500">0/4 completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Start Guide */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Quick Start Guide</h2>
                <span className="text-sm text-gray-500">4 steps to success</span>
              </div>
              
              <div className="space-y-4">
                {quickStartSteps.map((stepItem, index) => {
                  const StepIcon = stepItem.icon
                  return (
                    <div 
                      key={stepItem.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        step === stepItem.id 
                          ? 'border-orange-200 bg-orange-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            stepItem.completed 
                              ? 'bg-green-100 text-green-600'
                              : step === stepItem.id
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {stepItem.completed ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <StepIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{stepItem.title}</h3>
                            <p className="text-sm text-gray-600">{stepItem.description}</p>
                          </div>
                        </div>
                        <button 
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            stepItem.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                          disabled={stepItem.completed}
                        >
                          {stepItem.completed ? 'Complete' : stepItem.action}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Create New Project */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Your First Project</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => {
                  const TemplateIcon = template.icon
                  return (
                    <div 
                      key={template.id}
                      className="relative p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer group"
                    >
                      {template.popular && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-orange-100 rounded-lg flex items-center justify-center transition-colors">
                          <TemplateIcon className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 group-hover:text-orange-800">
                            {template.title}
                          </h3>
                          <p className="text-sm text-gray-600 group-hover:text-orange-600">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <button className="btn-primary group flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Project</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Your Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Setup Complete</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <p className="text-sm text-white/90">
                Complete your setup to unlock all features and get the most out of StoryFoundry.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const ActivityIcon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 ${activity.color}`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">{activity.title}</h4>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Help & Resources */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Help & Resources</h3>
              <div className="space-y-3">
                <Link href="/docs" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Documentation</span>
                </Link>
                <Link href="/tutorials" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Video Tutorials</span>
                </Link>
                <Link href="/support" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Community Support</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projects Created</span>
                  <span className="font-semibold text-gray-800">847K+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Writers</span>
                  <span className="font-semibold text-gray-800">12.5K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stories Protected</span>
                  <span className="font-semibold text-gray-800">156K+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
