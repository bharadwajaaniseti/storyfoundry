import { useState, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/auth'
import { Culture } from '@/lib/validation/cultureSchema'

interface UseCulturesOptions {
  projectId: string
}

export function useCultures({ projectId }: UseCulturesOptions) {
  const [cultures, setCultures] = useState<Culture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createSupabaseClient()

  const loadCultures = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'cultures')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const transformedCultures: Culture[] = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        category: 'cultures',
        name: item.name,
        description: item.description || '',
        tags: item.tags || [],
        attributes: item.attributes || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      }))

      setCultures(transformedCultures)
      return transformedCultures
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Error loading cultures:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase])

  const createCulture = useCallback(async (data: Partial<Culture>) => {
    setLoading(true)
    setError(null)

    try {
      const cultureData = {
        project_id: projectId,
        category: 'cultures',
        name: data.name || '',
        description: data.description || '',
        attributes: data.attributes || {},
        tags: data.tags || []
      }

      const { data: created, error: createError } = await supabase
        .from('world_elements')
        .insert(cultureData)
        .select()
        .single()

      if (createError) throw createError

      const newCulture: Culture = {
        ...created,
        category: 'cultures',
        description: created.description || '',
        tags: created.tags || [],
        attributes: created.attributes || {}
      }

      setCultures(prev => [newCulture, ...prev])
      return newCulture
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Error creating culture:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase])

  const updateCulture = useCallback(async (id: string, data: Partial<Culture>) => {
    setLoading(true)
    setError(null)

    try {
      const updateData = {
        name: data.name,
        description: data.description || '',
        attributes: data.attributes || {},
        tags: data.tags || [],
        updated_at: new Date().toISOString()
      }

      const { data: updated, error: updateError } = await supabase
        .from('world_elements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const updatedCulture: Culture = {
        ...updated,
        category: 'cultures',
        description: updated.description || '',
        tags: updated.tags || [],
        attributes: updated.attributes || {}
      }

      setCultures(prev => prev.map(c => c.id === id ? updatedCulture : c))
      return updatedCulture
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Error updating culture:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const deleteCulture = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setCultures(prev => prev.filter(c => c.id !== id))
      return true
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Error deleting culture:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    cultures,
    loading,
    error,
    loadCultures,
    createCulture,
    updateCulture,
    deleteCulture
  }
}
