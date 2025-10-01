import { z } from 'zod'

// Slider validation (0-10 scale)
const sliderSchema = z.number().min(0).max(10).optional()

// Culture schema matching world_elements structure
export const cultureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  
  // Core attributes
  icon: z.string().optional(),
  summary: z.string().optional(),
  
  // Basics
  government: z.string().optional(),
  political_parties: z.array(z.string()).optional(),
  distribution_of_authority: z.string().optional(),
  representation: sliderSchema,
  primary_language: z.string().optional(),
  
  // Origins & Homeland
  origins_homeland: z.string().optional(),
  
  // History
  history: z.string().optional(),
  
  // Society
  openness: sliderSchema,
  communication: sliderSchema,
  values: z.array(z.string()).optional(),
  social_expectations: z.string().optional(),
  
  // Arts & Food
  famous_works: z.array(z.string()).optional(),
  literature_style: z.string().optional(),
  poetry_style: z.string().optional(),
  music_style: z.string().optional(),
  access_to_art: z.string().optional(),
  dishes: z.array(z.string()).optional(),
  
  // Traditions
  secular_traditions: z.string().optional(),
  sacred_traditions: z.string().optional(),
  
  // Custom attributes (dynamic fields)
  attributes: z.record(z.string(), z.any()).optional(),
  
  // Tags
  tags: z.array(z.string()).optional()
})

export type CultureFormData = z.infer<typeof cultureSchema>

// Media item type for rich content (works, dishes, etc.)
export interface MediaItem {
  name: string
  imageUrls?: string[]  // Multiple images per item
  link?: string
}

// Culture type aligned with world_elements
export interface Culture {
  id: string
  project_id: string
  category: 'cultures'
  name: string
  description?: string
  tags: string[]
  attributes: {
    icon?: string
    iconImage?: string
    summary?: string
    government?: string
    political_parties?: string[]
    distribution_of_authority?: string
    representation?: number
    primary_language?: string
    origins_homeland?: string
    history?: string
    openness?: number
    communication?: number
    values?: string[]
    social_expectations?: string
    famous_works?: MediaItem[] | string[]  // Support both formats for migration
    literature_style?: string
    poetry_style?: string
    music_style?: string
    access_to_art?: string
    dishes?: MediaItem[] | string[]  // Support both formats for migration
    secular_traditions?: string
    sacred_traditions?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}
