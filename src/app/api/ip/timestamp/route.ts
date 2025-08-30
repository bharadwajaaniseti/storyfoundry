import { createSupabaseServer, requireAuth } from '@/lib/auth-server'
import { handleApiError, hashString } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const timestampRequestSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().min(1, 'Content is required'),
  provider: z.string().default('local'),
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { project_id, content, provider } = timestampRequestSchema.parse(body)

    const supabase = await createSupabaseServer()

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.owner_id !== user.id) {
      return Response.json(
        { error: 'Access denied: not project owner' },
        { status: 403 }
      )
    }

    // Generate content hash
    const contentHash = await hashString(content)

    // Create IP timestamp record
    const { data: timestamp, error: timestampError } = await supabase
      .from('ip_timestamps')
      .insert({
        project_id,
        content_hash: contentHash,
        provider,
        provider_ref: null, // Could be extended for external providers
      })
      .select()
      .single()

    if (timestampError) {
      throw new Error(`Failed to create IP timestamp: ${timestampError.message}`)
    }

    return Response.json({
      success: true,
      data: {
        id: timestamp.id,
        content_hash: contentHash,
        timestamp: timestamp.created_at,
        provider: provider
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
