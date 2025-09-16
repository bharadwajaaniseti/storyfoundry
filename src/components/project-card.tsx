'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  Users,
  Eye,
  Clock,
  MoreHorizontal
} from 'lucide-react'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    format: string
    genre: string
    status: string
    visibility: string
    assets: number
    collaborators: number
    views: number
    lastActivity: string
  }
  isNovel: boolean
  projectUrl: string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  getVisibilityIcon: (visibility: string) => any
  getVisibilityColor: (visibility: string) => string
}

export default function ProjectCard({
  project,
  isNovel,
  projectUrl,
  getStatusColor,
  getStatusText,
  getVisibilityIcon,
  getVisibilityColor
}: ProjectCardProps) {
  const router = useRouter()
  const VisibilityIcon = getVisibilityIcon(project.visibility)

  const handleNovelClick = () => {
    console.log('NOVEL CLICKED:', project.title)
    console.log('Full project data:', project)
    // Navigate to the dedicated novel page
    router.push(`/novels/${project.id}`)
  }

  const cardContent = (
    <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-navy-600 transition-colors cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-white hover:text-gold-400 transition-colors">
                {project.title}
              </h3>
              <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                {getStatusText(project.status)}
              </Badge>
              {VisibilityIcon && (
                <div className={`w-4 h-4 ${getVisibilityColor(project.visibility)}`}>
                  {VisibilityIcon}
                </div>
              )}
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
      </CardContent>
    </Card>
  )

  if (isNovel) {
    return (
      <div onClick={handleNovelClick}>
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={projectUrl}>
      {cardContent}
    </Link>
  )
}
