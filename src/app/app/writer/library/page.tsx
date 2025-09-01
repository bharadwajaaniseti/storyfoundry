'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  BarChart3,
  BookMarked,
  Search,
  TrendingUp,
  Pen,
  Users,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function WriterLibraryPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <BookMarked className="w-8 h-8 text-orange-600" />
              <span>Writer's Library</span>
            </h1>
            <p className="text-gray-600 mt-2">Your reading journey for creative inspiration</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/app/writer/projects">
                <Pen className="w-4 h-4 mr-2" />
                My Projects
              </Link>
            </Button>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/app/search">
                <Search className="w-4 h-4 mr-2" />
                Discover Stories
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">+4 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Hours</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47h</div>
              <p className="text-xs text-muted-foreground">+12h from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspiration Notes</CardTitle>
              <Pen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+18 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authors Followed</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="inspiration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="inspiration" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Reading List</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspiration" className="space-y-6">
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Build Your Reading List</h3>
              <p className="text-gray-600 mb-6">Discover stories that will inspire your writing</p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/app/search">
                  <Search className="w-4 h-4 mr-2" />
                  Explore Stories
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    <span>Reading Insights</span>
                  </CardTitle>
                  <CardDescription>Your reading habits and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Favorite Genre</span>
                      <Badge variant="outline">Sci-Fi</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reading Speed</span>
                      <span className="text-sm font-medium">250 WPM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Best Day</span>
                      <span className="text-sm font-medium">Sunday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>This Month</span>
                  </CardTitle>
                  <CardDescription>Your activity this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Projects Started</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Projects Completed</span>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reading Days</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookMarked className="w-5 h-5 text-orange-500" />
                    <span>Writer's Tools</span>
                  </CardTitle>
                  <CardDescription>Inspiration from your reading</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full">
                      Export Reading Notes
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Inspiration Board
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Style Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Writer's Reading Goals</CardTitle>
                <CardDescription>Track your reading objectives to inspire your writing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Annual Reading Goal</span>
                      <span className="text-sm text-gray-600">15 of 20 stories</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">15</div>
                      <div className="text-sm text-gray-600">Stories Read</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">3</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">5</div>
                      <div className="text-sm text-gray-600">Ahead of Goal</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
