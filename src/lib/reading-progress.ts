import { createSupabaseClient } from './auth'

/**
 * Clear reading progress for a single project
 */
export async function clearProjectProgress(projectId: string, userId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing project progress:', error)
      throw error
    }
  } catch (error) {
    console.error('Error clearing project progress:', error)
    throw error
  }
}

/**
 * Clear reading progress for multiple projects
 */
export async function clearMultipleProjectsProgress(projectIds: string[], userId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('user_id', userId)
      .in('project_id', projectIds)

    if (error) {
      console.error('Error clearing multiple projects progress:', error)
      throw error
    }
  } catch (error) {
    console.error('Error clearing multiple projects progress:', error)
    throw error
  }
}

/**
 * Clear all reading progress for a user
 */
export async function clearAllUserProgress(userId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing all user progress:', error)
      throw error
    }
  } catch (error) {
    console.error('Error clearing all user progress:', error)
    throw error
  }
}

/**
 * Clear only completed reading progress for a user
 */
export async function clearCompletedProgress(userId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('user_id', userId)
      .eq('is_completed', true)

    if (error) {
      console.error('Error clearing completed progress:', error)
      throw error
    }
  } catch (error) {
    console.error('Error clearing completed progress:', error)
    throw error
  }
}

/**
 * Reset project progress to specific percentage
 */
export async function resetProjectProgress(projectId: string, userId: string, percentage: number = 0): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        project_id: projectId,
        user_id: userId,
        progress_percentage: percentage,
        last_position: 0,
        is_completed: false,
        completed_at: null,
        reading_time_minutes: 0,
        milestones_reached: 0,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error resetting project progress:', error)
      throw error
    }
  } catch (error) {
    console.error('Error resetting project progress:', error)
    throw error
  }
}
