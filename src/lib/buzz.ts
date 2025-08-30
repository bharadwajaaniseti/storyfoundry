import { createSupabaseServer, createSupabaseAdmin } from './auth-server'

export interface BuzzWeights {
  view: number
  like: number
  save: number
  comment: number
}

export const DEFAULT_BUZZ_WEIGHTS: BuzzWeights = {
  view: 1,
  like: 3,
  save: 5,
  comment: 4
}

export const BUZZ_DECAY_RATE = 0.85 // 15% decay per week
export const DAYS_PER_DECAY_PERIOD = 7

// Calculate buzz score for a single project
export async function calculateProjectBuzz(
  projectId: string,
  weights: BuzzWeights = DEFAULT_BUZZ_WEIGHTS
): Promise<number> {
  const supabase = await createSupabaseServer()

  // Get engagement events for the project
  const { data: events, error } = await supabase
    .from('engagement_events')
    .select('kind, weight, created_at')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching engagement events:', error)
    return 0
  }

  if (!events || events.length === 0) {
    return 0
  }

  const now = new Date()
  let totalScore = 0

  for (const event of events) {
    // Get base weight for event type
    const baseWeight = weights[event.kind as keyof BuzzWeights] || 1
    
    // Apply custom weight if specified
    const eventWeight = event.weight || 1
    
    // Calculate time decay
    const eventDate = new Date(event.created_at)
    const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
    const decayPeriods = Math.floor(daysSinceEvent / DAYS_PER_DECAY_PERIOD)
    const timeDecay = Math.pow(BUZZ_DECAY_RATE, decayPeriods)
    
    // Calculate final score for this event
    const eventScore = baseWeight * eventWeight * timeDecay
    totalScore += eventScore
  }

  return Math.round(totalScore * 100) / 100 // Round to 2 decimal places
}

// Record an engagement event
export async function recordEngagement(
  projectId: string,
  actorId: string,
  kind: 'view' | 'like' | 'save' | 'comment',
  customWeight?: number
): Promise<void> {
  const supabase = await createSupabaseServer()

  // Check if this user already has a recent engagement of this type
  // to prevent spam (except for views which can be repeated)
  if (kind !== 'view') {
    const { data: existing } = await supabase
      .from('engagement_events')
      .select('id')
      .eq('project_id', projectId)
      .eq('actor_id', actorId)
      .eq('kind', kind)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single()

    if (existing) {
      // Already recorded this type of engagement recently
      return
    }
  }

  const { error } = await supabase
    .from('engagement_events')
    .insert({
      project_id: projectId,
      actor_id: actorId,
      kind,
      weight: customWeight || 1
    })

  if (error) {
    console.error('Error recording engagement:', error)
    throw new Error('Failed to record engagement')
  }
}

// Recompute buzz scores for all projects (admin function)
export async function recomputeAllBuzzScores(): Promise<{ updated: number; errors: number }> {
  const supabase = createSupabaseAdmin()

  try {
    // Get all project IDs
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')

    if (projectsError) {
      throw projectsError
    }

    if (!projects || projects.length === 0) {
      return { updated: 0, errors: 0 }
    }

    let updated = 0
    let errors = 0

    // Process projects in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize)
      
      const buzzUpdatePromises = batch.map(async (project) => {
        try {
          const buzzScore = await calculateProjectBuzzByAdmin(project.id)
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ 
              buzz_score: buzzScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', project.id)

          if (updateError) {
            console.error(`Error updating buzz for project ${project.id}:`, updateError)
            errors++
          } else {
            updated++
          }
        } catch (error) {
          console.error(`Error calculating buzz for project ${project.id}:`, error)
          errors++
        }
      })

      await Promise.all(buzzUpdatePromises)
    }

    return { updated, errors }
  } catch (error) {
    console.error('Error in recomputeAllBuzzScores:', error)
    throw error
  }
}

// Admin version of calculateProjectBuzz that uses admin client
async function calculateProjectBuzzByAdmin(
  projectId: string,
  weights: BuzzWeights = DEFAULT_BUZZ_WEIGHTS
): Promise<number> {
  const supabase = createSupabaseAdmin()

  const { data: events, error } = await supabase
    .from('engagement_events')
    .select('kind, weight, created_at')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching engagement events:', error)
    return 0
  }

  if (!events || events.length === 0) {
    return 0
  }

  const now = new Date()
  let totalScore = 0

  for (const event of events) {
    const baseWeight = weights[event.kind as keyof BuzzWeights] || 1
    const eventWeight = event.weight || 1
    
    const eventDate = new Date(event.created_at)
    const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
    const decayPeriods = Math.floor(daysSinceEvent / DAYS_PER_DECAY_PERIOD)
    const timeDecay = Math.pow(BUZZ_DECAY_RATE, decayPeriods)
    
    const eventScore = baseWeight * eventWeight * timeDecay
    totalScore += eventScore
  }

  return Math.round(totalScore * 100) / 100
}

// Get trending projects
export async function getTrendingProjects(limit: number = 10) {
  const supabase = await createSupabaseServer()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      logline,
      format,
      genre,
      buzz_score,
      created_at,
      profiles:owner_id (
        display_name,
        avatar_url
      )
    `)
    .eq('visibility', 'public')
    .order('buzz_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trending projects:', error)
    return []
  }

  return projects || []
}

// Get buzz statistics for a project
export async function getProjectBuzzStats(projectId: string) {
  const supabase = await createSupabaseServer()

  const { data: stats, error } = await supabase
    .from('engagement_events')
    .select('kind')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching buzz stats:', error)
    return {
      views: 0,
      likes: 0,
      saves: 0,
      comments: 0,
      total: 0
    }
  }

  const counts = stats?.reduce((acc, event) => {
    const kind = event.kind as keyof typeof acc
    if (kind in acc) {
      acc[kind] = (acc[kind] || 0) + 1
    }
    acc.total++
    return acc
  }, { views: 0, likes: 0, saves: 0, comments: 0, total: 0 }) || {
    views: 0,
    likes: 0,
    saves: 0,
    comments: 0,
    total: 0
  }

  return counts
}
