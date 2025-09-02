'use client'

import React, { useState } from 'react'
import { Globe, Layout, PenTool, BarChart3 } from 'lucide-react'
import NovelWriter from './novel-writer'
import NovelOutline from './novel-outline'
import NovelDashboard from './novel-dashboard'
import WorldBuildingSidebar from './world-building-sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  word_count: number
  target_word_count: number
  status: string
  content: string
  notes: string
  updated_at: string
}

interface NovelProject {
  id: string
  title: string
  genre: string
  format: string
  word_count: number
  target_word_count: number
}

interface EnhancedNovelWriterProps {
  projectId: string
  project: NovelProject
  chapters: Chapter[]
  totalWordCount: number
  onChapterCreate?: (afterChapter?: number) => void
}

export default function EnhancedNovelWriter({ 
  projectId, 
  project, 
  chapters, 
  totalWordCount,
  onChapterCreate 
}: EnhancedNovelWriterProps) {
  const [activeView, setActiveView] = useState('writer')
  const [worldBuildingOpen, setWorldBuildingOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* World Building Sidebar */}
      <WorldBuildingSidebar
        projectId={projectId}
        isOpen={worldBuildingOpen}
        onToggle={() => setWorldBuildingOpen(!worldBuildingOpen)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${worldBuildingOpen ? 'ml-80' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-gray-600">{project.genre} • {totalWordCount.toLocaleString()} words</p>
              </div>
              
              <div className="flex items-center space-x-3">
                {!worldBuildingOpen && (
                  <Button
                    onClick={() => setWorldBuildingOpen(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>World Building</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="writer" className="flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <span>Writer</span>
                </TabsTrigger>
                <TabsTrigger value="outline" className="flex items-center space-x-2">
                  <Layout className="w-4 h-4" />
                  <span>Outline</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="writer" className="space-y-0 m-0">
                  <NovelWriter 
                    projectId={projectId} 
                    project={project}
                  />
                </TabsContent>

                <TabsContent value="outline" className="space-y-0 m-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <NovelOutline 
                      projectId={projectId}
                      chapters={chapters}
                      onChapterCreate={onChapterCreate}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dashboard" className="space-y-0 m-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <NovelDashboard 
                      projectId={projectId}
                      chapters={chapters}
                      totalWordCount={totalWordCount}
                      targetWordCount={project.target_word_count}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Quick Access Floating Actions */}
      {!worldBuildingOpen && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <Button
            onClick={() => setWorldBuildingOpen(true)}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
            title="World Building"
          >
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
