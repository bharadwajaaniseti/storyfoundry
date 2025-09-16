'use client'

import React, { useState } from 'react'
import RoleTag from './role-tag'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { PermissionGate } from '@/components/permission-gate'
import { 
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FileText,
  MessageSquare,
  Star,
  Send,
  Eye,
  Edit3,
  Globe,
  Target,
  ArrowRight,
  Calendar,
  Flag,
  Settings
} from 'lucide-react'

interface RoleWorkflowManagerProps {
  projectId: string
  userId?: string
  project: any
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  assignedRole: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
}

export default function RoleWorkflowManager({ 
  projectId, 
  userId, 
  project 
}: RoleWorkflowManagerProps) {
  const { userRole, getAllRoleNames } = useRoleBasedUI(projectId, userId)
  const [activeTab, setActiveTab] = useState<'workflow' | 'assignments' | 'deadlines'>('workflow')
  
  if (!userId) return null

  const allRoles = getAllRoleNames()

  // Sample workflow steps - in production, this would come from the database
  const workflowSteps: WorkflowStep[] = [
    {
      id: '1',
      title: 'First Draft Complete',
      description: 'Complete the initial manuscript draft',
      status: 'completed',
      assignedRole: 'coauthor',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Content Review',
      description: 'Review content for story structure and flow',
      status: 'in-progress',
      assignedRole: 'reviewer',
      dueDate: '2024-02-15',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Editorial Pass',
      description: 'Grammar, style, and language editing',
      status: 'pending',
      assignedRole: 'editor',
      dueDate: '2024-02-20',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Translation',
      description: 'Translate to target languages',
      status: 'pending',
      assignedRole: 'translator',
      dueDate: '2024-02-25',
      priority: 'low'
    },
    {
      id: '5',
      title: 'Production Planning',
      description: 'Plan marketing and distribution strategy',
      status: 'pending',
      assignedRole: 'producer',
      dueDate: '2024-03-01',
      priority: 'medium'
    }
  ]

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'pending': return <AlertCircle className="w-5 h-5 text-gray-400" />
      case 'blocked': return <Flag className="w-5 h-5 text-red-500" />
    }
  }

  const getPriorityColor = (priority: WorkflowStep['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'coauthor': 'bg-blue-100 text-blue-800',
      'editor': 'bg-green-100 text-green-800',
      'reviewer': 'bg-purple-100 text-purple-800',
      'translator': 'bg-pink-100 text-pink-800',
      'producer': 'bg-orange-100 text-orange-800',
      'commenter': 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const mySteps = workflowSteps.filter(step => allRoles.includes(step.assignedRole))
  const upcomingDeadlines = workflowSteps
    .filter(step => step.dueDate && step.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Project Workflow</h2>
            <p className="text-gray-600 text-sm mt-1">
              Track progress and manage role-based tasks
            </p>
          </div>
          {/* Configure Workflow button removed until feature implemented */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'workflow', label: 'Workflow', icon: Target },
            { id: 'assignments', label: 'My Tasks', icon: Users },
            { id: 'deadlines', label: 'Deadlines', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`border-l-4 rounded-lg p-4 ${getPriorityColor(step.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(step.status)}
                      <h3 className="font-semibold text-gray-800">{step.title}</h3>
                      <RoleTag role={step.assignedRole} />
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                    {step.dueDate && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(step.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons for relevant roles */}
                  {allRoles.includes(step.assignedRole) && step.status !== 'completed' && (
                    <div className="flex space-x-2 ml-4">
                      {step.status === 'pending' && (
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                          Start Task
                        </button>
                      )}
                      {step.status === 'in-progress' && (
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Progress connector */}
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* My Tasks Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {mySteps.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  You have {mySteps.filter(s => s.status !== 'completed').length} active tasks
                </div>
                {mySteps.map((step) => (
                  <div
                    key={step.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(step.status)}
                          <h3 className="font-semibold text-gray-800">{step.title}</h3>
                          <RoleTag role={step.assignedRole} />
                        </div>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                        {step.dueDate && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(step.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-gray-600 hover:text-gray-800">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {step.status !== 'completed' && (
                          <button className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors">
                            {step.status === 'pending' ? 'Start' : 'Continue'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks assigned to your roles yet</p>
              </div>
            )}
          </div>
        )}

        {/* Deadlines Tab */}
        {activeTab === 'deadlines' && (
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  {upcomingDeadlines.length} upcoming deadlines
                </div>
                {upcomingDeadlines.map((step) => {
                  const daysUntilDue = Math.ceil(
                    (new Date(step.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOverdue = daysUntilDue < 0
                  const isUrgent = daysUntilDue <= 3

                  return (
                    <div
                      key={step.id}
                      className={`border rounded-lg p-4 ${
                        isOverdue 
                          ? 'border-red-300 bg-red-50' 
                          : isUrgent 
                          ? 'border-yellow-300 bg-yellow-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">{step.title}</h3>
                            <RoleTag role={step.assignedRole} />
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {new Date(step.dueDate!).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`font-medium ${
                              isOverdue 
                                ? 'text-red-600' 
                                : isUrgent 
                                ? 'text-yellow-600' 
                                : 'text-gray-600'
                            }`}>
                              {isOverdue 
                                ? `${Math.abs(daysUntilDue)} days overdue` 
                                : `${daysUntilDue} days remaining`}
                            </span>
                          </div>
                        </div>
                        {allRoles.includes(step.assignedRole) && (
                          <button className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors">
                            View Task
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming deadlines</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
