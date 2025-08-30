"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen,
  Star,
  Search,
  UserPlus,
  Crown,
  TrendingUp,
  Eye,
  MessageCircle,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function ReaderDashboardPage() {
  const readerStats = {
    projectsRead: 23,
    favoriteProjects: 8,
    commentsLeft: 45,
    followingWriters: 12
  }

  const discoveredProjects = [
    {
      id: '1',
      title: 'The Last Chronicle',
      writer: 'Sarah Mitchell',
      description: 'A sci-fi thriller about time travel',
      genre: 'Sci-Fi',
      rating: 4.8,
      progress: 75
    },
    {
      id: '2',
      title: 'Summer Dreams', 
      writer: 'Marcus Chen',
      description: 'Coming-of-age drama set in the 1980s',
      genre: 'Drama',
      rating: 4.6,
      progress: 100
    },
    {
      id: '3',
      title: 'Urban Legends',
      writer: 'Diana Ross',
      description: 'Horror anthology series treatment',
      genre: 'Horror',
      rating: 4.9,
      progress: 45
    }
  ]

  return (
    <div className="space-y-8">
      {/* Debug Banner */}
      <div style={{backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center', fontSize: '20px'}}>
        🔴 READER DASHBOARD - DEDICATED PAGE
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reader Dashboard</h1>
          <p className="text-gray-300 mt-2">Discover amazing stories and connect with talented writers.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700">
          <Link href="/search">
            <Search className="w-4 h-4 mr-2" />
            Discover Stories
          </Link>
        </Button>
      </div>

      {/* Reader Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Projects Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{readerStats.projectsRead}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-gold-400" />
              <span className="text-2xl font-bold text-white">{readerStats.favoriteProjects}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{readerStats.commentsLeft}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Following</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{readerStats.followingWriters}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Discovered Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recently Discovered</CardTitle>
                <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                  <Link href="/search">Discover More</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {discoveredProjects.map((project) => (
                <div key={project.id} className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <Badge variant="outline" className="text-xs bg-navy-700 text-gray-300 border-navy-600">
                          {project.genre}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">by {project.writer}</p>
                      <p className="text-sm text-gray-300 mb-3">{project.description}</p>
                      
                      {/* Reading Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Reading Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-gold-400 fill-current" />
                        <span className="text-sm text-gray-300">{project.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Reader Quick Actions */}
        <div>
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/search">
                  <Search className="w-4 h-4 mr-2" />
                  Find New Stories
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/projects?filter=favorites">
                  <Star className="w-4 h-4 mr-2" />
                  My Favorites
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/writers">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow Writers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/settings?tab=upgrade">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Writer
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
