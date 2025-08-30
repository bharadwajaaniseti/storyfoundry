'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Handshake, Coffee, Target } from 'lucide-react'

export default function CollaborationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/app/dashboard" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Collaborations</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Empty State */}
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Collaborations Yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start collaborating with other creators! Invite team members to your projects 
            or join existing collaborations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app/projects/new" className="btn-primary">
              Create Project to Collaborate
            </Link>
            <button className="btn-secondary">
              Browse Collaboration Opportunities
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Team Roles</h3>
            <p className="text-gray-600 text-sm">
              Assign specific roles like co-author, editor, translator, or producer to team members.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Royalty Splits</h3>
            <p className="text-gray-600 text-sm">
              Set clear revenue sharing agreements with percentage-based royalty splits.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600 text-sm">
              Work together in real-time with live editing, comments, and version control.
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-16 bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon!</h3>
          <p className="text-gray-600">
            Advanced collaboration features are currently in development. 
            Stay tuned for updates on team management, real-time editing, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
