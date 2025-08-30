import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Users,
  Clock,
  FileText,
  Lock,
  Globe,
  Shield
} from 'lucide-react'

export default function ProjectsPage() {
  // Mock data - in real app this would come from database
  const projects = [
    {
      id: '1',
      title: 'The Last Chronicle',
      description: 'A sci-fi thriller about time travel and the consequences of changing the past.',
      status: 'in_progress',
      visibility: 'private',
      lastActivity: '2 hours ago',
      collaborators: 2,
      views: 45,
      assets: 12,
      genre: 'Sci-Fi',
      format: 'Feature Film'
    },
    {
      id: '2', 
      title: 'Summer Dreams',
      description: 'Coming-of-age drama set in the 1980s about friendship and growing up.',
      status: 'review',
      visibility: 'team',
      lastActivity: '1 day ago',
      collaborators: 1,
      views: 23,
      assets: 8,
      genre: 'Drama',
      format: 'Feature Film'
    },
    {
      id: '3',
      title: 'Urban Legends',
      description: 'Horror anthology series treatment exploring modern urban myths.',
      status: 'completed',
      visibility: 'public',
      lastActivity: '3 days ago',
      collaborators: 3,
      views: 89,
      assets: 25,
      genre: 'Horror',
      format: 'TV Series'
    },
    {
      id: '4',
      title: 'Midnight Café',
      description: 'A supernatural mystery set in a 24-hour diner that serves both the living and the dead.',
      status: 'draft',
      visibility: 'private',
      lastActivity: '1 week ago',
      collaborators: 0,
      views: 12,
      assets: 3,
      genre: 'Supernatural',
      format: 'Feature Film'
    },
    {
      id: '5',
      title: 'Code Red',
      description: 'Political thriller about a cyber attack on the electoral system.',
      status: 'in_progress',
      visibility: 'team',
      lastActivity: '2 days ago',
      collaborators: 4,
      views: 67,
      assets: 18,
      genre: 'Thriller',
      format: 'Limited Series'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'review': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'in_progress': return 'In Progress'
      case 'review': return 'In Review'
      case 'completed': return 'Completed'
      default: return 'Unknown'
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return Globe
      case 'team': return Users
      case 'private': return Lock
      default: return Shield
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'text-green-400'
      case 'team': return 'text-blue-400'
      case 'private': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-300 mt-2">Manage and organize all your creative projects</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-10 bg-navy-900/50 border-navy-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-navy-600 text-gray-300 hover:bg-navy-700">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="border-navy-600 text-gray-300 hover:bg-navy-700">
                Sort
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {projects.map((project) => {
          const VisibilityIcon = getVisibilityIcon(project.visibility)
          
          return (
            <Card key={project.id} className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-navy-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="text-xl font-semibold text-white hover:text-gold-400 transition-colors">
                          {project.title}
                        </h3>
                      </Link>
                      <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                        {getStatusText(project.status)}
                      </Badge>
                      <VisibilityIcon className={`w-4 h-4 ${getVisibilityColor(project.visibility)}`} />
                    </div>
                    <p className="text-gray-300 mb-3 line-clamp-2">{project.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{project.assets} assets</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{project.collaborators} collaborators</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{project.views} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{project.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <Badge variant="outline" className="border-navy-600 text-gray-300 mb-1">
                        {project.genre}
                      </Badge>
                      <div className="text-xs text-gray-400">{project.format}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                      <Link href={`/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                      <Link href={`/projects/${project.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                  
                  {project.collaborators > 0 && (
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(project.collaborators, 3) }).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full border-2 border-navy-800 flex items-center justify-center">
                          <span className="text-navy-900 font-bold text-xs">
                            {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                      ))}
                      {project.collaborators > 3 && (
                        <div className="w-8 h-8 bg-navy-700 rounded-full border-2 border-navy-800 flex items-center justify-center">
                          <span className="text-gray-300 text-xs">+{project.collaborators - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State (hidden when there are projects) */}
      {projects.length === 0 && (
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-300 mb-6">Create your first project to get started with StoryFoundry</p>
            <Button asChild className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
