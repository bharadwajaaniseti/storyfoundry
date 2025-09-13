'use client'

import React from 'react'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { PermissionGate } from '@/components/permission-gate'
import { 
  Languages,
  Clapperboard,
  MessageSquare,
  BarChart3,
  Calendar,
  Users,
  Star,
  Clock,
  Target,
  Sparkles,
  FileText,
  Edit3,
  Eye
} from 'lucide-react'

interface RoleSpecificSidebarProps {
  projectId: string
  userId?: string
  project: any
  content: string
}

export default function RoleSpecificSidebar({ 
  projectId, 
  userId, 
  project, 
  content 
}: RoleSpecificSidebarProps) {
  const { userRole, getAllRoleNames } = useRoleBasedUI(projectId, userId)
  
  if (!userId) return null

  const allRoles = getAllRoleNames()
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

  return (
    <div className="space-y-6">
      {/* Universal Project Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Word Count</span>
            <span className="font-medium">{wordCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Character Count</span>
            <span className="font-medium">{content.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Buzz Score</span>
            <span className="font-medium">{project.buzz_score}</span>
          </div>
        </div>
      </div>

      {/* Translator Tools - Only for translators */}
      {allRoles.includes('translator') && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Languages className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">Translation Tools</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Target Language
              </label>
              <select className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option>Select Language</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              Start Translation
            </button>
            <button className="w-full border border-purple-300 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors">
              Translation Memory
            </button>
          </div>
        </div>
      )}

      {/* Producer Dashboard - Only for producers */}
      {allRoles.includes('producer') && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clapperboard className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800">Producer Dashboard</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Progress</span>
                </div>
                <div className="text-lg font-bold text-orange-600 mt-1">
                  {Math.round((wordCount / 50000) * 100)}%
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Deadline</span>
                </div>
                <div className="text-sm font-medium text-orange-600 mt-1">
                  2 weeks
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                <Calendar className="w-4 h-4 inline mr-2" />
                Manage Timeline
              </button>
              <button className="w-full border border-orange-300 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments & Feedback - For reviewers and commenters */}
      <PermissionGate 
        projectId={projectId} 
        userId={userId} 
        requiredPermission="comment"
      >
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">
              {allRoles.includes('reviewer') ? 'Review Tools' : 'Comments'}
            </h3>
          </div>
          <div className="space-y-3">
            {allRoles.includes('reviewer') && (
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Overall Rating</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-blue-600">Rate the current content quality</p>
              </div>
            )}
            <div className="space-y-2">
              <textarea 
                placeholder={allRoles.includes('reviewer') ? "Provide detailed feedback..." : "Add a comment..."}
                className="w-full p-3 border border-blue-300 rounded-lg text-sm resize-none"
                rows={3}
              />
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                {allRoles.includes('reviewer') ? 'Submit Review' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      </PermissionGate>

      {/* AI Assistant - Enhanced for different roles */}
      {project.ai_enabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
          </div>
          <div className="space-y-2">
            {/* Role-specific AI suggestions */}
            {allRoles.includes('coauthor') && (
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm text-gray-800">Story Development</div>
                <div className="text-xs text-gray-600">Get plot suggestions and character ideas</div>
              </button>
            )}
            {allRoles.includes('editor') && (
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm text-gray-800">Grammar & Style</div>
                <div className="text-xs text-gray-600">Check grammar and improve writing style</div>
              </button>
            )}
            {allRoles.includes('translator') && (
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm text-gray-800">Translation Help</div>
                <div className="text-xs text-gray-600">Get context-aware translation suggestions</div>
              </button>
            )}
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Analyze Content
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
