'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit3, 
  Save, 
  Trash2,
  BookOpen,
  Users,
  Target,
  Lightbulb,
  Map,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface NovelOutline {
  id: string
  project_id: string
  structure_type: 'three_act' | 'hero_journey' | 'custom'
  act_1_chapters: string
  act_2_chapters: string
  act_3_chapters: string
  plot_points: string
  character_arcs: string
  themes: string
}

interface Chapter {
  id: string
  chapter_number: number
  title: string
  word_count: number
  status: string
}

interface NovelOutlineProps {
  projectId: string
  chapters: Chapter[]
  onChapterCreate?: (afterChapter?: number) => void
}

export default function NovelOutline({ projectId, chapters, onChapterCreate }: NovelOutlineProps) {
  const [outline, setOutline] = useState<NovelOutline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('structure')
  const [expandedSections, setExpandedSections] = useState<string[]>(['act1', 'act2', 'act3'])

  // Plot points structure
  const [plotPoints, setPlotPoints] = useState({
    inciting_incident: '',
    plot_point_1: '',
    midpoint: '',
    plot_point_2: '',
    climax: '',
    resolution: ''
  })

  // Character arcs
  const [characterArcs, setCharacterArcs] = useState<Array<{
    name: string
    goal: string
    conflict: string
    arc: string
  }>>([])

  // Themes
  const [themes, setThemes] = useState<string[]>([])

  useEffect(() => {
    loadOutline()
  }, [projectId])

  const loadOutline = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: outlineData, error } = await supabase
        .from('novel_outlines')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (outlineData) {
        setOutline(outlineData)
        
        // Parse JSON fields
        try {
          const plotPointsData = JSON.parse(outlineData.plot_points || '{}')
          setPlotPoints({ ...plotPoints, ...plotPointsData })
          
          const characterArcsData = JSON.parse(outlineData.character_arcs || '[]')
          setCharacterArcs(characterArcsData)
          
          const themesData = JSON.parse(outlineData.themes || '[]')
          setThemes(themesData)
        } catch (parseError) {
          console.error('Error parsing outline data:', parseError)
        }
      }
    } catch (error) {
      console.error('Error loading outline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveOutline = async () => {
    setIsSaving(true)
    
    try {
      const supabase = createSupabaseClient()
      
      const outlineData = {
        project_id: projectId,
        structure_type: 'three_act',
        act_1_chapters: JSON.stringify(getChaptersForAct(1)),
        act_2_chapters: JSON.stringify(getChaptersForAct(2)),
        act_3_chapters: JSON.stringify(getChaptersForAct(3)),
        plot_points: JSON.stringify(plotPoints),
        character_arcs: JSON.stringify(characterArcs),
        themes: JSON.stringify(themes)
      }

      if (outline) {
        const { error } = await supabase
          .from('novel_outlines')
          .update(outlineData)
          .eq('id', outline.id)
        
        if (error) throw error
      } else {
        const { data: newOutline, error } = await supabase
          .from('novel_outlines')
          .insert(outlineData)
          .select()
          .single()
        
        if (error) throw error
        setOutline(newOutline)
      }
    } catch (error) {
      console.error('Error saving outline:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getChaptersForAct = (act: number) => {
    const totalChapters = chapters.length
    if (totalChapters === 0) return []

    switch (act) {
      case 1:
        return chapters.slice(0, Math.ceil(totalChapters * 0.25)).map(c => c.chapter_number)
      case 2:
        const act1End = Math.ceil(totalChapters * 0.25)
        const act2End = Math.ceil(totalChapters * 0.75)
        return chapters.slice(act1End, act2End).map(c => c.chapter_number)
      case 3:
        const act3Start = Math.ceil(totalChapters * 0.75)
        return chapters.slice(act3Start).map(c => c.chapter_number)
      default:
        return []
    }
  }

  const addCharacterArc = () => {
    setCharacterArcs([...characterArcs, {
      name: '',
      goal: '',
      conflict: '',
      arc: ''
    }])
  }

  const updateCharacterArc = (index: number, field: string, value: string) => {
    const updated = [...characterArcs]
    updated[index] = { ...updated[index], [field]: value }
    setCharacterArcs(updated)
  }

  const removeCharacterArc = (index: number) => {
    setCharacterArcs(characterArcs.filter((_, i) => i !== index))
  }

  const addTheme = () => {
    setThemes([...themes, ''])
  }

  const updateTheme = (index: number, value: string) => {
    const updated = [...themes]
    updated[index] = value
    setThemes(updated)
  }

  const removeTheme = (index: number) => {
    setThemes(themes.filter((_, i) => i !== index))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const getActChapters = (act: number) => {
    const actChapters = getChaptersForAct(act)
    return chapters.filter(c => actChapters.includes(c.chapter_number))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading outline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Novel Outline</h2>
        <Button onClick={saveOutline} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Outline'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="plot">Plot Points</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Three-Act Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Act 1 */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('act1')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {expandedSections.includes('act1') ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    <h3 className="font-semibold">Act 1: Setup</h3>
                    <Badge variant="outline" className="ml-2">
                      {getActChapters(1).length} chapters
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    ~25% of novel
                  </div>
                </button>
                
                {expandedSections.includes('act1') && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Chapters in Act 1</h4>
                        <div className="space-y-1">
                          {getActChapters(1).map(chapter => (
                            <div key={chapter.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-sm">Chapter {chapter.chapter_number}: {chapter.title || 'Untitled'}</span>
                              <Badge className="text-xs">{chapter.word_count} words</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Act 1 Goals</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Introduce protagonist and world</li>
                          <li>• Establish normal world</li>
                          <li>• Present inciting incident</li>
                          <li>• End with Plot Point 1</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Act 2 */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('act2')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {expandedSections.includes('act2') ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    <h3 className="font-semibold">Act 2: Confrontation</h3>
                    <Badge variant="outline" className="ml-2">
                      {getActChapters(2).length} chapters
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    ~50% of novel
                  </div>
                </button>
                
                {expandedSections.includes('act2') && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Chapters in Act 2</h4>
                        <div className="space-y-1">
                          {getActChapters(2).map(chapter => (
                            <div key={chapter.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-sm">Chapter {chapter.chapter_number}: {chapter.title || 'Untitled'}</span>
                              <Badge className="text-xs">{chapter.word_count} words</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Act 2 Goals</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Develop central conflict</li>
                          <li>• Character growth and obstacles</li>
                          <li>• Midpoint twist/revelation</li>
                          <li>• Build to Plot Point 2</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Act 3 */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('act3')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {expandedSections.includes('act3') ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    <h3 className="font-semibold">Act 3: Resolution</h3>
                    <Badge variant="outline" className="ml-2">
                      {getActChapters(3).length} chapters
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    ~25% of novel
                  </div>
                </button>
                
                {expandedSections.includes('act3') && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Chapters in Act 3</h4>
                        <div className="space-y-1">
                          {getActChapters(3).map(chapter => (
                            <div key={chapter.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-sm">Chapter {chapter.chapter_number}: {chapter.title || 'Untitled'}</span>
                              <Badge className="text-xs">{chapter.word_count} words</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Act 3 Goals</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Build to climax</li>
                          <li>• Resolve main conflict</li>
                          <li>• Character transformation</li>
                          <li>• Satisfying conclusion</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="w-5 h-5 mr-2" />
                Key Plot Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'inciting_incident', label: 'Inciting Incident', description: 'The event that sets the story in motion' },
                { key: 'plot_point_1', label: 'Plot Point 1', description: 'End of Act 1 - protagonist commits to the journey' },
                { key: 'midpoint', label: 'Midpoint', description: 'Major revelation or twist that changes everything' },
                { key: 'plot_point_2', label: 'Plot Point 2', description: 'End of Act 2 - all seems lost, final push begins' },
                { key: 'climax', label: 'Climax', description: 'The final confrontation and resolution of main conflict' },
                { key: 'resolution', label: 'Resolution', description: 'New normal, loose ends tied up' }
              ].map(point => (
                <div key={point.key} className="space-y-2">
                  <label className="font-medium text-gray-800">{point.label}</label>
                  <p className="text-sm text-gray-600">{point.description}</p>
                  <Textarea
                    value={plotPoints[point.key as keyof typeof plotPoints]}
                    onChange={(e) => setPlotPoints({ ...plotPoints, [point.key]: e.target.value })}
                    placeholder={`Describe your ${point.label.toLowerCase()}...`}
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Character Arcs
                </CardTitle>
                <Button onClick={addCharacterArc} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Character
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {characterArcs.map((character, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={character.name}
                      onChange={(e) => updateCharacterArc(index, 'name', e.target.value)}
                      placeholder="Character name"
                      className="font-medium text-lg border-none outline-none bg-transparent"
                    />
                    <Button
                      onClick={() => removeCharacterArc(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Goal</label>
                      <Textarea
                        value={character.goal}
                        onChange={(e) => updateCharacterArc(index, 'goal', e.target.value)}
                        placeholder="What does this character want?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Conflict</label>
                      <Textarea
                        value={character.conflict}
                        onChange={(e) => updateCharacterArc(index, 'conflict', e.target.value)}
                        placeholder="What's preventing them from getting it?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Arc</label>
                      <Textarea
                        value={character.arc}
                        onChange={(e) => updateCharacterArc(index, 'arc', e.target.value)}
                        placeholder="How do they change throughout the story?"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {characterArcs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No character arcs yet. Add your first character to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Themes & Messages
                </CardTitle>
                <Button onClick={addTheme} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Theme
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {themes.map((theme, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Textarea
                    value={theme}
                    onChange={(e) => updateTheme(index, e.target.value)}
                    placeholder="What theme or message does your novel explore?"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeTheme(index)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {themes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No themes yet. Add the themes and messages you want to explore in your novel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
