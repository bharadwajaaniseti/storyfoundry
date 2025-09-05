import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const supabase = createSupabaseClient()

    // Get raw project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    return NextResponse.json({
      project,
      error: projectError,
      id: projectId
    })

  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
