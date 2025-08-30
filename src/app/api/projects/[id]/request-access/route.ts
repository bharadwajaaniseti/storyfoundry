import { createSupabaseServer, requirePaidSubscription } from '@/lib/auth-server'
import { handleApiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const accessRequestSchema = z.object({
  message: z.string().max(500, 'Message too long').optional(),
  nda_required: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require paid subscription to request access
    const user = await requirePaidSubscription()

    const body = await request.json()
    const { message, nda_required } = accessRequestSchema.parse(body)

    // Await params
    const resolvedParams = await params
    const projectId = resolvedParams.id

    const supabase = await createSupabaseServer()

    // Verify project exists and is not private
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, owner_id, visibility')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Can't request access to your own project
    if (project.owner_id === user.id) {
      return Response.json(
        { error: 'Cannot request access to your own project' },
        { status: 400 }
      )
    }

    // Can't request access to private projects
    if (project.visibility === 'private') {
      return Response.json(
        { error: 'Cannot request access to private projects' },
        { status: 403 }
      )
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('pro_id', user.id)
      .single()

    if (existingRequest) {
      return Response.json(
        { error: `Access request already exists with status: ${existingRequest.status}` },
        { status: 409 }
      )
    }

    // Create access request
    const { data: accessRequest, error: requestError } = await supabase
      .from('access_requests')
      .insert({
        project_id: projectId,
        pro_id: user.id,  // Keep the column name for now, but it's actually any paid user
        message,
        nda_required,
      })
      .select(`
        id,
        status,
        message,
        nda_required,
        created_at,
        projects:project_id (
          title,
          owner_id
        )
      `)
      .single()

    if (requestError) {
      throw new Error(`Failed to create access request: ${requestError.message}`)
    }

    return Response.json({
      success: true,
      data: accessRequest
    })

  } catch (error) {
    return handleApiError(error)
  }
}
