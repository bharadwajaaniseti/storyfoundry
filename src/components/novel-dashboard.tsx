'use client'

import React, { useState, useEffect } from 'react'
import { 
  Target, 
  Calendar, 
  Clock, 
  TrendingUp,
  Award,
  FileText,
  Zap,
  BookOpen,
  BarChart3,
  Coffee,
  Flame,
  CheckCircle
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface WritingGoal {
  id: string
  goal_type: 'daily_words' | 'chapter_completion' | 'novel_completion'
  target_value: number
  current_progress: number
  goal_period: string
  start_date: string
  end_date?: string
  is_active: boolean
}

interface Chapter {
  id: string
  chapter_number: number
  title: string
  word_count: number
  target_word_count: number
  status: string
  updated_at: string
}

interface WritingSession {
  date: string
  words_written: number
  time_spent: number
  chapters_worked_on: string[]
}

interface NovelDashboardProps {
  projectId: string
  chapters: Chapter[]
  totalWordCount: number
  targetWordCount?: number
}

export default function NovelDashboard({ 
  projectId, 
  chapters, 
  totalWordCount, 
  targetWordCount = 80000 
}: NovelDashboardProps) {
  const [goals, setGoals] = useState<WritingGoal[]>([])
  const [writingSessions, setWritingSessions] = useState<WritingSession[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [projectId])

  const loadDashboardData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Load writing goals
      const { data: goalsData } = await supabase
        .from('writing_goals')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)

      setGoals(goalsData || [])

      // Calculate writing streaks and sessions from chapter updates
      calculateWritingStats()
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWritingStats = () => {
    // Simple streak calculation based on chapter updates
    // In a real implementation, you'd track daily writing sessions
    const recentUpdates = chapters
      .filter(c => {
        const updateDate = new Date(c.updated_at)
        const daysDiff = (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 30 // Last 30 days
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    // Calculate current streak (simplified)
    let streak = 0
    const today = new Date()
    const recentDates = new Set()

    recentUpdates.forEach(chapter => {
      const updateDate = new Date(chapter.updated_at)
      const dateKey = updateDate.toDateString()
      recentDates.add(dateKey)
    })

    // Check consecutive days (simplified logic)
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      if (recentDates.has(checkDate.toDateString())) {
        streak++
      } else if (streak > 0) {
        break
      }
    }

    setCurrentStreak(streak)
    setBestStreak(Math.max(streak, bestStreak))
  }

  const getTodaysProgress = () => {
    const todaysGoal = goals.find(g => g.goal_type === 'daily_words')
    if (!todaysGoal) return { current: 0, target: 1000, percentage: 0 }

    // In a real implementation, track today's writing specifically
    const percentage = Math.min((todaysGoal.current_progress / todaysGoal.target_value) * 100, 100)
    
    return {
      current: todaysGoal.current_progress,
      target: todaysGoal.target_value,
      percentage
    }
  }

  const getWeeklyProgress = () => {
    const weeklyGoal = goals.find(g => g.goal_type === 'daily_words' && g.goal_period === 'weekly')
    const dailyGoal = goals.find(g => g.goal_type === 'daily_words' && g.goal_period === 'daily')
    
    if (weeklyGoal) {
      return {
        current: weeklyGoal.current_progress,
        target: weeklyGoal.target_value,
        percentage: Math.min((weeklyGoal.current_progress / weeklyGoal.target_value) * 100, 100)
      }
    }
    
    if (dailyGoal) {
      const weeklyTarget = dailyGoal.target_value * 7
      const weeklyProgress = dailyGoal.current_progress * 7 // Simplified
      return {
        current: weeklyProgress,
        target: weeklyTarget,
        percentage: Math.min((weeklyProgress / weeklyTarget) * 100, 100)
      }
    }

    return { current: 0, target: 7000, percentage: 0 }
  }

  const getNovelProgress = () => {
    const percentage = Math.min((totalWordCount / targetWordCount) * 100, 100)
    return {
      current: totalWordCount,
      target: targetWordCount,
      percentage
    }
  }

  const getCompletedChapters = () => {
    return chapters.filter(c => c.status === 'completed').length
  }

  const getAverageChapterLength = () => {
    if (chapters.length === 0) return 0
    return Math.round(totalWordCount / chapters.length)
  }

  const getEstimatedCompletion = () => {
    const remainingWords = targetWordCount - totalWordCount
    const dailyGoal = goals.find(g => g.goal_type === 'daily_words')
    
    if (!dailyGoal || dailyGoal.target_value === 0) return 'Set a daily goal to see estimate'
    
    const daysRemaining = Math.ceil(remainingWords / dailyGoal.target_value)
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + daysRemaining)
    
    return completionDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const todaysProgress = getTodaysProgress()
  const weeklyProgress = getWeeklyProgress()
  const novelProgress = getNovelProgress()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Writing Dashboard</h2>
        <div className="flex items-center space-x-4">
          <Badge className="bg-orange-100 text-orange-800">
            <Flame className="w-3 h-3 mr-1" />
            {currentStreak} day streak
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <Award className="w-3 h-3 mr-1" />
            Best: {bestStreak} days
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Goal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Today's Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">
                  {todaysProgress.current.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  / {todaysProgress.target.toLocaleString()} words
                </span>
              </div>
              <Progress value={todaysProgress.percentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {Math.round(todaysProgress.percentage)}% complete
                </span>
                {todaysProgress.percentage >= 100 && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Goal achieved!
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">
                  {weeklyProgress.current.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  / {weeklyProgress.target.toLocaleString()} words
                </span>
              </div>
              <Progress value={weeklyProgress.percentage} className="h-2" />
              <div className="text-sm text-gray-600">
                {Math.round(weeklyProgress.percentage)}% of weekly goal
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Novel Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              Novel Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">
                  {novelProgress.current.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  / {novelProgress.target.toLocaleString()} words
                </span>
              </div>
              <Progress value={novelProgress.percentage} className="h-2" />
              <div className="text-sm text-gray-600">
                {Math.round(novelProgress.percentage)}% complete
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Chapters</p>
                <p className="text-2xl font-bold text-gray-800">{chapters.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-800">{getCompletedChapters()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Chapter</p>
                <p className="text-2xl font-bold text-gray-800">{getAverageChapterLength()}</p>
                <p className="text-xs text-gray-500">words</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Writing Streak</p>
                <p className="text-2xl font-bold text-gray-800">{currentStreak}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estimated Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Estimated Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {getEstimatedCompletion()}
            </div>
            <p className="text-gray-600">
              Based on your current daily writing goal and remaining word count
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
              <Target className="w-5 h-5 mb-1" />
              <span className="text-sm">Set Daily Goal</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
              <Coffee className="w-5 h-5 mb-1" />
              <span className="text-sm">Start Writing</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-sm">Chapter Overview</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
