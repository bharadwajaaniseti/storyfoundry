import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/auth-server';

// POST /api/projects/[id]/approve-batch - Approve a batch of changes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const projectId = params.id;
    const { batchId, action, rejectionReason } = await request.json();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only project owners can approve changes' }, { status: 403 });
    }

    if (action === 'approve') {
      // Call the approval function
      const { data, error } = await supabase.rpc('approve_change_batch', {
        batch_id_param: batchId
      });

      if (error) {
        console.error('Error approving batch:', error);
        return NextResponse.json({ error: 'Failed to approve batch' }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: data });

    } else if (action === 'reject') {
      // Call the rejection function
      const { data, error } = await supabase.rpc('reject_change_batch', {
        batch_id_param: batchId,
        reason: rejectionReason || null
      });

      if (error) {
        console.error('Error rejecting batch:', error);
        return NextResponse.json({ error: 'Failed to reject batch' }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: data });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in approve-batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}