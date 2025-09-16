import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/auth-server';

// GET /api/projects/[id]/pending-changes - Get all pending changes for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const projectId = params.id;

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is project owner or collaborator
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isOwner = project.owner_id === user.id;

    // Check if user is collaborator
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isCollaborator = !!collaborator;

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get pending change batches with their changes
    const { data: batches, error: batchesError } = await supabase
      .from('change_batches')
      .select(`
        *,
        editor:profiles!change_batches_editor_id_fkey(
          id, username, full_name, avatar_url
        ),
        approved_by_user:profiles!change_batches_approved_by_fkey(
          id, username, full_name, avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (batchesError) {
      console.error('Error fetching batches:', batchesError);
      return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }

    // Get detailed changes for each batch
    const batchesWithChanges = await Promise.all(
      (batches || []).map(async (batch) => {
        const { data: changes, error: changesError } = await supabase
          .from('pending_changes')
          .select('*')
          .eq('batch_id', batch.id)
          .order('created_at', { ascending: true });

        if (changesError) {
          console.error('Error fetching changes for batch:', batch.id, changesError);
          return { ...batch, changes: [] };
        }

        return { ...batch, changes: changes || [] };
      })
    );

    return NextResponse.json({ 
      batches: batchesWithChanges,
      isOwner,
      isCollaborator 
    });

  } catch (error) {
    console.error('Error in pending-changes GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/pending-changes - Submit a batch for approval
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const projectId = params.id;
    const { batchId, title, description } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is collaborator
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!collaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update batch to submitted status
    const { data: batch, error: updateError } = await supabase
      .from('change_batches')
      .update({
        title,
        description,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('editor_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error submitting batch:', updateError);
      return NextResponse.json({ error: 'Failed to submit batch' }, { status: 500 });
    }

    return NextResponse.json({ success: true, batch });

  } catch (error) {
    console.error('Error in pending-changes POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}