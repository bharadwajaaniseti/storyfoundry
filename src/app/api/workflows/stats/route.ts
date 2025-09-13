import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner_id === user.id
    let hasAccess = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get workflow statistics using the database function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_workflow_stats', { p_project_id: project_id })

    if (statsError) {
      console.error('Error fetching workflow stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // Get additional statistics
    const { data: submissionsByType, error: typeError } = await supabase
      .from('workflow_submissions')
      .select('submission_type, status')
      .eq('project_id', project_id)

    if (typeError) {
      console.error('Error fetching submission types:', typeError)
      return NextResponse.json({ error: 'Failed to fetch submission types' }, { status: 500 })
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentSubmissions, error: recentError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        title,
        submission_type,
        status,
        created_at,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', project_id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent submissions:', recentError)
      return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 })
    }

    // Calculate submission type breakdown
    const typeBreakdown = submissionsByType?.reduce((acc, submission) => {
      const type = submission.submission_type
      if (!acc[type]) {
        acc[type] = { total: 0, approved: 0, pending: 0, rejected: 0 }
      }
      acc[type].total++
      if (submission.status === 'approved') acc[type].approved++
      else if (submission.status === 'pending_approval') acc[type].pending++
      else if (['rejected', 'needs_changes'].includes(submission.status)) acc[type].rejected++
      return acc
    }, {} as Record<string, any>) || {}

    // Get top contributors
    const { data: contributors, error: contributorsError } = await supabase
      .from('workflow_submissions')
      .select(`
        submitter_id,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', project_id)

    if (contributorsError) {
      console.error('Error fetching contributors:', contributorsError)
    }

    const contributorStats = contributors?.reduce((acc, submission) => {
      const userId = submission.submitter_id
      if (!acc[userId]) {
        acc[userId] = {
          user: submission.submitter,
          count: 0
        }
      }
      acc[userId].count++
      return acc
    }, {} as Record<string, any>) || {}

    const topContributors = Object.values(contributorStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      stats,
      typeBreakdown,
      recentSubmissions,
      topContributors,
      summary: {
        totalSubmissions: submissionsByType?.length || 0,
        activeContributors: Object.keys(contributorStats).length,
        weeklyActivity: recentSubmissions?.length || 0
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}