'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Filter,
  MapPin,
  Users,
  Star,
  MessageSquare,
  Award,
  Briefcase,
  Calendar,
  Flame,
  Eye,
  Clock
} from 'lucide-react'

interface Project {
  id: string
  title: string
  logline: string
  format: string
  genre: string
  buzz_score: number
  created_at: string
  profiles: {
    display_name: string
    verified_pro: boolean
  }
}

interface SearchResult {
  id: string
  type: 'user' | 'project'
  name?: string
  role?: string
  location?: string
  rating?: number
  reviews?: number
  verified?: boolean
  bio?: string
  specialties?: string[]
  recentProjects?: number
  avatar?: string
  title?: string
  description?: string
  owner?: string
  genre?: string
  format?: string
  status?: string
  roles?: string[]
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFeaturedProjects()
  }, [])

  const loadFeaturedProjects = async () => {
    try {
      const response = await fetch('/api/projects/public?limit=6&sortBy=buzz_score')
      const data = await response.json()
      
      if (response.ok) {
        setFeaturedProjects(data.projects)
      }
    } catch (error) {
      console.error('Error loading featured projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  // Mock data for user profiles - in real app this would come from database
  const searchResults: SearchResult[] = [
    {
      id: '1',
      type: 'user',
      name: 'Sarah Chen',
      role: 'Producer',
      location: 'Los Angeles, CA',
      rating: 4.9,
      reviews: 156,
      verified: true,
      bio: 'Award-winning producer with 15+ years experience in independent film. Passionate about unique voices and compelling stories.',
      specialties: ['Independent Film', 'Drama', 'Thriller'],
      recentProjects: 3,
      avatar: 'SC'
    },
    {
      id: '2',
      type: 'user',
      name: 'Marcus Rodriguez',
      role: 'Director',
      location: 'New York, NY',
      rating: 4.8,
      reviews: 89,
      verified: true,
      bio: 'Visionary director specializing in character-driven narratives and innovative cinematography.',
      specialties: ['Sci-Fi', 'Drama', 'Documentary'],
      recentProjects: 2,
      avatar: 'MR'
    },
    {
      id: '4',
      type: 'user',
      name: 'David Kim',
      role: 'Screenwriter',
      location: 'Austin, TX',
      rating: 4.7,
      reviews: 67,
      verified: false,
      bio: 'Emerging screenwriter with a passion for psychological thrillers and complex character studies.',
      specialties: ['Thriller', 'Horror', 'Mystery'],
      recentProjects: 5,
      avatar: 'DK'
    }
  ]

  const filters = [
    { label: 'All', count: featuredProjects.length + searchResults.length, active: true },
    { label: 'People', count: searchResults.length, active: false },
    { label: 'Projects', count: featuredProjects.length, active: false },
    { label: 'Verified', count: searchResults.filter(r => r.verified).length, active: false }
  ]

  const handleSearch = () => {
    // Redirect to the main search page with search params
    if (searchQuery.trim()) {
      window.location.href = `/app/search?search=${encodeURIComponent(searchQuery.trim())}`
    } else {
      window.location.href = `/app/search`
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Search & Discover</h1>
        <p className="text-gray-300 mt-2">Find collaborators, projects, and opportunities in the creative community</p>
      </div>

      {/* Search Bar */}
      <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  placeholder="Search for people, projects, or skills..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-12 bg-navy-900/50 border-navy-600 text-white placeholder-gray-400 text-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-navy-600 text-gray-300 hover:bg-navy-700 h-12 px-6">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button 
                onClick={handleSearch}
                className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700 h-12 px-6"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-navy-800/50 rounded-lg p-1 w-fit">
        {filters.map((filter) => (
          <button
            key={filter.label}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter.active 
                ? 'bg-gold-400 text-navy-900' 
                : 'text-gray-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {filter.label}
            <span className="ml-1 opacity-75">({filter.count})</span>
          </button>
        ))}
      </div>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
            <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
              <Link href="/app/search">View All Projects</Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-gold-400 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-navy-600 text-gray-300 text-xs">
                        {project.format}
                      </Badge>
                      {project.genre && (
                        <Badge className="bg-gold-400/20 text-gold-400 border border-gold-400/30 text-xs">
                          {project.genre}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-gold-400">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs font-medium">{project.buzz_score}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                    <Link href={`/projects/${project.id}`}>
                      {project.title}
                    </Link>
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {project.logline}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 text-xs font-bold">
                          {getInitials(project.profiles.display_name || 'Writer')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-gray-300">{project.profiles.display_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                      <Link href={`/projects/${project.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Search Community</h2>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchResults.map((result) => (
          <Card key={result.id} className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-navy-600 transition-colors">
            <CardContent className="p-6">
              {result.type === 'user' ? (
                // User Profile Result
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                      <span className="text-navy-900 font-bold text-lg">{result.avatar}</span>
                    </div>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-white">{result.name}</h3>
                      {result.verified && (
                        <Badge className="bg-blue-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Verified Pro
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-navy-600 text-gray-300">
                        {result.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{result.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span>{result.rating}</span>
                        <span>({result.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{result.recentProjects} recent projects</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{result.bio}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {result.specialties?.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="border-navy-600 text-gray-300 text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-navy-600 text-gray-300 hover:bg-navy-700">
                          View Profile
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Project Result (static examples for now)
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">{result.title}</h3>
                        <Badge className={`${
                          result.status === 'seeking_collaborators' ? 'bg-green-500' : 'bg-blue-500'
                        } text-white`}>
                          {result.status === 'seeking_collaborators' ? 'Seeking Collaborators' : 'In Development'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>by {result.owner}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{result.location}</span>
                        </div>
                        <Badge variant="outline" className="border-navy-600 text-gray-300">
                          {result.genre}
                        </Badge>
                        <Badge variant="outline" className="border-navy-600 text-gray-300">
                          {result.format}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-300 mb-3">{result.description}</p>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Looking for:</span>
                        {result.roles?.map((role) => (
                          <Badge key={role} className="bg-gold-400/20 text-gold-400 border border-gold-400/30">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-navy-600 text-gray-300 hover:bg-navy-700">
                        Learn More
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="border-navy-600 text-gray-300 hover:bg-navy-700">
          Load More Results
        </Button>
      </div>
    </div>
  )
}
