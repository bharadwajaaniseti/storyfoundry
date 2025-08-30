import { createSupabaseServer, requireAuth } from '@/lib/auth-server'
import { handleApiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const grantAccessSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
  scope: z.enum(['preview', 'full']).default('full'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { request_id, action, scope } = grantAccessSchema.parse(body)

    // Await params
    const resolvedParams = await params
    const projectId = resolvedParams.id

    const supabase = await createSupabaseServer()

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id, title')
      .eq('id', projectId)
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

    // Get the access request
    const { data: accessRequest, error: requestError } = await supabase
      .from('access_requests')
      .select(`
        id,
        project_id,
        pro_id,
        status,
        profiles:pro_id (
          display_name,
          company
        )
      `)
      .eq('id', request_id)
      .eq('project_id', projectId)
      .single()

    if (requestError || !accessRequest) {
      return Response.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    if (accessRequest.status !== 'pending') {
      return Response.json(
        { error: `Access request already ${accessRequest.status}` },
        { status: 400 }
      )
    }

    // Start transaction
    const { error: transactionError } = await supabase.rpc('begin')
    if (transactionError) {
      throw new Error('Failed to start transaction')
    }

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'denied',
          decided_at: new Date().toISOString(),
        })
        .eq('id', request_id)

      if (updateError) {
        throw new Error(`Failed to update request: ${updateError.message}`)
      }

      // If approved, create access grant
      if (action === 'approve') {
        const { error: grantError } = await supabase
          .from('access_grants')
          .insert({
            project_id: projectId,
            viewer_id: accessRequest.pro_id,
            scope,
          })

        if (grantError) {
          throw new Error(`Failed to create access grant: ${grantError.message}`)
        }
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit')
      if (commitError) {
        throw new Error('Failed to commit transaction')
      }

      return Response.json({
        success: true,
        data: {
          action,
          message: `Access request ${action}d successfully`,
          request_id,
          ...(action === 'approve' && { scope })
        }
      })

    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback')
      throw error
    }

  } catch (error) {
    return handleApiError(error)
  }
}
