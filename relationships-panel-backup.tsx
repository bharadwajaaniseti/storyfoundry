'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Plus, Heart, Search, MoreVertical, Trash2, Edit3, Users, 
  ArrowRight, Eye, EyeOff, Filter, X, ChevronDown, ChevronRight,
  Link2, Target, Zap, Crown, Shield, MessageCircle, Flame,
  Save, User, AlertTriangle, CheckCircle, Clock, Calendar,
  Network, BarChart3, TrendingUp, Activity, Grid,
  Layers, Move, RotateCcw, Share2, Download, Upload, Settings,
  Home, Swords, BookOpen, UserCircle, Palette, ZoomIn, ZoomOut,
  MapPin, Book, Globe, Brain, Package, Sparkles, Type, Map, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Enhanced CSS styles will be included via Tailwind CSS classes
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Enhanced Custom Components matching site design
interface EnhancedSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  triggerClassName?: string
  contentClassName?: string
  customDisplay?: string
  onOpenChange?: (open: boolean) => void
  [key: string]: any
}

const EnhancedSelect = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className,
  triggerClassName,
  contentClassName,
  customDisplay,
  ...props 
}: EnhancedSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      onOpenChange={setIsOpen}
      {...props}
    >
      <SelectTrigger 
        className={cn(
          "relative bg-white border-2 border-gray-200 rounded-xl shadow-sm px-5 py-4",
          "hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100",
          "transition-all duration-300 ease-out text-left overflow-hidden",
          "data-[state=open]:border-rose-500 data-[state=open]:ring-2 data-[state=open]:ring-rose-100",
          "data-[state=open]:shadow-lg",
          "[&>svg]:hidden", // Hide the default chevron
          triggerClassName,
          className
        )}
      >
        <div className="flex-1 pr-8 min-w-0 overflow-hidden">
          {customDisplay ? (
            <span className="text-base font-medium block truncate w-full text-left text-gray-900">
              {customDisplay}
            </span>
          ) : (
            <SelectValue 
              placeholder={placeholder} 
              className="text-base font-medium block truncate w-full text-left" 
            />
          )}
        </div>
        <ChevronDown 
          className={cn(
            "absolute right-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 flex-shrink-0",
            "transition-transform duration-200 pointer-events-none",
            isOpen && "rotate-180"
          )} 
        />
      </SelectTrigger>
      <SelectContent 
        className={cn(
          "bg-white border-2 border-gray-200 rounded-xl shadow-xl p-3 min-w-[300px]",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "backdrop-blur-sm max-h-[400px] overflow-y-auto",
          contentClassName
        )}
        sideOffset={6}
      >
        {children}
      </SelectContent>
    </Select>
  )
}

interface EnhancedSelectItemProps {
  children: React.ReactNode
  className?: string
  value: string
  [key: string]: any
}

const EnhancedSelectItem = ({ children, className, ...props }: EnhancedSelectItemProps) => {
  return (
    <SelectItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-5 py-4 mx-1 my-1.5",
        "text-base outline-none transition-all duration-200",
        "hover:bg-rose-50 hover:text-rose-900 focus:bg-rose-50 focus:text-rose-900",
        "data-[state=checked]:bg-rose-500 data-[state=checked]:text-white",
        "data-[state=checked]:shadow-md min-h-[56px]",
        className
      )}
      {...props}
    >
      <span className="absolute right-4 flex h-5 w-5 items-center justify-center">
        <CheckCircle className="h-4 w-4 opacity-0 data-[state=checked]:opacity-100 transition-opacity duration-200" />
      </span>
      <div className="flex-1 pr-8">
        {children}
      </div>
    </SelectItem>
  )
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={cn(
        "bg-white border-2 border-gray-200 rounded-xl shadow-sm px-5 py-4 text-base",
        "hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100",
        "transition-all duration-300 ease-out placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  )
})

EnhancedInput.displayName = "EnhancedInput"

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(({ className, ...props }, ref) => {
  return (
    <Textarea
      ref={ref}
      className={cn(
        "bg-white border-2 border-gray-200 rounded-xl shadow-sm px-5 py-4 text-base min-h-[120px]",
        "hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100",
        "transition-all duration-300 ease-out placeholder:text-gray-400 resize-none",
        className
      )}
      {...props}
    />
  )
})

EnhancedTextarea.displayName = "EnhancedTextarea"

interface EnhancedSliderProps {
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  min?: number
  max?: number
  label?: string
  color?: string
  className?: string
  leftLabel?: string
  rightLabel?: string
  [key: string]: any
}

const EnhancedSlider = ({ value, onChange, min = 0, max = 10, label, color = "rose", className, ...props }: EnhancedSliderProps) => {
  return (
    <div className="space-y-3">
      <Input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full h-3 bg-gray-200 rounded-xl appearance-none cursor-pointer",
          "slider-thumb:appearance-none slider-thumb:w-6 slider-thumb:h-6",
          `slider-thumb:bg-${color}-500 slider-thumb:rounded-full slider-thumb:shadow-lg`,
          "slider-thumb:border-4 slider-thumb:border-white slider-thumb:cursor-pointer",
          "hover:bg-gray-300 transition-colors duration-200",
          className
        )}
        {...props}
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{props.leftLabel || 'Low'}</span>
        <span className={`font-medium text-${color}-500`}>
          {label ? `${label}: ` : ''}{value}/{max}
        </span>
        <span>{props.rightLabel || 'High'}</span>
      </div>
    </div>
  )
}

interface Relationship {
  id: string
  name: string
  description: string
  attributes: {
    type?: string // romantic, familial, friendship, rivalry, professional, etc.
    strength?: number // 1-10 scale
    status?: string // active, former, complicated, unknown
    dynamics?: string[] // mutual_respect, one_sided, toxic, supportive, etc.
    history?: string
    current_state?: string
    character_1_id?: string
    character_1_name?: string
    character_2_id?: string
    character_2_name?: string
    notes?: string
    // Enhanced Campfire-style features
    timeline_events?: Array<{
      date: string
      event: string
      description: string
      impact_level: 'low' | 'medium' | 'high'
      relationship_change: number // -5 to +5
    }>
    tension_level?: number // 0-10 scale for conflict/tension
    intimacy_level?: number // 0-10 scale for emotional closeness
    dependency_level?: number // 0-10 scale for how much they need each other
    trust_level?: number // 0-10 scale
    respect_level?: number // 0-10 scale
    power_balance?: 'equal' | 'character_1_dominant' | 'character_2_dominant' | 'shifting'
    relationship_arc?: Array<{
      phase: string
      description: string
      chapters: string[]
      key_scenes: string[]
    }>
    conflict_sources?: string[] // money, values, goals, past, secrets, etc.
    bonding_factors?: string[] // shared_experiences, common_goals, mutual_respect, etc.
    relationship_goals?: string // where should this relationship go
    story_importance?: 'primary' | 'secondary' | 'background'
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface Character {
  id: string
  name: string
  description: string
  category: string
}

interface RelationshipsPanelProps {
  projectId: string
  selectedElement?: any
  onRelationshipsChange?: () => void
  onClearSelection?: () => void
}

const RELATIONSHIP_TYPES = [
  { value: 'romantic', label: 'Romantic', icon: Heart, color: 'rose', description: 'Love, attraction, partnership' },
  { value: 'familial', label: 'Family', icon: Users, color: 'blue', description: 'Blood relations, chosen family' },
  { value: 'friendship', label: 'Friendship', icon: User, color: 'green', description: 'Platonic bonds, companionship' },
  { value: 'rivalry', label: 'Rivalry', icon: Flame, color: 'red', description: 'Competition, antagonism' },
  { value: 'professional', label: 'Professional', icon: Shield, color: 'purple', description: 'Work relationships, business' },
  { value: 'mentorship', label: 'Mentorship', icon: Target, color: 'amber', description: 'Teacher-student, guidance' },
  { value: 'alliance', label: 'Alliance', icon: Link2, color: 'cyan', description: 'Strategic partnerships' },
  { value: 'conflict', label: 'Conflict', icon: Zap, color: 'orange', description: 'Enemies, adversaries' },
  { value: 'hierarchy', label: 'Hierarchy', icon: Crown, color: 'violet', description: 'Power structures, authority' },
  { value: 'dependency', label: 'Dependency', icon: Link2, color: 'teal', description: 'One-sided reliance' },
  { value: 'relationship_web', label: 'Visual Web', icon: Network, color: 'indigo', description: 'Canvas-based relationship network' },
  { value: 'other', label: 'Other', icon: MessageCircle, color: 'gray', description: 'Custom relationship type' }
]

const RELATIONSHIP_STATUS = [
  { value: 'developing', label: 'Developing', color: 'blue', description: 'Relationship is forming' },
  { value: 'active', label: 'Active', color: 'green', description: 'Currently engaged relationship' },
  { value: 'strained', label: 'Strained', color: 'yellow', description: 'Under tension or pressure' },
  { value: 'complicated', label: 'Complicated', color: 'orange', description: 'Complex, mixed dynamics' },
  { value: 'former', label: 'Former', color: 'gray', description: 'Past relationship, no longer active' },
  { value: 'broken', label: 'Broken', color: 'red', description: 'Severed or destroyed relationship' },
  { value: 'unknown', label: 'Unknown', color: 'slate', description: 'Status unclear or undefined' },
  { value: 'secret', label: 'Secret', color: 'purple', description: 'Hidden from others' }
]

const RELATIONSHIP_DYNAMICS = [
  'mutual_respect', 'one_sided', 'toxic', 'supportive', 'competitive',
  'protective', 'dependent', 'manipulative', 'inspiring', 'challenging',
  'nurturing', 'conflicted', 'secretive', 'open', 'balanced',
  'volatile', 'stable', 'passionate', 'distant', 'codependent'
]

const CONFLICT_SOURCES = [
  'money', 'values', 'goals', 'past_betrayal', 'secrets', 'jealousy',
  'power', 'resources', 'territory', 'ideology', 'love_triangle',
  'family_honor', 'revenge', 'misunderstanding', 'competition'
]

const BONDING_FACTORS = [
  'shared_trauma', 'common_goals', 'mutual_respect', 'shared_values',
  'complementary_skills', 'similar_background', 'shared_secrets',
  'mutual_protection', 'intellectual_connection', 'emotional_support'
]

const POWER_BALANCE_OPTIONS = [
  { value: 'equal', label: 'Equal Partnership', description: 'Both have equal influence' },
  { value: 'character_1_dominant', label: 'First Character Dominant', description: 'First character has more control' },
  { value: 'character_2_dominant', label: 'Second Character Dominant', description: 'Second character has more control' },
  { value: 'shifting', label: 'Shifting Power', description: 'Power changes based on situation' }
]

const STORY_IMPORTANCE = [
  { value: 'primary', label: 'Primary', color: 'red', description: 'Central to main plot' },
  { value: 'secondary', label: 'Secondary', color: 'amber', description: 'Important subplot element' },
  { value: 'background', label: 'Background', color: 'gray', description: 'Adds depth and context' }
]

// World Element Types Configuration
const WORLD_ELEMENT_TYPES = {
  characters: { 
    label: 'Characters', 
    icon: Users, 
    color: 'blue', 
    description: 'People and beings in your story' 
  },
  relationships: { 
    label: 'Relationships', 
    icon: Heart, 
    color: 'rose', 
    description: 'Connections and bonds between characters' 
  },
  locations: { 
    label: 'Locations', 
    icon: MapPin, 
    color: 'green', 
    description: 'Places and environments' 
  },
  timeline: { 
    label: 'Timeline', 
    icon: Clock, 
    color: 'purple', 
    description: 'Events and chronology' 
  },
  calendar: { 
    label: 'Calendar', 
    icon: Calendar, 
    color: 'orange', 
    description: 'Calendar systems and dates' 
  },
  calendar_system: { 
    label: 'Calendar', 
    icon: Calendar, 
    color: 'orange', 
    description: 'Calendar systems and dates' 
  },
  research: { 
    label: 'Research', 
    icon: BookOpen, 
    color: 'amber', 
    description: 'Research files and references' 
  },
  maps: { 
    label: 'Maps', 
    icon: Map, 
    color: 'cyan', 
    description: 'Geographic maps and layouts' 
  },
  species: { 
    label: 'Species', 
    icon: Zap, 
    color: 'yellow', 
    description: 'Races, creatures, and beings' 
  },
  cultures: { 
    label: 'Cultures', 
    icon: Crown, 
    color: 'pink', 
    description: 'Societies and civilizations' 
  },
  items: { 
    label: 'Items', 
    icon: Palette, 
    color: 'indigo', 
    description: 'Objects, artifacts, and possessions' 
  },
  systems: { 
    label: 'Systems', 
    icon: Globe, 
    color: 'teal', 
    description: 'Political, economic, and social structures' 
  },
  languages: { 
    label: 'Languages', 
    icon: Shield, 
    color: 'red', 
    description: 'Communication systems and dialects' 
  },
  religions: { 
    label: 'Religions', 
    icon: Heart, 
    color: 'rose', 
    description: 'Belief systems and spirituality' 
  },
  philosophies: { 
    label: 'Philosophies', 
    icon: Brain, 
    color: 'violet', 
    description: 'Worldviews and principles' 
  },
  encyclopedia: { 
    label: 'Encyclopedia', 
    icon: BookOpen, 
    color: 'emerald', 
    description: 'Knowledge and documented facts' 
  },
  magic: { 
    label: 'Magic', 
    icon: Sparkles, 
    color: 'purple', 
    description: 'Spells and magical systems' 
  },
  arcs: { 
    label: 'Arcs', 
    icon: Star, 
    color: 'orange', 
    description: 'Story arcs and plot elements' 
  }
}

// Helper functions for relationship display
function getRelationshipTypeIcon(type: string) {
  const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === type)
  return relationshipType ? relationshipType.icon : Heart
}

function getRelationshipTypeColor(type: string) {
  const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === type)
  return relationshipType ? relationshipType.color : 'gray'
}

function getStatusColor(status: string) {
  const statusObj = RELATIONSHIP_STATUS.find(s => s.value === status)
  return statusObj ? statusObj.color : 'gray'
}

// Component for individual relationship card
const RelationshipCard = React.memo(({ 
  relationship, 
  onEdit, 
  onDelete 
}: { 
  relationship: Relationship
  onEdit: (rel: Relationship) => void
  onDelete: (id: string) => void 
}) => {
  const TypeIcon = getRelationshipTypeIcon(relationship.attributes?.type || '')
  const typeColor = getRelationshipTypeColor(relationship.attributes?.type || '')
  const statusColor = getStatusColor(relationship.attributes?.status || 'active')
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow border border-gray-200 cursor-pointer" 
      onClick={() => onEdit(relationship)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
            <div>
              <CardTitle className="text-lg font-semibold truncate">
                {relationship.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`bg-${statusColor}-100 text-${statusColor}-700`}
                >
                  {RELATIONSHIP_STATUS.find(s => s.value === relationship.attributes?.status)?.label || 'Active'}
                </Badge>
                {relationship.attributes?.strength && (
                  <Badge variant="outline">
                    Strength: {relationship.attributes.strength}/10
                  </Badge>
                )}
                {relationship.attributes?.story_importance && (
                  <Badge 
                    variant="outline"
                    className={`bg-${STORY_IMPORTANCE.find(s => s.value === relationship.attributes?.story_importance)?.color}-100`}
                  >
                    {STORY_IMPORTANCE.find(s => s.value === relationship.attributes?.story_importance)?.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(relationship.id)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Characters */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">
              {relationship.attributes?.character_1_name || 'Character 1'}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-blue-600">
              {relationship.attributes?.character_2_name || 'Character 2'}
            </span>
          </div>

          {/* Enhanced Metrics */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {relationship.attributes?.tension_level !== undefined && (
              <div className="text-center">
                <div className="text-red-500 font-medium">Tension</div>
                <div>{relationship.attributes.tension_level}/10</div>
              </div>
            )}
            {relationship.attributes?.trust_level !== undefined && (
              <div className="text-center">
                <div className="text-blue-500 font-medium">Trust</div>
                <div>{relationship.attributes.trust_level}/10</div>
              </div>
            )}
            {relationship.attributes?.intimacy_level !== undefined && (
              <div className="text-center">
                <div className="text-purple-500 font-medium">Intimacy</div>
                <div>{relationship.attributes.intimacy_level}/10</div>
              </div>
            )}
          </div>

          {/* Description */}
          {relationship.description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {relationship.description}
            </p>
          )}

          {/* Dynamics */}
          {relationship.attributes?.dynamics && relationship.attributes.dynamics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {relationship.attributes.dynamics.slice(0, 3).map((dynamic: string) => (
                <Badge key={dynamic} variant="outline" className="text-xs">
                  {dynamic.replace('_', ' ')}
                </Badge>
              ))}
              {relationship.attributes.dynamics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{relationship.attributes.dynamics.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(relationship)
              }}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <span className="text-xs text-gray-500">
              {new Date(relationship.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

RelationshipCard.displayName = "RelationshipCard"

// Network View Component
const NetworkView = React.memo(({ 
  relationships, 
  characters, 
  networkData 
}: { 
  relationships: Relationship[]
  characters: Character[]
  networkData: { nodes: any[], links: any[] }
}) => {
  const networkRef = useRef<HTMLDivElement>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [networkScale, setNetworkScale] = useState(1)
  const [networkOffset, setNetworkOffset] = useState({ x: 0, y: 0 })
  const [isDraggingNetwork, setIsDraggingNetwork] = useState(false)
  const [dragStartNetwork, setDragStartNetwork] = useState({ x: 0, y: 0 })
  
  // Node dragging state
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragStartNode, setDragStartNode] = useState({ x: 0, y: 0 })
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [hasDraggedNode, setHasDraggedNode] = useState(false)

  // Generate network layout
  const generateNetworkLayout = useCallback(() => {
    if (!characters.length) return { nodes: [], connections: [] }

    const centerX = 400
    const centerY = 300
    const radius = Math.min(150, Math.max(80, characters.length * 15))

    // Create nodes in a circular layout
    const nodes = characters.map((character, index) => {
      const angle = (index * 2 * Math.PI) / characters.length
      const nodeRadius = radius + Math.sin(index * 0.5) * 30 // Add some variation
      
      // Count connections for this character
      const connectionCount = relationships.filter(r => 
        r.attributes?.character_1_id === character.id || 
        r.attributes?.character_2_id === character.id
      ).length
      
      return {
        id: character.id,
        name: character.name,
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius,
        connections: connectionCount,
        type: 'character'
      }
    })

    // Create connections - filter out invalid ones
    const connections = []
    
    for (const relationship of relationships) {
      if (!relationship.attributes) {
        continue
      }
      
      const attrs = relationship.attributes
      
      // Check if this is a relationship web with canvas data
      if (attrs.type === 'relationship_web' && attrs.canvas_data) {
        
        const canvasData = attrs.canvas_data
        if (canvasData.connections && Array.isArray(canvasData.connections)) {
          
          // Process each connection in the canvas data
          for (const canvasConnection of canvasData.connections) {
            // Try to extract character IDs from all possible fields
            const char1Id = canvasConnection.from || canvasConnection.source || canvasConnection.fromId || 
                           canvasConnection.sourceId || canvasConnection.startId || canvasConnection.start ||
                           canvasConnection.fromNodeId || canvasConnection.sourceNodeId
            const char2Id = canvasConnection.to || canvasConnection.target || canvasConnection.toId || 
                           canvasConnection.targetId || canvasConnection.endId || canvasConnection.end ||
                           canvasConnection.toNodeId || canvasConnection.targetNodeId
            
            if (char1Id && char2Id && char1Id !== char2Id) {
              // Verify both characters exist
              const char1 = characters.find(c => c.id === char1Id)
              const char2 = characters.find(c => c.id === char2Id)
              
              if (char1 && char2) {
                const connection = {
                  id: `${relationship.id}_${char1Id}_${char2Id}`,
                  fromId: char1Id,
                  toId: char2Id,
                  type: canvasConnection.type || relationship.name?.toLowerCase() || 'connection',
                  strength: canvasConnection.strength || 5,
                  label: canvasConnection.label || relationship.name || 'Connection',
                  tension: canvasConnection.tension || 0,
                  trust: canvasConnection.trust || 5
                }
                
                connections.push(connection)
              }
            }
          }
        }
      } else {
        // Original logic for direct relationship attributes
        
        const char1Id = attrs.character_1_id || attrs.character1_id || attrs.from_character_id || 
                       attrs.character_a_id || attrs.source_character_id
        const char2Id = attrs.character_2_id || attrs.character2_id || attrs.to_character_id || 
                       attrs.character_b_id || attrs.target_character_id
        
        let char1Name = attrs.character_1_name || attrs.character1_name || attrs.from_character || 
                       attrs.character_a || attrs.source_character
        let char2Name = attrs.character_2_name || attrs.character2_name || attrs.to_character || 
                       attrs.character_b || attrs.target_character
        
        // If no IDs, try to find by name
        let finalChar1Id = char1Id
        let finalChar2Id = char2Id
        
        if (!finalChar1Id && char1Name) {
          const char1 = characters.find(c => c.name === char1Name || (c as any).attributes?.name === char1Name)
          finalChar1Id = char1?.id
        }
        
        if (!finalChar2Id && char2Name) {
          const char2 = characters.find(c => c.name === char2Name || (c as any).attributes?.name === char2Name)
          finalChar2Id = char2?.id
        }
        
        if (finalChar1Id && finalChar2Id && finalChar1Id !== finalChar2Id) {
          // Verify both characters exist
          const char1 = characters.find(c => c.id === finalChar1Id)
          const char2 = characters.find(c => c.id === finalChar2Id)
          
          if (char1 && char2) {
            const connection = {
              id: relationship.id,
              fromId: finalChar1Id,
              toId: finalChar2Id,
              type: attrs?.relationship_type || attrs?.type || 'friendship',
              strength: attrs?.strength || 5,
              label: relationship.name || attrs?.description || attrs?.relationship_type || 'Connection',
              tension: attrs?.tension_level || 0,
              trust: attrs?.trust_level || 5
            }
            
            connections.push(connection)
          }
        }
      }
    }
      
    return { nodes, connections }
  }, [characters, relationships])

  const { nodes, connections } = generateNetworkLayout()

  // Get connection path between two nodes
  const getConnectionPath = (fromNode: any, toNode: any) => {
    if (!fromNode || !toNode) {
      return ''
    }
    
    // Apply node offsets for dragging
    const fromOffset = nodeOffsets[fromNode.id] || { x: 0, y: 0 }
    const toOffset = nodeOffsets[toNode.id] || { x: 0, y: 0 }
    
    const fromX = fromNode.x + fromOffset.x
    const fromY = fromNode.y + fromOffset.y
    const toX = toNode.x + toOffset.x
    const toY = toNode.y + toOffset.y
    
    const dx = toX - fromX
    const dy = toY - fromY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Create a slight curve for better visual appeal
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    const curvature = Math.min(distance * 0.2, 50)
    const perpX = -dy / distance * curvature
    const perpY = dx / distance * curvature
    
    const path = `M ${fromX} ${fromY} Q ${midX + perpX} ${midY + perpY} ${toX} ${toY}`
    
    return path
  }

  // Get color for relationship type
  const getRelationshipColor = (type: string, tension: number = 0) => {
    const colors = {
      friendship: '#10b981',
      romance: '#f43f5e',
      family: '#3b82f6',
      rivalry: '#f59e0b',
      conflict: '#ef4444',
      mentor: '#8b5cf6',
      alliance: '#06b6d4',
      professional: '#64748b',
      enemy: '#dc2626'
    }
    
    const baseColor = colors[type as keyof typeof colors] || '#6b7280'
    
    // Adjust opacity based on tension for conflicts
    if (tension > 5) {
      return `${baseColor}dd` // More opaque for high tension
    }
    
    return baseColor
  }

  // Handle network panning
  const handleNetworkMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingNode) { // Left click and not dragging a node
      setIsDraggingNetwork(true)
      setDragStartNetwork({ x: e.clientX, y: e.clientY })
    }
  }

  const handleNetworkMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNetwork) {
      const deltaX = e.clientX - dragStartNetwork.x
      const deltaY = e.clientY - dragStartNetwork.y
      
      setNetworkOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setDragStartNetwork({ x: e.clientX, y: e.clientY })
    }
  }

  const handleNetworkMouseUp = () => {
    setIsDraggingNetwork(false)
  }

  // Node dragging handlers
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent network dragging
    setIsDraggingNode(true)
    setDraggingNodeId(nodeId)
    setDragStartNode({ x: e.clientX, y: e.clientY })
    setHasDraggedNode(false)
  }

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode && draggingNodeId) {
      const deltaX = (e.clientX - dragStartNode.x) / networkScale
      const deltaY = (e.clientY - dragStartNode.y) / networkScale
      
      // If we've moved more than a few pixels, consider it a drag
      if (!hasDraggedNode && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        setHasDraggedNode(true)
      }
      
      setNodeOffsets(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: (prev[draggingNodeId]?.x || 0) + deltaX,
          y: (prev[draggingNodeId]?.y || 0) + deltaY
        }
      }))
      
      setDragStartNode({ x: e.clientX, y: e.clientY })
    }
  }

  const handleNodeMouseUp = () => {
    setIsDraggingNode(false)
    setDraggingNodeId(null)
  }

  // Network zoom
  const handleNetworkWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 1.1
    
    if (e.deltaY < 0) {
      setNetworkScale(prev => Math.min(prev * zoomFactor, 3))
    } else {
      setNetworkScale(prev => Math.max(prev / zoomFactor, 0.3))
    }
  }

  // Reset network view
  const resetNetworkView = () => {
    setNetworkScale(1)
    setNetworkOffset({ x: 0, y: 0 })
  }

  if (!characters.length) {
    return (
      <div className="h-96 border rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No Characters Available</p>
          <p className="text-gray-500 text-sm">
            Create characters first to see the relationship network
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Network Controls */}
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Network className="w-5 h-5 mr-2 text-blue-600" />
            Relationship Network
          </h3>
          <p className="text-sm text-gray-600">
            {characters.length} characters, {connections.length} relationships
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-lg border px-3 py-1">
            <button
              onClick={() => setNetworkScale(prev => Math.max(prev / 1.2, 0.3))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium">
              {Math.round(networkScale * 100)}%
            </span>
            <button
              onClick={() => setNetworkScale(prev => Math.min(prev * 1.2, 3))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetNetworkView}
            className="border-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Network Visualization */}
      <div
        ref={networkRef}
        className={`relative h-96 bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden ${
          isDraggingNetwork ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleNetworkMouseDown}
        onMouseMove={(e) => {
          handleNetworkMouseMove(e)
          handleNodeMouseMove(e)
        }}
        onMouseUp={() => {
          handleNetworkMouseUp()
          handleNodeMouseUp()
        }}
        onMouseLeave={() => {
          handleNetworkMouseUp()
          handleNodeMouseUp()
        }}
        onWheel={handleNetworkWheel}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${networkOffset.x}px, ${networkOffset.y}px) scale(${networkScale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Background Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="network-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network-grid)" />
          </svg>

          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <marker
                id="network-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M 0,0 L 0,8 L 8,4 z" fill="currentColor" />
              </marker>
              
              {/* Glow filter for connections */}
              <filter id="network-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {connections.map(connection => {
              const fromNode = nodes.find(n => n.id === connection.fromId)
              const toNode = nodes.find(n => n.id === connection.toId)
              
              if (!fromNode || !toNode) {
                return null
              }
              
              const pathData = getConnectionPath(fromNode, toNode)
              const connectionColor = getRelationshipColor(connection.type, connection.tension)
              const isHighlighted = selectedNodeId === connection.fromId || selectedNodeId === connection.toId ||
                                   hoveredNodeId === connection.fromId || hoveredNodeId === connection.toId
              
              return (
                <g key={connection.id}>
                  {/* Connection Line - Make it more visible */}
                  <path
                    d={pathData}
                    stroke={connectionColor}
                    strokeWidth={Math.max(3, isHighlighted ? 5 : 3)} // Minimum 3px width
                    fill="none"
                    className={`transition-all duration-200`}
                    opacity={isHighlighted ? 1 : 0.8} // Always visible
                    filter={isHighlighted ? "url(#network-glow)" : undefined}
                    strokeDasharray={connection.type === 'rivalry' || connection.type === 'conflict' ? '8,4' : undefined}
                    markerEnd="url(#network-arrow)"
                    style={{ color: connectionColor }}
                    strokeLinecap="round"
                  />
                  
                  {/* Connection Label */}
                  {isHighlighted && (() => {
                    const fromOffset = nodeOffsets[fromNode.id] || { x: 0, y: 0 }
                    const toOffset = nodeOffsets[toNode.id] || { x: 0, y: 0 }
                    const adjustedFromX = fromNode.x + fromOffset.x
                    const adjustedFromY = fromNode.y + fromOffset.y
                    const adjustedToX = toNode.x + toOffset.x
                    const adjustedToY = toNode.y + toOffset.y
                    
                    return (
                      <text
                        x={(adjustedFromX + adjustedToX) / 2}
                        y={(adjustedFromY + adjustedToY) / 2 - 5}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 pointer-events-none"
                        style={{ fontSize: '11px' }}
                      >
                        {connection.type}
                      </text>
                    )
                  })()}
                </g>
              )
            })}
          </svg>

          {/* World Element Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id
            const isHovered = hoveredNodeId === node.id
            const isHighlighted = isSelected || isHovered
            const offset = nodeOffsets[node.id] || { x: 0, y: 0 }
            const isDragging = draggingNodeId === node.id
            
            // Get element configuration
            const elementConfig = WORLD_ELEMENT_TYPES[node.type as keyof typeof WORLD_ELEMENT_TYPES] || WORLD_ELEMENT_TYPES.characters
            const ElementIcon = elementConfig.icon
            
            return (
              <div
                key={node.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                  isHighlighted ? 'z-10 scale-110' : 'z-5'
                } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  left: node.x + offset.x,
                  top: node.y + offset.y
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!hasDraggedNode) { // Only select if not dragged
                    setSelectedNodeId(selectedNodeId === node.id ? null : node.id)
                  }
                }}
              >
                {/* Node Circle */}
                <div
                  className={`w-16 h-16 rounded-full border-4 shadow-lg cursor-pointer transition-all duration-200 ${
                    isHighlighted
                      ? `border-${elementConfig.color}-400 shadow-${elementConfig.color}-200/50 bg-white`
                      : `border-white shadow-gray-300/50 bg-gradient-to-br from-${elementConfig.color}-50 to-${elementConfig.color}-100 hover:border-${elementConfig.color}-300`
                  }`}
                >
                  {/* Element Icon or Initial */}
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-${elementConfig.color}-500 to-${elementConfig.color}-600 text-white`}>
                    {node.type === 'characters' ? (
                      node.name.charAt(0).toUpperCase()
                    ) : (
                      <ElementIcon className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Connection Count Badge - removed as requested */}
                </div>
                
                {/* Node Label */}
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium transition-colors duration-200 ${
                    isHighlighted ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {node.name}
                  </div>
                </div>
                
                {/* Selection Ring */}
                {isSelected && (
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-400 animate-pulse -m-px"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* Network Info Panel */}
        {selectedNodeId && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-4 max-w-xs">
            {(() => {
              const selectedNode = nodes.find(n => n.id === selectedNodeId)
              
              // Find relationships that involve the selected character
              const nodeRelationships = relationships.filter(r => {
                if (!r.attributes) {
                  return false
                }
                
                // Check traditional relationship fields
                if ((r.attributes.character_1_id === selectedNodeId || 
                     r.attributes.character_2_id === selectedNodeId) &&
                    r.attributes.character_1_id && 
                    r.attributes.character_2_id) {
                  return true
                }
                
                // Check canvas-based relationships
                if (r.attributes.type === 'relationship_web' && r.attributes.canvas_data) {
                  const canvasData = r.attributes.canvas_data
                  if (canvasData.connections && Array.isArray(canvasData.connections)) {
                    const hasMatch = canvasData.connections.some((conn: any) => {
                      // Try multiple ways to get node IDs
                      let fromId = conn.sourceNodeId || conn.from || conn.source
                      let toId = conn.targetNodeId || conn.to || conn.target
                      
                      // If no direct properties, try parsing from connection ID
                      if (!fromId && !toId && conn.id) {
                        // Connection ID format: nodeId1-nodeId2-timestamp
                        const parts = conn.id.split('-')
                        if (parts.length >= 10) { // UUID has 5 parts, so 2 UUIDs = 10 parts minimum
                          // Reconstruct the two UUIDs from the parts
                          fromId = parts.slice(0, 5).join('-') // First UUID (5 parts)
                          toId = parts.slice(5, 10).join('-')  // Second UUID (5 parts)
                        }
                      }
                      
                      return fromId === selectedNodeId || toId === selectedNodeId
                    })
                    return hasMatch
                  }
                }
                
                return false
              })
              
              if (!selectedNode) return null
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {selectedNode.name.charAt(0).toUpperCase()}
                      </div>
                      {selectedNode.name}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNodeId(null)}
                      className="w-6 h-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {nodeRelationships.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {nodeRelationships.length} Relationship{nodeRelationships.length !== 1 ? 's' : ''}
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {nodeRelationships.slice(0, 5).map(rel => {
                            let otherCharacterId: string | undefined
                            let relationshipName = rel.name || rel.attributes?.name || 'Unnamed Relationship'
                            let relationshipType = 'friendship'
                            
                            // Handle traditional relationships
                            if (rel.attributes?.character_1_id && rel.attributes?.character_2_id) {
                              otherCharacterId = rel.attributes.character_1_id === selectedNodeId 
                                ? rel.attributes.character_2_id 
                                : rel.attributes.character_1_id
                              relationshipType = rel.attributes.type || 'friendship'
                            }
                            // Handle canvas-based relationships
                            else if (rel.attributes?.type === 'relationship_web' && rel.attributes.canvas_data) {
                              const canvasData = rel.attributes.canvas_data
                              if (canvasData.connections && Array.isArray(canvasData.connections)) {
                                // Find the connection involving this character
                                const connection = canvasData.connections.find((conn: any) => {
                                  let fromId = conn.sourceNodeId || conn.from || conn.source
                                  let toId = conn.targetNodeId || conn.to || conn.target
                                  
                                  // If no direct properties, parse from connection ID
                                  if (!fromId && !toId && conn.id) {
                                    const parts = conn.id.split('-')
                                    if (parts.length >= 10) {
                                      fromId = parts.slice(0, 5).join('-')
                                      toId = parts.slice(5, 10).join('-')
                                    }
                                  }
                                  
                                  return fromId === selectedNodeId || toId === selectedNodeId
                                })
                                
                                if (connection) {
                                  let fromId = connection.sourceNodeId || connection.from || connection.source
                                  let toId = connection.targetNodeId || connection.to || connection.target
                                  
                                  // If no direct properties, parse from connection ID
                                  if (!fromId && !toId && connection.id) {
                                    const parts = connection.id.split('-')
                                    if (parts.length >= 10) {
                                      fromId = parts.slice(0, 5).join('-')
                                      toId = parts.slice(5, 10).join('-')
                                    }
                                  }
                                  
                                  otherCharacterId = fromId === selectedNodeId ? toId : fromId
                                  relationshipType = connection.type || 'connection'
                                  relationshipName = connection.label || rel.name || relationshipType
                                }
                              }
                            }
                            
                            const otherCharacter = characters.find(c => c.id === otherCharacterId)
                            
                            return (
                              <div key={rel.id} className="bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center text-sm">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: getRelationshipColor(relationshipType) }}
                                  />
                                  <span className="font-medium text-gray-900">
                                    {relationshipName}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 ml-5">
                                  with <span className="font-medium">{otherCharacter?.name || 'Unknown'}</span>
                                </div>
                              </div>
                            )
                          })}
                          {nodeRelationships.length > 5 && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              +{nodeRelationships.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No relationships
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Network Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Relationship Types</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { type: 'friendship', color: '#10b981', label: 'Friendship' },
              { type: 'romance', color: '#f43f5e', label: 'Romance' },
              { type: 'family', color: '#3b82f6', label: 'Family' },
              { type: 'rivalry', color: '#f59e0b', label: 'Rivalry' },
              { type: 'conflict', color: '#ef4444', label: 'Conflict' },
              { type: 'mentor', color: '#8b5cf6', label: 'Mentor' }
            ].map(item => (
              <div key={item.type} className="flex items-center">
                <div 
                  className="w-3 h-0.5 mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {!selectedNodeId && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-3">
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-700 mb-1">Network Controls</div>
              <div>• Click nodes to see details</div>
              <div>• Drag to pan • Scroll to zoom</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

NetworkView.displayName = "NetworkView"

// Matrix View Component
const MatrixView = React.memo(({ 
  characters, 
  relationships, 
  matrix 
}: { 
  characters: Character[]
  relationships: Relationship[]
  matrix: Array<Array<Relationship | null>>
}) => {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No characters available for matrix view</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-2 text-left font-medium">Character</th>
            {characters.map(char => (
              <th key={char.id} className="border border-gray-200 p-2 text-center font-medium min-w-24">
                <div className="truncate" title={char.name}>
                  {char.name.slice(0, 8)}...
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {characters.map((char1, i) => (
            <tr key={char1.id}>
              <td className="border border-gray-200 p-2 font-medium bg-gray-50">
                {char1.name}
              </td>
              {characters.map((char2, j) => {
                const relationship = matrix[i][j]
                const isSelf = i === j
                
                return (
                  <td key={char2.id} className="border border-gray-200 p-1 text-center">
                    {isSelf ? (
                      <div className="w-6 h-6 bg-gray-200 rounded mx-auto"></div>
                    ) : relationship ? (
                      <div 
                        className={`w-6 h-6 rounded mx-auto bg-${getRelationshipTypeColor(relationship.attributes?.type || '')}-500`}
                        title={`${relationship.name} (${relationship.attributes?.type})`}
                      ></div>
                    ) : (
                      <div className="w-6 h-6 border border-gray-300 rounded mx-auto bg-white"></div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Self</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-300 rounded bg-white"></div>
          <span>No relationship</span>
        </div>
        {RELATIONSHIP_TYPES.slice(0, 5).map(type => (
          <div key={type.value} className="flex items-center gap-2">
            <div className={`w-4 h-4 bg-${type.color}-500 rounded`}></div>
            <span>{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

MatrixView.displayName = "MatrixView"

// Timeline View Component
const TimelineView = React.memo(({ relationships }: { relationships: Relationship[] }) => {
  const relationshipsWithEvents = relationships.filter(r => 
    r.attributes?.timeline_events && r.attributes.timeline_events.length > 0
  )

  if (relationshipsWithEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-2">No timeline events</p>
        <p className="text-gray-500 text-sm">
          Add timeline events to your relationships to see their development over time
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {relationshipsWithEvents.map(relationship => (
        <Card key={relationship.id} className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            {relationship.name}
          </h3>
          <div className="space-y-2">
            {relationship.attributes?.timeline_events?.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 min-w-20">{event.date}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.event}</div>
                  {event.description && (
                    <div className="text-sm text-gray-600">{event.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
})

TimelineView.displayName = "TimelineView"

const RelationshipsPanel = ({ 
  projectId, 
  selectedElement, 
  onRelationshipsChange,
  onClearSelection 
}: RelationshipsPanelProps) => {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [worldElements, setWorldElements] = useState<any[]>([]) // All world-building elements
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'network' | 'matrix' | 'timeline'>('grid')
  const [activeTab, setActiveTab] = useState<'overview' | 'dynamics' | 'timeline' | 'analysis'>('overview')
  
  // Quick Connect Dialog state
  const [showQuickConnect, setShowQuickConnect] = useState(false)
  const [quickConnectChar1, setQuickConnectChar1] = useState<string>('')
  const [quickConnectChar2, setQuickConnectChar2] = useState<string>('')
  const [quickConnectType, setQuickConnectType] = useState<string>('friendship')
  const [quickConnectIntensity, setQuickConnectIntensity] = useState<number>(5)
  
  // Canvas-based relationship creation state
  const [showNameInput, setShowNameInput] = useState(false)
  const [relationshipName, setRelationshipName] = useState('')
  const [showCanvas, setShowCanvas] = useState(false) // New state for canvas creation interface
  
  const networkRef = useRef<HTMLDivElement>(null)
  
  // Enhanced form state for Campfire-style features
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    strength: 5,
    status: 'active',
    character_1_id: '',
    character_2_id: '',
    dynamics: [] as string[],
    history: '',
    current_state: '',
    notes: '',
    // Enhanced fields
    tension_level: 0,
    intimacy_level: 5,
    dependency_level: 0,
    trust_level: 5,
    respect_level: 5,
    power_balance: 'equal' as 'equal' | 'character_1_dominant' | 'character_2_dominant' | 'shifting',
    conflict_sources: [] as string[],
    bonding_factors: [] as string[],
    relationship_goals: '',
    story_importance: 'secondary' as 'primary' | 'secondary' | 'background'
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadRelationships()
    loadCharacters()
    loadAllWorldElements()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'relationships') {
      // Always open canvas for any relationship
      setRelationshipName(selectedElement.name)
      setEditingRelationship(selectedElement)
      setShowCanvas(true)
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (selectedElement && selectedElement.category === 'relationships') {
      }
    }
  }, [selectedElement])

  // Listen for canvas relationship events from sidebar
  useEffect(() => {
    const handleOpenRelationshipCanvas = (event: any) => {
      const relationship = event.detail.relationship
      
      // Always open canvas for any relationship
      if (relationship) {
        setRelationshipName(relationship.name)
        setEditingRelationship(relationship)
        setShowCanvas(true)
      }
    }

    window.addEventListener('openRelationshipCanvas', handleOpenRelationshipCanvas)
    return () => {
      window.removeEventListener('openRelationshipCanvas', handleOpenRelationshipCanvas)
    }
  }, [])

  const loadRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'relationships')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRelationships(data || [])
    } catch (error) {
      console.error('Error loading relationships:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category')
        .eq('project_id', projectId)
        .eq('category', 'characters')
        .order('name')

      if (error) throw error
      setCharacters(data || [])
    } catch (error) {
      console.error('Error loading characters:', error)
    }
  }

  const loadAllWorldElements = async () => {
    try {
      // Load all world elements regardless of category to see what's available
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category, attributes')
        .eq('project_id', projectId)
        .order('category')
        .order('name')

      if (error) throw error
      setWorldElements(data || [])
      
      // Log for debugging - this will help us see what categories actually exist
      console.log('Loaded world elements:', data?.length, 'elements')
      const categoriesFound = [...new Set(data?.map(el => el.category))].sort()
      console.log('Categories found in database:', categoriesFound)
      console.log('Categories in WORLD_ELEMENT_TYPES:', Object.keys(WORLD_ELEMENT_TYPES))
    } catch (error) {
      console.error('Error loading world elements:', error)
    }
  }

  const filteredRelationships = relationships.filter(relationship => {
    const matchesSearch = !searchTerm || 
      relationship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.attributes?.character_1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.attributes?.character_2_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || !selectedType || relationship.attributes?.type === selectedType
    const matchesStatus = selectedStatus === 'all' || !selectedStatus || relationship.attributes?.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateRelationship = async () => {
    try {
      const character1 = characters.find(c => c.id === formData.character_1_id)
      const character2 = characters.find(c => c.id === formData.character_2_id)

      if (!character1 || !character2) {
        console.error('Missing character selection:', { character1: !!character1, character2: !!character2 })
        alert('Please select both characters for the relationship')
        return
      }

      const relationshipData = {
        project_id: projectId,
        category: 'relationships',
        name: formData.name || `${character1.name} & ${character2.name}`,
        description: formData.description,
        attributes: {
          type: formData.type,
          strength: formData.strength,
          status: formData.status,
          character_1_id: formData.character_1_id,
          character_1_name: character1.name,
          character_2_id: formData.character_2_id,
          character_2_name: character2.name,
          dynamics: formData.dynamics,
          history: formData.history,
          current_state: formData.current_state,
          notes: formData.notes,
          // Enhanced Campfire-style fields
          tension_level: formData.tension_level,
          intimacy_level: formData.intimacy_level,
          dependency_level: formData.dependency_level,
          trust_level: formData.trust_level,
          respect_level: formData.respect_level,
          power_balance: formData.power_balance,
          conflict_sources: formData.conflict_sources,
          bonding_factors: formData.bonding_factors,
          relationship_goals: formData.relationship_goals,
          story_importance: formData.story_importance,
          timeline_events: []
        },
        tags: []
      }

      let result: Relationship
      if (editingRelationship) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...relationshipData, updated_at: new Date().toISOString() })
          .eq('id', editingRelationship.id)
          .select()
          .single()

        if (error) {
          console.error('Update error:', error)
          throw new Error(`Failed to update relationship: ${error.message}`)
        }
        result = data as Relationship

        setRelationships(prev => prev.map(r => r.id === editingRelationship.id ? result : r))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(relationshipData)
          .select()
          .single()

        if (error) {
          console.error('Insert error:', error)
          throw new Error(`Failed to create relationship: ${error.message}`)
        }
        result = data as Relationship

        setRelationships(prev => [result, ...prev])
      }

      // Broadcast change
      window.dispatchEvent(new CustomEvent('relationshipCreated', { 
        detail: { relationship: result, projectId } 
      }))

      setShowCreateDialog(false)
      setEditingRelationship(null)
      resetForm()
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error creating/updating relationship:', error)
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'An unexpected error occurred while saving the relationship')
    }
  }

  const handleDeleteRelationship = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRelationships(prev => prev.filter(r => r.id !== id))
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error deleting relationship:', error)
    }
  }

  // Quick Connect handler for flowchart-style relationship creation
  const handleQuickConnect = async (char1Id?: string, char2Id?: string) => {
    const character1Id = char1Id || quickConnectChar1
    const character2Id = char2Id || quickConnectChar2
    
    if (!character1Id || !character2Id) return
    
    const character1 = characters.find(c => c.id === character1Id)
    const character2 = characters.find(c => c.id === character2Id)
    
    if (!character1 || !character2) return
    
    try {
      const relationshipData = {
        project_id: projectId,
        category: 'relationships',
        name: `${character1.name} & ${character2.name}`,
        type: 'character',
        attributes: {
          name: `${character1.name} & ${character2.name}`,
          type: char1Id ? 'friendship' : quickConnectType,
          strength: char1Id ? 5 : quickConnectIntensity,
          status: 'active',
          character_1_id: character1Id,
          character_2_id: character2Id,
          description: `${char1Id ? 'friendship' : quickConnectType} relationship`,
          dynamics: [],
          history: '',
          current_state: 'developing',
          notes: '',
          tension_level: (char1Id ? 'friendship' : quickConnectType) === 'conflict' ? 7 : (char1Id ? 'friendship' : quickConnectType) === 'rivalry' ? 5 : 2,
          intimacy_level: (char1Id ? 'friendship' : quickConnectType) === 'romance' ? 8 : (char1Id ? 'friendship' : quickConnectType) === 'family' ? 7 : 5,
          dependency_level: (char1Id ? 5 : quickConnectIntensity) >= 7 ? 6 : 3,
          trust_level: (char1Id ? 'friendship' : quickConnectType) === 'conflict' ? 2 : (char1Id ? 'friendship' : quickConnectType) === 'rivalry' ? 4 : 7,
          respect_level: (char1Id ? 5 : quickConnectIntensity) >= 6 ? 7 : 5,
          power_balance: 'equal',
          conflict_sources: [],
          bonding_factors: [],
          relationship_goals: [],
          story_importance: 'moderate',
          timeline_events: []
        },
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(relationshipData)
        .select()
        .single()

      if (error) throw error
      const result = data as Relationship

      setRelationships(prev => [result, ...prev])
      
      // Broadcast change
      window.dispatchEvent(new CustomEvent('relationshipCreated', { 
        detail: { relationship: result, projectId } 
      }))

      if (!char1Id) {
        // Reset dialog if opened from Quick Connect
        setShowQuickConnect(false)
        setQuickConnectChar1('')
        setQuickConnectChar2('')
        setQuickConnectType('friendship')
        setQuickConnectIntensity(5)
      }
      
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error creating relationship:', error)
    }
  }

  // Handle saving canvas-based relationship
  const handleSaveCanvasRelationship = async (canvasData: { nodes: CanvasNode[], connections: CanvasConnection[] }) => {
    try {
      const supabase = createSupabaseClient()
      
      // Validate required data
      if (!projectId) {
        console.error('No projectId provided')
        return
      }
      
      if (!canvasData || !canvasData.nodes || !canvasData.connections) {
        console.error('Invalid canvas data:', canvasData)
        return
      }
      
      // Generate a name if none is provided
      const webName = relationshipName?.trim() || (editingRelationship?.name) || `Relationship Web - ${new Date().toLocaleDateString()}`
      
      // Create the relationship web data
      const relationshipWebData = {
        name: webName,
        description: `Visual relationship web showing connections between ${canvasData.nodes.length} elements`,
        category: 'relationships',
        project_id: projectId,
        attributes: {
          type: 'relationship_web',
          canvas_data: canvasData,
          created_at: editingRelationship?.attributes?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        tags: ['relationship', 'visual', 'canvas']
      }

      let data: any, error: any

      if (editingRelationship) {
        // Update existing relationship
        const updateResult = await supabase
          .from('world_elements')
          .update(relationshipWebData)
          .eq('id', editingRelationship.id)
          .select()
          .single()
        
        data = updateResult.data
        error = updateResult.error
        
        if (!error && data) {
          // Update the relationships list
          setRelationships(prev => prev.map(r => r.id === editingRelationship.id ? data : r))
        }
      } else {
        // Create new relationship
        const insertResult = await supabase
          .from('world_elements')
          .insert(relationshipWebData)
          .select()
          .single()
        
        data = insertResult.data
        error = insertResult.error
        
        if (!error && data) {
          // Add to relationships list
          setRelationships(prev => [data, ...prev])
        }
      }

      if (error) {
        console.error('Error saving relationship web:', JSON.stringify(error, null, 2))
        console.error('Attempted to save:', JSON.stringify(relationshipWebData, null, 2))
        return
      }

      if (!data) {
        console.error('No data returned from relationship web insert')
        console.error('Insert result - data:', data, 'error:', error)
        return
      }

      const savedRelationshipWeb = data

      // Refresh the relationships list
      await loadRelationships()
      
      // Broadcast change for sidebar update
      if (editingRelationship) {
        window.dispatchEvent(new CustomEvent('relationshipUpdated', { 
          detail: { relationship: savedRelationshipWeb, projectId } 
        }))
      } else {
        window.dispatchEvent(new CustomEvent('relationshipCreated', { 
          detail: { relationship: savedRelationshipWeb, projectId } 
        }))
      }

      // Clear editing state
      setEditingRelationship(null)
      
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error saving canvas relationship:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      strength: 5,
      status: 'active',
      character_1_id: '',
      character_2_id: '',
      dynamics: [],
      history: '',
      current_state: '',
      notes: '',
      // Enhanced fields
      tension_level: 0,
      intimacy_level: 5,
      dependency_level: 0,
      trust_level: 5,
      respect_level: 5,
      power_balance: 'equal',
      conflict_sources: [],
      bonding_factors: [],
      relationship_goals: '',
      story_importance: 'secondary'
    })
  }

  // Network view helpers
  const generateNetworkData = useCallback(() => {
    const nodes = characters.map(character => ({
      id: character.id,
      name: character.name,
      type: 'character',
      connections: relationships.filter(r => 
        r.attributes?.character_1_id === character.id || 
        r.attributes?.character_2_id === character.id
      ).length
    }))

    const links = relationships.map(relationship => ({
      source: relationship.attributes?.character_1_id,
      target: relationship.attributes?.character_2_id,
      type: relationship.attributes?.type,
      strength: relationship.attributes?.strength || 5,
      tension: relationship.attributes?.tension_level || 0,
      status: relationship.attributes?.status,
      relationship: relationship
    })).filter(link => link.source && link.target)

    return { nodes, links }
  }, [characters, relationships])

  // Character relationship matrix
  const generateMatrix = useCallback(() => {
    const matrix: Array<Array<Relationship | null>> = []
    
    characters.forEach((char1, i) => {
      matrix[i] = []
      characters.forEach((char2, j) => {
        if (i === j) {
          matrix[i][j] = null // Same character
        } else {
          const relationship = relationships.find(r => 
            (r.attributes?.character_1_id === char1.id && r.attributes?.character_2_id === char2.id) ||
            (r.attributes?.character_1_id === char2.id && r.attributes?.character_2_id === char1.id)
          )
          matrix[i][j] = relationship || null
        }
      })
    })
    
    return matrix
  }, [characters, relationships])

  // Analytics calculations
  const relationshipAnalytics = useCallback(() => {
    const totalRelationships = relationships.length
    const activeRelationships = relationships.filter(r => r.attributes?.status === 'active').length
    const conflictRelationships = relationships.filter(r => 
      r.attributes?.type === 'conflict' || r.attributes?.type === 'rivalry'
    ).length
    const romanticRelationships = relationships.filter(r => r.attributes?.type === 'romantic').length
    
    const avgTension = relationships.reduce((sum, r) => sum + (r.attributes?.tension_level || 0), 0) / totalRelationships || 0
    const avgIntimacy = relationships.reduce((sum, r) => sum + (r.attributes?.intimacy_level || 0), 0) / totalRelationships || 0
    
    const mostConnectedCharacter = characters.reduce((max, char) => {
      const connections = relationships.filter(r => 
        r.attributes?.character_1_id === char.id || r.attributes?.character_2_id === char.id
      ).length
      return connections > max.connections ? { character: char, connections } : max
    }, { character: null as Character | null, connections: 0 })

    return {
      totalRelationships,
      activeRelationships,
      conflictRelationships,
      romanticRelationships,
      avgTension: Math.round(avgTension * 10) / 10,
      avgIntimacy: Math.round(avgIntimacy * 10) / 10,
      mostConnectedCharacter
    }
  }, [relationships, characters])

  if (loading) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show canvas full-screen when creating a new relationship
  if (showCanvas) {
    return (
      <div className="h-full bg-white">
        <InlineRelationshipCanvas
          relationshipName={relationshipName}
          characters={characters}
          worldElements={worldElements}
          existingRelationship={editingRelationship}
          onClose={() => {
            setShowCanvas(false)
            setRelationshipName('')
          }}
          onSave={async (canvasData: { nodes: CanvasNode[], connections: CanvasConnection[] }) => {
            await handleSaveCanvasRelationship(canvasData)
            setShowCanvas(false)
            setRelationshipName('')
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" />
              Relationships
            </h2>
            <p className="text-sm text-gray-500">Map connections, dynamics, and story arcs between characters</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs px-3"
              >
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'network' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('network')}
                className="text-xs px-3"
              >
                <Network className="w-4 h-4 mr-1" />
                Network
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                className="text-xs px-3"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Matrix
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="text-xs px-3"
              >
                <Activity className="w-4 h-4 mr-1" />
                Timeline
              </Button>
            </div>
            
            {/* Create Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuickConnect(true)
                }}
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Connect
              </Button>
              {!showNameInput ? (
                <Button
                  onClick={() => setShowNameInput(true)}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Relationship
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <EnhancedInput
                    placeholder="Enter relationship name..."
                    value={relationshipName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelationshipName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter' && relationshipName.trim()) {
                        setShowCanvas(true)
                        setShowNameInput(false)
                      } else if (e.key === 'Escape') {
                        setShowNameInput(false)
                        setRelationshipName('')
                      }
                    }}
                    className="min-w-[300px]"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      if (relationshipName.trim()) {
                        setShowCanvas(true)
                        setShowNameInput(false)
                      }
                    }}
                    disabled={!relationshipName.trim()}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNameInput(false)
                      setRelationshipName('')
                    }}
                    className="border-gray-300 hover:border-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search relationships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RELATIONSHIP_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {RELATIONSHIP_STATUS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${status.color}-500`}></div>
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {filteredRelationships.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No relationships yet</p>
            <p className="text-gray-500 mb-6">
              Start mapping the connections between your characters to bring depth to your story.
            </p>
            <Button 
              onClick={() => {
                setRelationshipName("First Relationship")
                setShowCanvas(true)
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Relationship
            </Button>
          </div>
        ) : (
          <>
            {/* Analytics Dashboard */}
            {viewMode === 'grid' && (
              <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const analytics = relationshipAnalytics()
                  return (
                    <>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                          <span className="text-sm font-medium">Total</span>
                        </div>
                        <div className="text-2xl font-bold">{analytics.totalRelationships}</div>
                        <div className="text-xs text-gray-500">{analytics.activeRelationships} active</div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium">Conflicts</span>
                        </div>
                        <div className="text-2xl font-bold">{analytics.conflictRelationships}</div>
                        <div className="text-xs text-gray-500">Tension avg: {analytics.avgTension}/10</div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-pink-500" />
                          <span className="text-sm font-medium">Romance</span>
                        </div>
                        <div className="text-2xl font-bold">{analytics.romanticRelationships}</div>
                        <div className="text-xs text-gray-500">Intimacy avg: {analytics.avgIntimacy}/10</div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Network className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium">Hub</span>
                        </div>
                        <div className="text-lg font-bold truncate">
                          {analytics.mostConnectedCharacter.character?.name || 'None'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {analytics.mostConnectedCharacter.connections} connections
                        </div>
                      </Card>
                    </>
                  )
                })()}
              </div>
            )}

            {/* View Content */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRelationships.map(relationship => (
                  <RelationshipCard
                    key={relationship.id}
                    relationship={relationship}
                    onEdit={(rel) => {
                      // Always open canvas for any relationship
                      setRelationshipName(rel.name)
                      setEditingRelationship(rel)
                      setShowCanvas(true)
                    }}
                    onDelete={handleDeleteRelationship}
                  />
                ))}
              </div>
            )}

            {viewMode === 'network' && (
              <NetworkView 
                relationships={filteredRelationships} 
                characters={characters}
                networkData={generateNetworkData()}
              />
            )}

            {viewMode === 'matrix' && (
              <MatrixView 
                characters={characters} 
                relationships={relationships}
                matrix={generateMatrix()}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineView relationships={filteredRelationships} />
            )}
          </>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setEditingRelationship(null)
            resetForm()
            onClearSelection?.()
          }
        }}>
          <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] overflow-y-auto bg-white border-rose-200 shadow-2xl rounded-3xl">
            <DialogHeader className="pb-6 border-b border-rose-100">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                {editingRelationship ? 'Edit Relationship' : 'Create New Relationship'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 text-base">
                Define the connection, dynamics, and story arc between two characters to bring depth to your story.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-4 bg-rose-50 border border-rose-200 rounded-2xl p-1 h-14">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md font-medium transition-all duration-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="dynamics" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md font-medium transition-all duration-300"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Dynamics
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md font-medium transition-all duration-300"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md font-medium transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8 py-6">
                {/* Character Selection */}
                <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-500" />
                    Characters
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="character_1" className="text-sm font-medium text-gray-700 mb-2 block">First Character</Label>
                      <EnhancedSelect value={formData.character_1_id} onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, character_1_id: value }))
                      }>
                          {characters.map(character => (
                            <EnhancedSelectItem key={character.id} value={character.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-sm font-medium text-rose-700">
                                  {character.name.charAt(0).toUpperCase()}
                                </div>
                                {character.name}
                              </div>
                            </EnhancedSelectItem>
                          ))}
                      </EnhancedSelect>
                    </div>
                    <div>
                      <Label htmlFor="character_2" className="text-sm font-medium text-gray-700 mb-2 block">Second Character</Label>
                      <EnhancedSelect value={formData.character_2_id} onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, character_2_id: value }))
                      }>
                          {characters.map(character => (
                            <EnhancedSelectItem key={character.id} value={character.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-sm font-medium text-rose-700">
                                  {character.name.charAt(0).toUpperCase()}
                                </div>
                                {character.name}
                              </div>
                            </EnhancedSelectItem>
                          ))}
                      </EnhancedSelect>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Basic Information
                  </h3>
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Relationship Name (Optional)</Label>
                    <EnhancedInput
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Auto-generated if left blank"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                    <EnhancedTextarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the nature of this relationship..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Type and Status */}
                <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rose-500" />
                    Settings & Status
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-2 block">Relationship Type</Label>
                      <EnhancedSelect value={formData.type} onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }>
                          {RELATIONSHIP_TYPES.map(type => (
                            <EnhancedSelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </EnhancedSelectItem>
                          ))}
                      </EnhancedSelect>
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                      <EnhancedSelect value={formData.status} onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }>
                          {RELATIONSHIP_STATUS.map(status => (
                            <EnhancedSelectItem key={status.value} value={status.value}>
                              {status.label}
                            </EnhancedSelectItem>
                          ))}
                      </EnhancedSelect>
                    </div>
                    <div>
                      <Label htmlFor="story_importance" className="text-sm font-medium text-gray-700 mb-2 block">Story Importance</Label>
                      <EnhancedSelect value={formData.story_importance} onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, story_importance: value as any }))
                      }>
                          {STORY_IMPORTANCE.map(importance => (
                            <EnhancedSelectItem key={importance.value} value={importance.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-${importance.color}-500`}></div>
                                {importance.label}
                              </div>
                            </EnhancedSelectItem>
                          ))}
                      </EnhancedSelect>
                    </div>
                  </div>

                  {/* Power Balance */}
                  <div className="mt-6">
                    <Label htmlFor="power_balance" className="text-sm font-medium text-gray-700 mb-2 block">Power Balance</Label>
                    <EnhancedSelect value={formData.power_balance} onValueChange={(value: string) => 
                      setFormData(prev => ({ ...prev, power_balance: value as any }))
                    }>
                        {POWER_BALANCE_OPTIONS.map(option => (
                          <EnhancedSelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </EnhancedSelectItem>
                        ))}
                    </EnhancedSelect>
                  </div>
                </div>
              </TabsContent>

              {/* Dynamics Tab */}
              <TabsContent value="dynamics" className="space-y-6 py-4">
                {/* Relationship Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Tension Level */}
                    <div>
                      <Label htmlFor="tension_level">Tension Level (0-10)</Label>
                      <Input
                        id="tension_level"
                        type="range"
                        min="0"
                        max="10"
                        value={formData.tension_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, tension_level: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Peaceful</span>
                        <span className="font-medium text-red-500">{formData.tension_level}/10</span>
                        <span>Explosive</span>
                      </div>
                    </div>

                    {/* Trust Level */}
                    <div>
                      <Label htmlFor="trust_level">Trust Level (0-10)</Label>
                      <Input
                        id="trust_level"
                        type="range"
                        min="0"
                        max="10"
                        value={formData.trust_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, trust_level: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>None</span>
                        <span className="font-medium text-blue-500">{formData.trust_level}/10</span>
                        <span>Complete</span>
                      </div>
                    </div>

                    {/* Respect Level */}
                    <div>
                      <Label htmlFor="respect_level">Respect Level (0-10)</Label>
                      <Input
                        id="respect_level"
                        type="range"
                        min="0"
                        max="10"
                        value={formData.respect_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, respect_level: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Disdain</span>
                        <span className="font-medium text-green-500">{formData.respect_level}/10</span>
                        <span>Admiration</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Intimacy Level */}
                    <div>
                      <Label htmlFor="intimacy_level">Intimacy Level (0-10)</Label>
                      <Input
                        id="intimacy_level"
                        type="range"
                        min="0"
                        max="10"
                        value={formData.intimacy_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, intimacy_level: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Strangers</span>
                        <span className="font-medium text-purple-500">{formData.intimacy_level}/10</span>
                        <span>Soul Mates</span>
                      </div>
                    </div>

                    {/* Dependency Level */}
                    <div>
                      <Label htmlFor="dependency_level">Dependency Level (0-10)</Label>
                      <Input
                        id="dependency_level"
                        type="range"
                        min="0"
                        max="10"
                        value={formData.dependency_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, dependency_level: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Independent</span>
                        <span className="font-medium text-orange-500">{formData.dependency_level}/10</span>
                        <span>Codependent</span>
                      </div>
                    </div>

                    {/* Strength (overall) */}
                    <div>
                      <Label htmlFor="strength">Relationship Strength (1-10)</Label>
                      <Input
                        id="strength"
                        type="range"
                        min="1"
                        max="10"
                        value={formData.strength}
                        onChange={(e) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Weak</span>
                        <span className="font-medium">{formData.strength}/10</span>
                        <span>Unbreakable</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dynamics */}
                <div>
                  <Label>Relationship Dynamics</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {RELATIONSHIP_DYNAMICS.map(dynamic => (
                      <label key={dynamic} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.dynamics.includes(dynamic)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                dynamics: [...prev.dynamics, dynamic] 
                              }))
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                dynamics: prev.dynamics.filter(d => d !== dynamic) 
                              }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{dynamic.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Conflict Sources */}
                  <div>
                    <Label>Sources of Conflict</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {CONFLICT_SOURCES.map(source => (
                        <label key={source} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.conflict_sources.includes(source)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  conflict_sources: [...prev.conflict_sources, source] 
                                }))
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  conflict_sources: prev.conflict_sources.filter(s => s !== source) 
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span>{source.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bonding Factors */}
                  <div>
                    <Label>Bonding Factors</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {BONDING_FACTORS.map(factor => (
                        <label key={factor} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.bonding_factors.includes(factor)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  bonding_factors: [...prev.bonding_factors, factor] 
                                }))
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  bonding_factors: prev.bonding_factors.filter(f => f !== factor) 
                                }))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span>{factor.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6 py-4">
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">Timeline Events</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Track how this relationship develops over time
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Timeline Event
                  </Button>
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="relationship_goals">Relationship Goals & Arc</Label>
                    <Textarea
                      id="relationship_goals"
                      value={formData.relationship_goals}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship_goals: e.target.value }))}
                      placeholder="Where should this relationship go? What's the intended arc?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="history">Relationship History</Label>
                    <Textarea
                      id="history"
                      value={formData.history}
                      onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
                      placeholder="How did this relationship develop over time?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="current_state">Current State</Label>
                    <Textarea
                      id="current_state"
                      value={formData.current_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_state: e.target.value }))}
                      placeholder="What's the current state of this relationship?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any other notes about this relationship..."
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 bg-gradient-to-r from-rose-50/50 to-pink-50/50 -mx-6 -mb-6 px-6 pb-6 mt-6 rounded-b-3xl">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingRelationship(null)
                  resetForm()
                  onClearSelection?.()
                }}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-12 px-6 rounded-xl font-medium"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRelationship}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl h-12 px-8 rounded-xl font-medium transition-all duration-300"
                disabled={!formData.character_1_id || !formData.character_2_id}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingRelationship ? 'Update' : 'Create'} Relationship
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Connect Dialog */}
        <Dialog open={showQuickConnect} onOpenChange={setShowQuickConnect}>
          <DialogContent className="max-w-lg bg-white border-rose-200 shadow-2xl rounded-3xl">
            <DialogHeader className="pb-6 border-b border-rose-100">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                Quick Connect Characters
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Create a relationship between two characters instantly
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Character Selection */}
              <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-500" />
                  Select Characters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Character</label>
                    <EnhancedSelect value={quickConnectChar1} onValueChange={setQuickConnectChar1}>
                      {characters.map(character => (
                        <EnhancedSelectItem key={character.id} value={character.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-xs font-medium text-rose-700">
                              {character.name.charAt(0).toUpperCase()}
                            </div>
                            {character.name}
                          </div>
                        </EnhancedSelectItem>
                      ))}
                  </EnhancedSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Second Character</label>
                  <EnhancedSelect value={quickConnectChar2} onValueChange={setQuickConnectChar2}>
                      {characters.filter(c => c.id !== quickConnectChar1).map(character => (
                        <EnhancedSelectItem key={character.id} value={character.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-xs font-medium text-rose-700">
                              {character.name.charAt(0).toUpperCase()}
                            </div>
                            {character.name}
                          </div>
                        </EnhancedSelectItem>
                      ))}
                  </EnhancedSelect>
                </div>
              </div>
              </div>

              {/* Relationship Type */}
              <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Relationship Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                    <EnhancedSelect value={quickConnectType} onValueChange={setQuickConnectType}>
                    <EnhancedSelectItem value="friendship">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        Friendship
                      </div>
                    </EnhancedSelectItem>
                    <EnhancedSelectItem value="romance">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        Romance
                      </div>
                    </EnhancedSelectItem>
                    <EnhancedSelectItem value="family">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-500" />
                        Family
                      </div>
                    </EnhancedSelectItem>
                    <EnhancedSelectItem value="rivalry">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-orange-500" />
                        Rivalry
                      </div>
                    </EnhancedSelectItem>
                    <EnhancedSelectItem value="conflict">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Conflict
                      </div>
                    </EnhancedSelectItem>
                    <EnhancedSelectItem value="mentor">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        Mentor
                      </div>
                    </EnhancedSelectItem>
                </EnhancedSelect>
              </div>

              {/* Intensity Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Intensity: {quickConnectIntensity}/10
                </label>
                <Input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={quickConnectIntensity}
                  onChange={(e) => setQuickConnectIntensity(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
              </div>
              </div>
            </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-rose-100 bg-gradient-to-r from-rose-50/50 to-pink-50/50 -mx-6 -mb-6 px-6 pb-6 mt-6 rounded-b-3xl">
              <Button 
                variant="outline" 
                onClick={() => setShowQuickConnect(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-12 px-6 rounded-xl font-medium"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={() => handleQuickConnect()}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl h-12 px-8 rounded-xl font-medium transition-all duration-300"
                disabled={!quickConnectChar1 || !quickConnectChar2}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Connect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Canvas-based Relationship Editor Component
interface CanvasNode {
  id: string
  type: 'character' | 'location' | 'item' | 'concept'
  name: string
  x: number
  y: number
  width: number
  height: number
  color?: string
  imageUrl?: string
}

interface CanvasConnection {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string
  type: string
  color: string
  textColor?: string
  hasArrow: boolean
  hasReverseArrow?: boolean
  arrowSize?: number
  reverseArrowSize?: number
  arrowColor?: string
  reverseArrowColor?: string
  isDirectional: boolean
  strokeWidth?: number
  strokeDasharray?: string | null
}

interface RelationshipCanvasProps {
  relationshipName: string
  characters: Character[]
  worldElements?: any[]
  existingRelationship?: Relationship | null
  onClose: () => void
  onSave: (data: { nodes: CanvasNode[], connections: CanvasConnection[] }) => void
}

/*
/*
// TEMPORARILY COMMENTED OUT - ORIGINAL RelationshipCanvas function
const RelationshipCanvas: React.FC<RelationshipCanvasProps> = ({
  relationshipName,
  characters,
  worldElements = [],
  existingRelationship,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [connections, setConnections] = useState<CanvasConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [editingConnection, setEditingConnection] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [showElementsPanel, setShowElementsPanel] = useState(true)
  const [activeElementTab, setActiveElementTab] = useState('characters') // Active tab state
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['characters']) // Expanded categories state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [moveToolActive, setMoveToolActive] = useState(false)

  // Initialize canvas with existing relationship data if available
  useEffect(() => {
    if (existingRelationship && existingRelationship.attributes?.canvas_data) {
      const canvasData = existingRelationship.attributes.canvas_data
      
      if (canvasData.nodes) {
        setNodes(canvasData.nodes)
      }
      if (canvasData.connections) {
        // Add backward compatibility for existing connections
        const connectionsWithDefaults = canvasData.connections.map((conn: any) => ({
          ...conn,
          hasReverseArrow: conn.hasReverseArrow ?? false,
          arrowSize: conn.arrowSize ?? 12,
          reverseArrowSize: conn.reverseArrowSize ?? 12,
          arrowColor: conn.arrowColor ?? conn.color,
          reverseArrowColor: conn.reverseArrowColor ?? conn.color,
          strokeWidth: conn.strokeWidth ?? 2,
          // Set label from type if it's a predefined relationship and label is generic
          label: (conn.type !== 'custom' && (!conn.label || conn.label === 'New Relationship')) ? conn.type : conn.label
        }))
        setConnections(connectionsWithDefaults)
      }
    }
  }, [existingRelationship])

  // Set default active tab to first category with elements
  useEffect(() => {
    if (worldElements && worldElements.length > 0) {
      const availableCategories = Object.keys(WORLD_ELEMENT_TYPES).filter(category =>
        worldElements.some(element => element.category === category)
      )
      if (availableCategories.length > 0 && !availableCategories.includes(activeElementTab)) {
        setActiveElementTab(availableCategories[0])
      }
    }
  }, [worldElements, activeElementTab])

  // Add any world element to canvas
  const addElementToCanvas = (element: any) => {
    const elementConfig = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]
    const newNode: CanvasNode = {
      id: element.id,
      type: element.category,
      name: element.name,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 150,
      height: 80,
      color: elementConfig ? `#${getColorHex(elementConfig.color)}` : '#6b7280',
      imageUrl: undefined
    }
    setNodes(prev => [...prev, newNode])
  }

  // Helper function to convert Tailwind color names to hex
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      rose: 'f43f5e', green: '10b981', indigo: '6366f1', yellow: 'f59e0b',
      amber: 'f59e0b', pink: 'ec4899', teal: '14b8a6', red: 'ef4444',
      violet: '8b5cf6', emerald: '10b981', blue: '3b82f6', gray: '6b7280'
    }
    return colorMap[colorName] || '6b7280'
  }

  // Keep original function for backward compatibility
  const addCharacterToCanvas = (character: Character) => {
    addElementToCanvas(character)
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Handle node dragging
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Handle canvas panning with Shift+Left click, Right click, or Move tool
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Right-click OR Shift+Left-click OR Move tool + Left-click for panning
    const shouldPan = e.button === 2 || (e.button === 0 && e.shiftKey) || (e.button === 0 && moveToolActive)
    
    if (shouldPan) {
      // Only start panning if we're clicking on canvas background, not on nodes
      const target = e.target as Element
      const clickedOnCanvas = target === e.currentTarget || target.closest('svg') || target.closest('.absolute.inset-0')
      
      if (clickedOnCanvas) {
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        // Clear any selected node when starting to pan
        setSelectedNode(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedNode) {
      // Node dragging
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setNodes(prev => prev.map(node => 
        node.id === selectedNode 
          ? { ...node, x: node.x + deltaX / scale, y: node.y + deltaY / scale }
          : node
      ))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (isPanning) {
      // Canvas panning
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX / scale,
        y: prev.y + deltaY / scale
      }))
      
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Stop panning on right-click release or left-click release (if it was shift+left)
    if (e.button === 2 || e.button === 0) {
      setIsPanning(false)
    }
    setIsDragging(false)
  }

  // Connection creation
  const startConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectionStart(nodeId)
  }

  const completeConnection = (endNodeId: string) => {
    if (connectionStart && connectionStart !== endNodeId) {
      const newConnection: CanvasConnection = {
        id: `${connectionStart}-${endNodeId}-${Date.now()}`,
        fromNodeId: connectionStart,
        toNodeId: endNodeId,
        label: 'New Relationship',
        type: 'friendship',
        color: '#10b981',
        hasArrow: true,
        isDirectional: false
      }
      setConnections(prev => [...prev, newConnection])
    }
    setIsConnecting(false)
    setConnectionStart(null)
  }

  // Canvas controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3))
  const resetZoom = () => setScale(1)
  const fitToScreen = () => {
    // Implementation for fitting all nodes to screen
    setScale(1)
    setCanvasOffset({ x: 0, y: 0 })
    setIsPanning(false)
    setPanStart({ x: 0, y: 0 })
  }

  // Get connection path with draw.io-like smart routing
  const getConnectionPath = (connection: CanvasConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId)
    const toNode = nodes.find(n => n.id === connection.toNodeId)
    
    if (!fromNode || !toNode) return ''
    
    // Get the optimal connection points (like draw.io)
    const { fromPoint, toPoint } = getOptimalConnectionPoints(fromNode, toNode)
    
    // Create smart curved path based on relative positions
    return createSmartConnectionPath(fromPoint, toPoint, fromNode, toNode)
  }

  // Get optimal connection points on node edges (draw.io style)
  const getOptimalConnectionPoints = (fromNode: CanvasNode, toNode: CanvasNode) => {
    const fromCenter = {
      x: fromNode.x + fromNode.width / 2,
      y: fromNode.y + fromNode.height / 2
    }
    const toCenter = {
      x: toNode.x + toNode.width / 2,
      y: toNode.y + toNode.height / 2
    }
    
    // Calculate relative position to determine best connection points
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    
    // Determine which sides to connect (like draw.io logic)
    let fromPoint: { x: number, y: number, direction: string }
    let toPoint: { x: number, y: number, direction: string }
    
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    
    // Smart connection point selection
    if (absX > absY) {
      // Horizontal connection preferred
      if (dx > 0) {
        // From left to right
        fromPoint = {
          x: fromNode.x + fromNode.width,
          y: fromNode.y + fromNode.height / 2,
          direction: 'right'
        }
        toPoint = {
          x: toNode.x,
          y: toNode.y + toNode.height / 2,
          direction: 'left'
        }
      } else {
        // From right to left
        fromPoint = {
          x: fromNode.x,
          y: fromNode.y + fromNode.height / 2,
          direction: 'left'
        }
        toPoint = {
          x: toNode.x + toNode.width,
          y: toNode.y + toNode.height / 2,
          direction: 'right'
        }
      }
    } else {
      // Vertical connection preferred
      if (dy > 0) {
        // From top to bottom
        fromPoint = {
          x: fromNode.x + fromNode.width / 2,
          y: fromNode.y + fromNode.height,
          direction: 'bottom'
        }
        toPoint = {
          x: toNode.x + toNode.width / 2,
          y: toNode.y,
          direction: 'top'
        }
      } else {
        // From bottom to top
        fromPoint = {
          x: fromNode.x + fromNode.width / 2,
          y: fromNode.y,
          direction: 'top'
        }
        toPoint = {
          x: toNode.x + toNode.width / 2,
          y: toNode.y + toNode.height,
          direction: 'bottom'
        }
      }
    }
    
    return { fromPoint, toPoint }
  }

  // Create smart curved path (draw.io style)
  const createSmartConnectionPath = (
    fromPoint: { x: number, y: number, direction: string }, 
    toPoint: { x: number, y: number, direction: string },
    fromNode: CanvasNode,
    toNode: CanvasNode
  ) => {
    const distance = Math.sqrt(
      Math.pow(toPoint.x - fromPoint.x, 2) + 
      Math.pow(toPoint.y - fromPoint.y, 2)
    )
    
    // Control point distance (adaptive based on distance and direction)
    const controlDistance = Math.min(distance * 0.4, 100)
    
    // Calculate control points based on connection directions
    const controlPoint1 = getControlPoint(fromPoint, controlDistance)
    const controlPoint2 = getControlPoint(toPoint, controlDistance, true)
    
    // Create cubic bezier curve
    return `M ${fromPoint.x} ${fromPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toPoint.x} ${toPoint.y}`
  }

  // Get control point for smooth curves
  const getControlPoint = (
    point: { x: number, y: number, direction: string }, 
    distance: number, 
    reverse = false
  ) => {
    const multiplier = reverse ? -1 : 1
    
    switch (point.direction) {
      case 'right':
        return { x: point.x + distance * multiplier, y: point.y }
      case 'left':
        return { x: point.x - distance * multiplier, y: point.y }
      case 'bottom':
        return { x: point.x, y: point.y + distance * multiplier }
      case 'top':
        return { x: point.x, y: point.y - distance * multiplier }
      default:
        return { x: point.x + distance * multiplier, y: point.y }
    }
  }

  // Save canvas data
  const handleSave = () => {
    onSave({ nodes, connections })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      {/* Elements Panel */}
      {showElementsPanel && (
        <div className="w-80 bg-white shadow-xl flex flex-col">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Add Elements</h3>
            <p className="text-sm text-gray-600 mt-1">Browse and add world-building elements to the canvas</p>
          </div>
          
          {/* Horizontal Expandable Categories */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-3">
              {/* First show configured categories */}
              {Object.entries(WORLD_ELEMENT_TYPES).map(([category, config]) => {
                const elementsInCategory = worldElements.filter(element => element.category === category)
                if (elementsInCategory.length === 0) return null

                const Icon = config.icon
                const isExpanded = expandedCategories.includes(category)
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between p-3 transition-colors hover:bg-gray-50 ${
                        isExpanded ? `bg-${config.color}-50 border-${config.color}-200` : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 text-${config.color}-500`} />
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <p className="text-xs text-gray-500">{elementsInCategory.length} items</p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </button>
                    
                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-3 space-y-2">
                          {elementsInCategory.map(element => {
                            const isOnCanvas = nodes.some(node => node.id === element.id)
                            return (
                              <div
                                key={element.id}
                                onClick={() => !isOnCanvas && addElementToCanvas(element)}
                                className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                                  isOnCanvas 
                                    ? "bg-green-100 border border-green-200 cursor-default opacity-75" 
                                    : `bg-white hover:bg-${config.color}-50 hover:border-${config.color}-200 border border-gray-200 cursor-pointer hover:shadow-sm`
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                  isOnCanvas
                                    ? "bg-green-200 text-green-700"
                                    : `bg-${config.color}-100 text-${config.color}-700`
                                }`}>
                                  {category === 'characters' ? (
                                    element.name.charAt(0).toUpperCase()
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">
                                    {element.name}
                                  </span>
                                  {element.description && (
                                    <span className="text-xs text-gray-500 truncate block">
                                      {element.description}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isOnCanvas ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Plus className={`w-4 h-4 text-gray-400 group-hover:text-${config.color}-500`} />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Show unconfigured categories with fallback styling */}
              {(() => {
                const configuredCategories = Object.keys(WORLD_ELEMENT_TYPES)
                const unconfiguredCategories = [...new Set(worldElements.map(el => el.category))]
                  .filter(category => !configuredCategories.includes(category))
                
                return unconfiguredCategories.map(category => {
                  const elementsInCategory = worldElements.filter(element => element.category === category)
                  if (elementsInCategory.length === 0) return null
                  
                  const isExpanded = expandedCategories.includes(category)
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`w-full flex items-center justify-between p-3 transition-colors hover:bg-gray-50 ${
                          isExpanded ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-blue-500" />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                            <p className="text-xs text-gray-500">{elementsInCategory.length} items</p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-3 space-y-2">
                            {elementsInCategory.map((element: any) => {
                              const isOnCanvas = nodes.some(node => node.id === element.id)
                              return (
                                <div
                                  key={element.id}
                                  onClick={() => !isOnCanvas && addElementToCanvas(element)}
                                  className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                                    isOnCanvas 
                                      ? "bg-green-100 border border-green-200 cursor-default opacity-75" 
                                      : "bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 cursor-pointer hover:shadow-sm"
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                    isOnCanvas
                                      ? "bg-green-200 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}>
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate block">
                                      {element.name}
                                    </span>
                                    {element.description && (
                                      <span className="text-xs text-gray-500 truncate block">
                                        {element.description}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {isOnCanvas ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      {/* Closing the showElementsPanel conditional */}
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{relationshipName}</h2>
            <p className="text-sm text-gray-600">
              Visual Relationship Editor
              {moveToolActive && <span className="text-blue-600 ml-2">🔧 Move tool active</span>}
              {isPanning && <span className="text-green-600 ml-2">🖐️ Panning...</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={moveToolActive ? "default" : "outline"}
              onClick={() => setMoveToolActive(!moveToolActive)}
              className={moveToolActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300"}
              title="Move Tool - Click and drag to pan the canvas"
            >
              <Move className="w-4 h-4 mr-2" />
              Move
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowElementsPanel(!showElementsPanel)}
              className="border-gray-300"
            >
              <Layers className="w-4 h-4 mr-2" />
              {showElementsPanel ? 'Hide' : 'Show'} Elements
            </Button>
            
            <div className="flex items-center gap-1 border rounded-lg">
              <Button variant="ghost" size="sm" onClick={zoomOut}>
                <span className="text-lg">-</span>
              </Button>
              <span className="px-3 text-sm font-medium">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={zoomIn}>
                <span className="text-lg">+</span>
              </Button>
            </div>
            
            <Button variant="outline" onClick={resetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" onClick={fitToScreen}>
              <Grid className="w-4 h-4" />
            </Button>
            
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <div
            ref={canvasRef}
            className={cn(
              "w-full h-full relative select-none",
              isPanning ? "cursor-grabbing" : moveToolActive ? "cursor-move" : "cursor-default"
            )}
            style={{
              transform: `scale(${scale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Connections */}
            <svg 
              key={`connections-${connections.length}-${connections.map(c => `${c.id}-${c.hasArrow}-${c.hasReverseArrow}`).join('-')}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                {/* Single arrow marker that we'll reuse */}
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10" 
                  refX="9"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M 0,0 L 0,10 L 10,5 z"
                    fill="currentColor"
                  />
                </marker>
                {/* Reverse arrow marker */}
                <marker
                  id="arrowhead-reverse"
                  markerWidth="10"
                  markerHeight="10"
                  refX="1"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M 10,0 L 10,10 L 0,5 z"
                    fill="currentColor"
                  />
                </marker>
              </defs>
              {connections.map(connection => (
                <g key={connection.id}>
                  <path
                    d={getConnectionPath(connection)}
                    stroke={connection.color}
                    strokeWidth={connection.strokeWidth || 3}
                    strokeDasharray={connection.strokeDasharray || undefined}
                    fill="none"
                    className="pointer-events-auto cursor-pointer hover:stroke-width-4"
                    markerEnd={connection.hasArrow ? "url(#arrowhead)" : undefined}
                    markerStart={connection.hasReverseArrow ? "url(#arrowhead-reverse)" : undefined}
                    onClick={() => setSelectedConnection(connection.id)}
                  />
                </g>
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={cn(
                  "absolute bg-white rounded-xl shadow-lg border-2 cursor-move select-none",
                  selectedNode === node.id ? "border-rose-500" : "border-gray-200",
                  "hover:shadow-xl transition-shadow"
                )}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height
                }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={() => {
                  if (isConnecting) {
                    completeConnection(node.id)
                  } else {
                    setSelectedNode(node.id)
                  }
                }}
              >
                <div className="p-4 h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-sm font-medium text-rose-700 mx-auto mb-2">
                      {node.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{node.name}</span>
                    <div className="text-xs text-gray-500 capitalize">{node.type}</div>
                  </div>
                </div>

                {/* Node Actions */}
                {selectedNode === node.id && (
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-6 h-6 p-0 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        startConnection(node.id)
                      }}
                    >
                      <Link2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white border-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        setNodes(prev => prev.filter(n => n.id !== node.id))
                        setConnections(prev => prev.filter(c => 
                          c.fromNodeId !== node.id && c.toNodeId !== node.id
                        ))
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Connection Guide */}
            {isConnecting && (
              <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow">
                Click on another element to create a connection
              </div>
            )}
          </div>
        </div>

        {/* Connection Properties Panel */}
        {selectedConnection && (
          <div className="absolute bottom-4 right-4 w-80 bg-white rounded-xl shadow-xl border p-4">
            <h4 className="font-medium text-gray-900 mb-3">Connection Properties</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Label</Label>
                <Input
                  value={connections.find(c => c.id === selectedConnection)?.label || ''}
                  onChange={(e) => {
                    setConnections(prev => prev.map(conn => 
                      conn.id === selectedConnection 
                        ? { ...conn, label: e.target.value }
                        : conn
                    ))
                  }}
                />
              </div>
              <div>
                <Label className="text-sm">Color</Label>
                <input
                  type="color"
                  value={connections.find(c => c.id === selectedConnection)?.color || '#10b981'}
                  onChange={(e) => {
                    setConnections(prev => prev.map(conn => 
                      conn.id === selectedConnection 
                        ? { ...conn, color: e.target.value }
                        : conn
                    ))
                  }}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnections(prev => prev.filter(c => c.id !== selectedConnection))
                    setSelectedConnection(null)
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConnection(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
*/ 

// Simple working replacement for RelationshipCanvas
const RelationshipCanvas: React.FC<RelationshipCanvasProps> = ({
  relationshipName,
  characters,
  worldElements = [],
  existingRelationship,
  onClose,
  onSave
}) => {
  // Just redirect to the inline version which has all the functionality
  return (
    <InlineRelationshipCanvas
      relationshipName={relationshipName}
      characters={characters}
      worldElements={worldElements}
      existingRelationship={existingRelationship}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

// Inline Canvas Component for Main Content Area - TEMPORARILY COMMENTED OUT
/*
const InlineRelationshipCanvas: React.FC<RelationshipCanvasProps> = ({
  relationshipName,
  characters,
  worldElements = [],
  existingRelationship,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [connections, setConnections] = useState<CanvasConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [showElementsPanel, setShowElementsPanel] = useState(true)
  const [activeElementTab, setActiveElementTab] = useState('characters') // Active tab state
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['characters']) // Expanded categories state
  const [animationSpeed, setAnimationSpeed] = useState(3) // Animation duration in seconds
  const [showAnimations, setShowAnimations] = useState(true) // Toggle for animations
  const [isNodeDragging, setIsNodeDragging] = useState(false) // Track if any node is being dragged

  // Pan functionality state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [moveToolActive, setMoveToolActive] = useState(false)

  // Initialize canvas with existing relationship data if available
  useEffect(() => {
    if (existingRelationship && existingRelationship.attributes?.canvas_data) {
      const canvasData = existingRelationship.attributes.canvas_data
      
      if (canvasData.nodes) {
        setNodes(canvasData.nodes)
      }
      if (canvasData.connections) {
        setConnections(canvasData.connections)
      }
    }
  }, [existingRelationship])

  // Set default active tab to first category with elements
  useEffect(() => {
    if (worldElements && worldElements.length > 0) {
      const availableCategories = Object.keys(WORLD_ELEMENT_TYPES).filter(category =>
        worldElements.some(element => element.category === category)
      )
      if (availableCategories.length > 0 && !availableCategories.includes(activeElementTab)) {
        setActiveElementTab(availableCategories[0])
      }
    }
  }, [worldElements, activeElementTab])

  // Clean up duplicate nodes
  useEffect(() => {
    setNodes(prev => {
      const uniqueNodes = prev.filter((node, index, self) => 
        index === self.findIndex(n => n.id === node.id)
      )
      return uniqueNodes
    })
  }, [])

  // Keyboard shortcuts for animation control
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle animations with 'A' key
      if (event.key.toLowerCase() === 'a' && !event.ctrlKey && !event.altKey) {
        const activeElement = document.activeElement
        // Only trigger if not typing in an input/textarea
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          setShowAnimations(prev => !prev)
        }
      }
      // Speed controls with + and - keys
      else if (event.key === '+' && !event.ctrlKey && !event.altKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          setAnimationSpeed(prev => Math.min(10, prev + 0.5))
        }
      }
      else if (event.key === '-' && !event.ctrlKey && !event.altKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          setAnimationSpeed(prev => Math.max(0.5, prev - 0.5))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Add character to canvas
  const addCharacterToCanvas = (character: Character) => {
    // Check if character is already on canvas
    if (nodes.some(node => node.id === character.id)) {
      return
    }

    const newNode: CanvasNode = {
      id: character.id,
      type: 'character',
      name: character.name,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 150,
      height: 80,
      color: '#f43f5e'
    }
    setNodes(prev => [...prev, newNode])
  }

  // Add any world element to canvas
  const addElementToCanvas = (element: any) => {
    // Check if element is already on canvas
    if (nodes.some(node => node.id === element.id)) {
      return
    }

    const elementConfig = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES] || WORLD_ELEMENT_TYPES.characters
    const newNode: CanvasNode = {
      id: element.id,
      type: element.category,
      name: element.name,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 150,
      height: 80,
      color: elementConfig ? `#${getColorHex(elementConfig.color)}` : '#6b7280',
      imageUrl: undefined
    }
    setNodes(prev => [...prev, newNode])
  }

  // Helper function to convert Tailwind color names to hex
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      rose: 'f43f5e', green: '10b981', indigo: '6366f1', yellow: 'f59e0b',
      amber: 'f59e0b', pink: 'ec4899', teal: '14b8a6', red: 'ef4444',
      violet: '8b5cf6', emerald: '10b981', blue: '3b82f6', gray: '6b7280'
    }
    return colorMap[colorName] || '6b7280'
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Handle node dragging
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Handle canvas panning with Move tool, Shift+Left click, or Right click
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const shouldPan = e.button === 2 || (e.button === 0 && e.shiftKey) || (e.button === 0 && moveToolActive)
    
    if (shouldPan) {
      const target = e.target as Element
      const clickedOnCanvas = target === e.currentTarget || target.closest('svg') || target.closest('.absolute.inset-0')
      
      if (clickedOnCanvas) {
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setSelectedNode(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedNode) {
      // Node dragging logic
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setNodes(prev => prev.map(node => 
        node.id === selectedNode 
          ? { ...node, x: node.x + deltaX / scale, y: node.y + deltaY / scale }
          : node
      ))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (isPanning) {
      // Pan functionality - this is the core pan logic
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX / scale,
        y: prev.y + deltaY / scale
      }))
      
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 0) {
      setIsPanning(false)
    }
    setIsDragging(false)
  }

  // Connection creation
  const startConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectionStart(nodeId)
  }

  const completeConnection = (endNodeId: string) => {
    if (connectionStart && connectionStart !== endNodeId) {
      const newConnection: CanvasConnection = {
        id: `${connectionStart}-${endNodeId}-${Date.now()}`,
        fromNodeId: connectionStart,
        toNodeId: endNodeId,
        label: 'New Relationship',
        type: 'friendship',
        color: '#10b981',
        hasArrow: true,
        isDirectional: false
      }
      setConnections(prev => [...prev, newConnection])
    }
    setIsConnecting(false)
    setConnectionStart(null)
  }

  // Canvas controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3))
  const resetZoom = () => setScale(1)
  const fitToScreen = () => {
    setScale(1)
    setCanvasOffset({ x: 0, y: 0 })
    setIsPanning(false)
    setPanStart({ x: 0, y: 0 })
  }

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if Ctrl key is held (for more precise zoom)
    const zoomFactor = e.ctrlKey ? 1.1 : 1.2
    
    if (e.deltaY < 0) {
      // Zoom in
      setScale(prev => Math.min(prev * zoomFactor, 3))
    } else {
      // Zoom out
      setScale(prev => Math.max(prev / zoomFactor, 0.3))
    }
  }

  // Get connection path with draw.io-like smart routing
  const getConnectionPath = (connection: CanvasConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId)
    const toNode = nodes.find(n => n.id === connection.toNodeId)
    
    if (!fromNode || !toNode) return ''
    
    // Get the optimal connection points (like draw.io)
    const { fromPoint, toPoint } = getOptimalConnectionPoints(fromNode, toNode)
    
    // Create smart curved path based on relative positions
    return createSmartConnectionPath(fromPoint, toPoint, fromNode, toNode)
  }

  // Get optimal connection points on node edges (draw.io style)
  const getOptimalConnectionPoints = (fromNode: CanvasNode, toNode: CanvasNode) => {
    const fromCenter = {
      x: fromNode.x + fromNode.width / 2,
      y: fromNode.y + fromNode.height / 2
    }
    const toCenter = {
      x: toNode.x + toNode.width / 2,
      y: toNode.y + toNode.height / 2
    }
    
    // Calculate relative position to determine best connection points
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    
    // Determine which sides to connect (like draw.io logic)
    let fromPoint: { x: number, y: number, direction: string }
    let toPoint: { x: number, y: number, direction: string }
    
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    
    // Smart connection point selection
    if (absX > absY) {
      // Horizontal connection preferred
      if (dx > 0) {
        // From left to right
        fromPoint = {
          x: fromNode.x + fromNode.width,
          y: fromNode.y + fromNode.height / 2,
          direction: 'right'
        }
        toPoint = {
          x: toNode.x,
          y: toNode.y + toNode.height / 2,
          direction: 'left'
        }
      } else {
        // From right to left
        fromPoint = {
          x: fromNode.x,
          y: fromNode.y + fromNode.height / 2,
          direction: 'left'
        }
        toPoint = {
          x: toNode.x + toNode.width,
          y: toNode.y + toNode.height / 2,
          direction: 'right'
        }
      }
    } else {
      // Vertical connection preferred
      if (dy > 0) {
        // From top to bottom
        fromPoint = {
          x: fromNode.x + fromNode.width / 2,
          y: fromNode.y + fromNode.height,
          direction: 'bottom'
        }
        toPoint = {
          x: toNode.x + toNode.width / 2,
          y: toNode.y,
          direction: 'top'
        }
      } else {
        // From bottom to top
        fromPoint = {
          x: fromNode.x + fromNode.width / 2,
          y: fromNode.y,
          direction: 'top'
        }
        toPoint = {
          x: toNode.x + toNode.width / 2,
          y: toNode.y + toNode.height,
          direction: 'bottom'
        }
      }
    }
    
    return { fromPoint, toPoint }
  }

  // Create smart curved path (draw.io style)
  const createSmartConnectionPath = (
    fromPoint: { x: number, y: number, direction: string }, 
    toPoint: { x: number, y: number, direction: string },
    fromNode: CanvasNode,
    toNode: CanvasNode
  ) => {
    const distance = Math.sqrt(
      Math.pow(toPoint.x - fromPoint.x, 2) + 
      Math.pow(toPoint.y - fromPoint.y, 2)
    )
    
    // Control point distance (adaptive based on distance and direction)
    const controlDistance = Math.min(distance * 0.4, 100)
    
    // Calculate control points based on connection directions
    const controlPoint1 = getControlPoint(fromPoint, controlDistance)
    const controlPoint2 = getControlPoint(toPoint, controlDistance, true)
    
    // Create cubic bezier curve
    return `M ${fromPoint.x} ${fromPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toPoint.x} ${toPoint.y}`
  }

  // Get control point for smooth curves
  const getControlPoint = (
    point: { x: number, y: number, direction: string }, 
    distance: number, 
    reverse = false
  ) => {
    const multiplier = reverse ? -1 : 1
    
    switch (point.direction) {
      case 'right':
        return { x: point.x + distance * multiplier, y: point.y }
      case 'left':
        return { x: point.x - distance * multiplier, y: point.y }
      case 'bottom':
        return { x: point.x, y: point.y + distance * multiplier }
      case 'top':
        return { x: point.x, y: point.y - distance * multiplier }
      default:
        return { x: point.x + distance * multiplier, y: point.y }
    }
  }

  // Save canvas data
  const handleSave = () => {
    onSave({ nodes, connections })
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
      {/* Elements Panel */}
      {showElementsPanel && (
        <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col">
          <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Add Elements
            </h3>
            <p className="text-sm text-gray-600 mt-1">Browse and add world-building elements to the canvas</p>
          </div>
          
          {/* Horizontal Expandable Categories */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-3">
              {/* First show configured categories */}
              {Object.entries(WORLD_ELEMENT_TYPES).map(([category, config]) => {
                const elementsInCategory = worldElements.filter((element: any) => element.category === category)
                if (elementsInCategory.length === 0) return null

                const Icon = config.icon
                const isExpanded = expandedCategories.includes(category)
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between p-3 transition-colors hover:bg-gray-50 ${
                        isExpanded ? `bg-${config.color}-50 border-${config.color}-200` : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 text-${config.color}-500`} />
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <p className="text-xs text-gray-500">{elementsInCategory.length} items</p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </button>
                    
                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-3 space-y-2">
                          {elementsInCategory.map((element: any) => {
                            const isOnCanvas = nodes.some(node => node.id === element.id)
                            return (
                              <div
                                key={element.id}
                                onClick={() => !isOnCanvas && addElementToCanvas(element)}
                                className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                                  isOnCanvas 
                                    ? "bg-green-100 border border-green-200 cursor-default opacity-75" 
                                    : `bg-white hover:bg-${config.color}-50 hover:border-${config.color}-200 border border-gray-200 cursor-pointer hover:shadow-sm`
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                  isOnCanvas
                                    ? "bg-green-200 text-green-700"
                                    : `bg-${config.color}-100 text-${config.color}-700`
                                }`}>
                                  {category === 'characters' ? (
                                    element.name.charAt(0).toUpperCase()
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">
                                    {element.name}
                                  </span>
                                  {element.description && (
                                    <span className="text-xs text-gray-500 truncate block">
                                      {element.description}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isOnCanvas ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Plus className={`w-4 h-4 text-gray-400 group-hover:text-${config.color}-500`} />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Show unconfigured categories with fallback styling */}
              {(() => {
                const configuredCategories = Object.keys(WORLD_ELEMENT_TYPES)
                const unconfiguredCategories = [...new Set(worldElements.map(el => el.category))]
                  .filter(category => !configuredCategories.includes(category))
                
                return unconfiguredCategories.map(category => {
                  const elementsInCategory = worldElements.filter((element: any) => element.category === category)
                  if (elementsInCategory.length === 0) return null
                  
                  const isExpanded = expandedCategories.includes(category)
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`w-full flex items-center justify-between p-3 transition-colors hover:bg-gray-50 ${
                          isExpanded ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-blue-500" />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                            <p className="text-xs text-gray-500">{elementsInCategory.length} items</p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-3 space-y-2">
                            {elementsInCategory.map((element: any) => {
                              const isOnCanvas = nodes.some(node => node.id === element.id)
                              return (
                                <div
                                  key={element.id}
                                  onClick={() => !isOnCanvas && addElementToCanvas(element)}
                                  className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                                    isOnCanvas 
                                      ? "bg-green-100 border border-green-200 cursor-default opacity-75" 
                                      : "bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 cursor-pointer hover:shadow-sm"
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                                    isOnCanvas
                                      ? "bg-green-200 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}>
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate block">
                                      {element.name}
                                    </span>
                                    {element.description && (
                                      <span className="text-xs text-gray-500 truncate block">
                                        {element.description}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {isOnCanvas ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Network className="w-6 h-6 mr-2 text-indigo-600" />
              {relationshipName}
            </h2>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <Palette className="w-4 h-4 mr-1" />
              Visual Relationship Editor
              {moveToolActive && <span className="text-blue-600 ml-2">🔧 Move tool active</span>}
              {isPanning && <span className="text-green-600 ml-2">🖐️ Panning...</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={moveToolActive ? "default" : "outline"}
              size="sm"
              onClick={() => setMoveToolActive(!moveToolActive)}
              className={moveToolActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300"}
              title="Move Tool - Click and drag to pan the canvas"
            >
              <Move className="w-4 h-4 mr-2" />
              Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowElementsPanel(!showElementsPanel)}
              className="border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Layers className="w-4 h-4 mr-2" />
              {showElementsPanel ? 'Hide Panel' : 'Show Panel'}
            </Button>
            
            <div className="flex items-center gap-0 border border-gray-200 rounded-xl bg-white shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={zoomOut} 
                className="px-3 rounded-l-xl hover:bg-gray-50"
                disabled={scale <= 0.3}
                title="Zoom Out (Mouse wheel up)"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div 
                className="px-4 py-1.5 text-xs font-medium text-gray-700 border-x border-gray-200 bg-gray-50 cursor-help"
                title="Mouse wheel to zoom • Hold Ctrl for precise zoom • Shift+drag, Right-click+drag, or Move tool to pan"
              >
                {Math.round(scale * 100)}%
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={zoomIn} 
                className="px-3 rounded-r-xl hover:bg-gray-50"
                disabled={scale >= 3}
                title="Zoom In (Mouse wheel down)"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetZoom}
              className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fitToScreen}
              className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              title="Fit to Screen"
            >
              <Grid className="w-4 h-4" />
            </Button>

            {/* Animation Controls */}
            <div className="flex items-center gap-0 border border-gray-200 rounded-xl bg-white shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnimations(!showAnimations)}
                className={`px-3 rounded-l-xl transition-colors ${
                  showAnimations 
                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                title="Toggle Animations"
              >
                <Activity className="w-4 h-4" />
              </Button>
              
              <div className="px-2 py-1.5 text-xs font-medium text-gray-700 border-x border-gray-200 bg-gray-50 min-w-[60px] text-center">
                {animationSpeed}s
              </div>
              
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnimationSpeed(prev => Math.max(0.5, prev - 0.5))}
                  className="px-2 hover:bg-gray-50"
                  disabled={animationSpeed <= 0.5}
                  title="Slower"
                >
                  <span className="text-xs">-</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnimationSpeed(prev => Math.min(10, prev + 0.5))}
                  className="px-2 rounded-r-xl hover:bg-gray-50"
                  disabled={animationSpeed >= 10}
                  title="Faster"
                >
                  <span className="text-xs">+</span>
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Canvas
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
          <div
            ref={canvasRef}
            className={cn(
              "w-full h-full relative select-none",
              isPanning ? "cursor-grabbing" : moveToolActive ? "cursor-move" : "cursor-default"
            )}
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              // Clear selection if clicking on canvas background (not on nodes or buttons)
              const target = e.target as HTMLElement
              const isNode = target.closest('[data-node-id]')
              const isButton = target.closest('button')
              
              if (!isNode && !isButton) {
                setSelectedNode(null)
              }
            }}
          >
            {/* Enhanced Grid Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="enhanced-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="1" fill="#cbd5e1" opacity="0.5"/>
                  </pattern>
                  <radialGradient id="grid-fade" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0.3"/>
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#enhanced-grid)" />
                <rect width="100%" height="100%" fill="url(#grid-fade)" />
              </svg>
            </div>

            {/* Draw.io Style Enhanced Connections */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                shapeRendering: 'geometricPrecision',
                textRendering: 'geometricPrecision'
              }}
            >
              <defs>
                {/* Enhanced connection styling */}
                <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology operator="dilate" radius="1"/>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
                
                {/* Professional gradient */}
                <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
                  <stop offset="50%" stopColor="currentColor" stopOpacity="1"/>
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
                </linearGradient>
                
                {/* Connection point dots */}
                <marker id="connection-dot" markerWidth="6" markerHeight="6" 
                  refX="3" refY="3" orient="auto">
                  <circle cx="3" cy="3" r="2" fill="currentColor" stroke="white" strokeWidth="1" />
                </marker>
              </defs>
              
              {connections.map(connection => {
                // Use our smart path calculation
                const pathData = getConnectionPath(connection)
                if (!pathData) return null
                
                const fromNode = nodes.find(n => n.id === connection.fromNodeId)
                const toNode = nodes.find(n => n.id === connection.toNodeId)
                if (!fromNode || !toNode) return null
                
                // Get connection points for label positioning
                const { fromPoint, toPoint } = getOptimalConnectionPoints(fromNode, toNode)
                const midX = (fromPoint.x + toPoint.x) / 2
                const midY = (fromPoint.y + toPoint.y) / 2
                
                // Get stroke width for rendering
                const strokeWidth = connection.strokeWidth || 3
                
                const isSelected = selectedConnection === connection.id
                
                return (
                  <g key={connection.id} className={isSelected ? 'connection-selected' : ''}>
                    {/* Connection shadow/outline for better visibility */}
                    <path
                      d={pathData}
                      stroke="rgba(255, 255, 255, 0.8)"
                      strokeWidth={strokeWidth + 4}
                      fill="none"
                      className="opacity-90"
                      strokeDasharray={connection.strokeDasharray || undefined}
                      style={{ vectorEffect: 'non-scaling-stroke' }}
                    />
                    
                    {/* Main Connection Line */}
                    <path
                      d={pathData}
                      stroke={connection.color || '#3b82f6'}
                      strokeWidth={strokeWidth}
                      fill="none"
                      filter="url(#connection-glow)"
                      className={`pointer-events-auto cursor-pointer ${
                        isSelected 
                          ? 'opacity-100 drop-shadow-lg' 
                          : 'opacity-80 hover:opacity-100 hover:drop-shadow-md'
                      }`}
                      onClick={() => setSelectedConnection && setSelectedConnection(connection.id)}
                      style={{ 
                        color: connection.color || '#3b82f6',
                        vectorEffect: 'non-scaling-stroke'
                      }}
                      strokeDasharray={connection.strokeDasharray || undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Animated Arrow Traveling Along Path */}
                    {showAnimations && (
                      <>
                        {/* Main traveling dot */}
                        <circle
                          r="4"
                          fill={connection.color || '#3b82f6'}
                          stroke="white"
                          strokeWidth="2"
                          className="opacity-90"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                        >
                          <animateMotion
                            dur={`${animationSpeed}s`}
                            repeatCount="indefinite"
                            path={pathData}
                            rotate="auto"
                            calcMode="linear"
                            keyTimes="0;1"
                            keySplines="0.4 0 0.6 1"
                          >
                            <mpath href={`#connection-path-${connection.id}`} />
                          </animateMotion>
                          
                          {/* Pulsing effect for extra visual appeal */}
                          <animate
                            attributeName="r"
                            values="3;5;3"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.7;1;0.7"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* Trail effect - multiple smaller dots following */}
                        {[0.2, 0.4, 0.6].map((delay, index) => (
                          <circle
                            key={`trail-${index}`}
                            r={3 - index * 0.5}
                            fill={connection.color || '#3b82f6'}
                            className={`opacity-${60 - index * 15}`}
                            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                          >
                            <animateMotion
                              dur={`${animationSpeed}s`}
                              repeatCount="indefinite"
                              path={pathData}
                              calcMode="linear"
                              begin={`${delay * animationSpeed}s`}
                            >
                              <mpath href={`#connection-path-${connection.id}`} />
                            </animateMotion>
                          </circle>
                        ))}
                        
                        {/* Special effects for different relationship types */}
                        {connection.type === 'romance' && (
                          <text
                            fontSize="12"
                            fill={connection.color || '#3b82f6'}
                            textAnchor="middle"
                            className="opacity-80"
                          >
                            💖
                            <animateMotion
                              dur={`${animationSpeed * 1.5}s`}
                              repeatCount="indefinite"
                              path={pathData}
                              calcMode="linear"
                              begin="0.3s"
                            >
                              <mpath href={`#connection-path-${connection.id}`} />
                            </animateMotion>
                          </text>
                        )}
                        
                        {connection.type === 'rivalry' && (
                          <text
                            fontSize="12"
                            fill={connection.color || '#3b82f6'}
                            textAnchor="middle"
                            className="opacity-80"
                          >
                            ⚡
                            <animateMotion
                              dur={`${animationSpeed * 0.8}s`}
                              repeatCount="indefinite"
                              path={pathData}
                              calcMode="linear"
                              begin="0.5s"
                            >
                              <mpath href={`#connection-path-${connection.id}`} />
                            </animateMotion>
                          </text>
                        )}
                        
                        {connection.type === 'friendship' && (
                          <text
                            fontSize="10"
                            fill={connection.color || '#3b82f6'}
                            textAnchor="middle"
                            className="opacity-70"
                          >
                            ✨
                            <animateMotion
                              dur={`${animationSpeed * 1.2}s`}
                              repeatCount="indefinite"
                              path={pathData}
                              calcMode="linear"
                              begin="0.7s"
                            >
                              <mpath href={`#connection-path-${connection.id}`} />
                            </animateMotion>
                          </text>
                        )}
                      </>
                    )}

                    {/* Hidden path for animation reference */}
                    <path
                      id={`connection-path-${connection.id}`}
                      d={pathData}
                      stroke="none"
                      fill="none"
                      className="pointer-events-none"
                    />

                    {/* Connection points (draw.io style) */}
                    <circle
                      cx={fromPoint.x}
                      cy={fromPoint.y}
                      r="3"
                      fill={connection.color || '#3b82f6'}
                      stroke="white"
                      strokeWidth="2"
                      className={`transition-all duration-200 ${
                        isSelected ? 'opacity-100 scale-125' : 'opacity-60'
                      }`}
                    />
                    <circle
                      cx={toPoint.x}
                      cy={toPoint.y}
                      r="3"
                      fill={connection.color || '#3b82f6'}
                      stroke="white"
                      strokeWidth="2"
                      className={`transition-all duration-200 ${
                        isSelected ? 'opacity-100 scale-125' : 'opacity-60'
                      }`}
                    />
                    
                    {/* Enhanced Connection Label */}
                    {connection.label && (
                      <g className="connection-label">
                        {/* Label background with better styling */}
                        <rect
                          x={midX - (connection.label.length * 4.5)}
                          y={midY - 14}
                          width={connection.label.length * 9}
                          height={28}
                          rx="14"
                          fill="white"
                          stroke={connection.color || '#3b82f6'}
                          strokeWidth="2"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                          className={`transition-all duration-200 ${
                            isSelected ? 'opacity-100 scale-105' : 'opacity-95'
                          }`}
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          textAnchor="middle"
                          className="text-xs font-semibold select-none pointer-events-none"
                          style={{ 
                            fontSize: '12px',
                            fill: connection.textColor || connection.color || '#374151'
                          }}
                        >
                          {connection.label}
                        </text>
                      </g>
                    )}
                    
                    {/* Selection highlight */}
                    {isSelected && (
                      <path
                        d={pathData}
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth={strokeWidth + 8}
                        fill="none"
                        className="animate-pulse pointer-events-none"
                        strokeDasharray={connection.strokeDasharray || undefined}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                      />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Enhanced Character Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                data-node-id={node.id}
                className={cn(
                  "absolute bg-gradient-to-br from-white via-white to-gray-50 rounded-2xl shadow-lg border-2 cursor-move select-none group transition-all duration-200",
                  selectedNode === node.id 
                    ? "border-blue-400 shadow-blue-200/50 shadow-xl scale-105" 
                    : "border-gray-200/80 hover:border-blue-300 hover:shadow-xl hover:scale-102",
                  "backdrop-blur-sm"
                )}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height
                }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={() => {
                  if (isConnecting) {
                    completeConnection(node.id)
                  } else {
                    setSelectedNode(node.id)
                  }
                }}
              >
                {/* Card Background with Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                <div className="relative p-4 h-full flex items-center justify-center">
                  <div className="text-center">
                    {/* Enhanced Avatar */}
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700 shadow-md group-hover:shadow-lg transition-shadow">
                        {node.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Avatar Ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-white shadow-sm group-hover:border-blue-200 transition-colors" />
                      {/* Pulse Effect for Selected */}
                      {selectedNode === node.id && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Enhanced Name */}
                    <div className="mb-1">
                      <span className="text-sm font-semibold text-gray-900 block leading-tight">
                        {node.name}
                      </span>
                    </div>
                    
                    {/* Enhanced Type Badge */}
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-xs font-medium text-blue-700 border border-blue-200/50">
                      <UserCircle className="w-3 h-3 mr-1" />
                      {node.type}
                    </div>
                  </div>
                </div>

                {/* Enhanced Node Actions */}
                {selectedNode === node.id && (
                  <div className="absolute -top-4 -right-4 flex gap-1 z-50">
                    <Button
                      size="sm"
                      className="w-10 h-10 p-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        startConnection(node.id)
                      }}
                      title="Create Connection"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="w-10 h-10 p-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        
                        // Remove the node from the nodes array
                        setNodes(prev => {
                          const filtered = prev.filter(n => n.id !== node.id)
                          return filtered
                        })
                        
                        // Remove all connections involving this node
                        setConnections(prev => {
                          const filtered = prev.filter(c => c.fromNodeId !== node.id && c.toNodeId !== node.id)
                          return filtered
                        })
                        
                        // Clear selection
                        // setSelectedNode(null) // Commented out to preserve node selection
                      }}
                      title="Delete Node"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Draw.io Style Connection Ports */}
                {(selectedNode === node.id || isConnecting) && (
                  <>
                    {/* Top Connection Port */}
                    <div
                      className={cn(
                        "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-crosshair z-40 transition-all duration-200",
                        "left-1/2 -translate-x-1/2 -top-1.5",
                        isConnecting ? "scale-125 animate-pulse" : "hover:scale-110"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (isConnecting && connectionStart !== node.id) {
                          completeConnection(node.id)
                        } else if (!isConnecting) {
                          startConnection(node.id)
                        }
                      }}
                      title="Connect from top"
                    />
                    
                    {/* Right Connection Port */}
                    <div
                      className={cn(
                        "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-crosshair z-40 transition-all duration-200",
                        "top-1/2 -translate-y-1/2 -right-1.5",
                        isConnecting ? "scale-125 animate-pulse" : "hover:scale-110"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (isConnecting && connectionStart !== node.id) {
                          completeConnection(node.id)
                        } else if (!isConnecting) {
                          startConnection(node.id)
                        }
                      }}
                      title="Connect from right"
                    />
                    
                    {/* Bottom Connection Port */}
                    <div
                      className={cn(
                        "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-crosshair z-40 transition-all duration-200",
                        "left-1/2 -translate-x-1/2 -bottom-1.5",
                        isConnecting ? "scale-125 animate-pulse" : "hover:scale-110"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (isConnecting && connectionStart !== node.id) {
                          completeConnection(node.id)
                        } else if (!isConnecting) {
                          startConnection(node.id)
                        }
                      }}
                      title="Connect from bottom"
                    />
                    
                    {/* Left Connection Port */}
                    <div
                      className={cn(
                        "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-crosshair z-40 transition-all duration-200",
                        "top-1/2 -translate-y-1/2 -left-1.5",
                        isConnecting ? "scale-125 animate-pulse" : "hover:scale-110"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (isConnecting && connectionStart !== node.id) {
                          completeConnection(node.id)
                        } else if (!isConnecting) {
                          startConnection(node.id)
                        }
                      }}
                      title="Connect from left"
                    />
                  </>
                )}

                {/* Connection Indicator */}
                {isConnecting && connectionStart && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 animate-pulse" />
                )}
              </div>
            ))}

            {/* Enhanced Connection Guide */}
            {isConnecting && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-6 py-3 rounded-2xl shadow-lg text-sm font-medium border border-blue-200/50 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3" />
                  Click on another character to create a connection
                </div>
              </div>
            )}

            {/* Zoom and Pan Hint for Empty Canvas */}
            {!isConnecting && nodes.length === 0 && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ZoomIn className="w-4 h-4 text-gray-500" />
                  <span>Mouse wheel to zoom • Shift+drag, Right-click+drag, or Move tool to pan • Add characters to start</span>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Enhanced Connection Properties Panel */}
        {selectedConnection && (
          <div className="absolute bottom-6 right-6 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/60 p-5 animate-in slide-in-from-bottom-2 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-gray-900 flex items-center text-lg">
                <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                Connection Editor
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedConnection(null)}
                className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-5">
              {/* Relationship Type - Single unified field */}
              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center">
                  <Network className="w-4 h-4 mr-2 text-gray-600" />
                  Relationship Type
                </Label>
                <Select
                  value={connections.find(c => c.id === selectedConnection)?.type || 'friendship'}
                  onValueChange={(value) => {
                    setConnections(prev => prev.map(conn => 
                      conn.id === selectedConnection 
                        ? { ...conn, type: value, label: value === 'custom' ? conn.label || '' : value }
                        : conn
                    ))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 shadow-lg rounded-lg backdrop-blur-sm z-50">
                    <SelectItem value="friendship" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">🤝 Friendship</SelectItem>
                    <SelectItem value="romance" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">💕 Romance</SelectItem>
                    <SelectItem value="family" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">👨‍👩‍👧‍👦 Family</SelectItem>
                    <SelectItem value="rivalry" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">⚔️ Rivalry</SelectItem>
                    <SelectItem value="mentor" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">🧑‍🏫 Mentor</SelectItem>
                    <SelectItem value="alliance" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">🤝 Alliance</SelectItem>
                    <SelectItem value="enemy" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">😡 Enemy</SelectItem>
                    <SelectItem value="professional" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">💼 Professional</SelectItem>
                    <SelectItem value="neutral" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">😐 Neutral</SelectItem>
                    <SelectItem value="custom" className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom relationship input */}
                {connections.find(c => c.id === selectedConnection)?.type === 'custom' && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-gray-700 mb-2 block">Custom Relationship</Label>
                    <Input
                      value={connections.find(c => c.id === selectedConnection)?.label || ''}
                      onChange={(e) => {
                        setConnections(prev => prev.map(conn => 
                          conn.id === selectedConnection 
                            ? { ...conn, label: e.target.value }
                            : conn
                        ))
                      }}
                      className="text-sm bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter custom relationship (e.g. 'Business Partner', 'Childhood Friend')"
                    />
                  </div>
                )}
              </div>

              {/* Connection Colors */}
              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center">
                  <Palette className="w-4 h-4 mr-2 text-gray-600" />
                  Colors & Style
                </Label>
                <div className="space-y-4">
                  {/* Line Color */}
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-2 block">Line Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={connections.find(c => c.id === selectedConnection)?.color || '#3b82f6'}
                        onChange={(e) => {
                          setConnections(prev => prev.map(conn => 
                            conn.id === selectedConnection 
                              ? { ...conn, color: e.target.value }
                              : conn
                          ))
                        }}
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[
                          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
                          '#64748b', '#dc2626', '#ea580c', '#65a30d', '#0891b2', '#7c3aed'
                        ].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setConnections(prev => prev.map(conn => 
                                conn.id === selectedConnection 
                                  ? { ...conn, color }
                                  : conn
                              ))
                            }}
                            className="w-7 h-7 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Text Color */}
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-2 block">Text Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={connections.find(c => c.id === selectedConnection)?.textColor || '#374151'}
                        onChange={(e) => {
                          setConnections(prev => prev.map(conn => 
                            conn.id === selectedConnection 
                              ? { ...conn, textColor: e.target.value }
                              : conn
                          ))
                        }}
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[
                          '#374151', '#111827', '#ffffff', '#ef4444', '#f59e0b', '#10b981',
                          '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#dc2626', '#7c3aed'
                        ].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setConnections(prev => prev.map(conn => 
                                conn.id === selectedConnection 
                                  ? { ...conn, textColor: color }
                                  : conn
                              ))
                            }}
                            className="w-7 h-7 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Line Thickness */}
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-2 block">Line Thickness</Label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={connections.find(c => c.id === selectedConnection)?.strokeWidth || 3}
                      onChange={(e) => {
                        setConnections(prev => prev.map(conn => 
                          conn.id === selectedConnection 
                            ? { ...conn, strokeWidth: parseInt(e.target.value) }
                            : conn
                        ))
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Thin</span>
                      <span>Thick</span>
                    </div>
                  </div>

                  {/* Line Style */}
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-2 block">Line Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'solid', label: 'Solid', pattern: null },
                        { value: 'dashed', label: 'Dashed', pattern: '8,4' },
                        { value: 'dotted', label: 'Dotted', pattern: '2,2' },
                        { value: 'dashdot', label: 'Dash-Dot', pattern: '8,2,2,2' }
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => {
                            setConnections(prev => prev.map(conn => 
                              conn.id === selectedConnection 
                                ? { ...conn, strokeDasharray: style.pattern }
                                : conn
                            ))
                          }}
                          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                            connections.find(c => c.id === selectedConnection)?.strokeDasharray === style.pattern
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnections(prev => prev.filter(c => c.id !== selectedConnection))
                    setSelectedConnection(null)
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-sm px-4 py-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedConnection(null)}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default RelationshipsPanel
