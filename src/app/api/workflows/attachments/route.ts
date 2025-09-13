import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const submission_id = searchParams.get('submission_id')

    if (!submission_id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        project_id,
        submitter_id,
        projects!inner (
          owner_id
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user has access (owner, submitter, or collaborator)
    const isOwner = (submission.projects as any)?.owner_id === user.id
    const isSubmitter = submission.submitter_id === user.id
    let hasAccess = isOwner || isSubmitter

    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('workflow_attachments')
      .select(`
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        created_at,
        uploader:profiles!workflow_attachments_uploaded_by_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq('submission_id', submission_id)
      .order('created_at', { ascending: false })

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const submission_id = formData.get('submission_id') as string

    if (!file || !submission_id) {
      return NextResponse.json({ error: 'File and submission ID are required' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/markdown',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        project_id,
        submitter_id,
        projects!inner (
          owner_id
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user has access (owner, submitter, or collaborator)
    const isOwner = (submission.projects as any)?.owner_id === user.id
    const isSubmitter = submission.submitter_id === user.id
    let hasAccess = isOwner || isSubmitter

    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const storagePath = `workflows/${submission.project_id}/${submission_id}/${uniqueFilename}`

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Save attachment record to database
    const { data: attachment, error: dbError } = await supabase
      .from('workflow_attachments')
      .insert({
        submission_id: submission_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: user.id
      })
      .select(`
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        created_at,
        uploader:profiles!workflow_attachments_uploaded_by_fkey (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('project-files')
        .remove([storagePath])
      
      return NextResponse.json({ error: 'Failed to save attachment' }, { status: 500 })
    }

    return NextResponse.json({ attachment })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const attachment_id = searchParams.get('id')

    if (!attachment_id) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get attachment details and verify access
    const { data: attachment, error: attachmentError } = await supabase
      .from('workflow_attachments')
      .select(`
        id,
        storage_path,
        uploaded_by,
        submission_id,
        workflow_submissions!inner (
          project_id,
          submitter_id,
          projects!inner (
            owner_id
          )
        )
      `)
      .eq('id', attachment_id)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check if user can delete (uploader, submission owner, or project owner)
    const isUploader = attachment.uploaded_by === user.id
    const isSubmitter = (attachment.workflow_submissions as any)?.submitter_id === user.id
    const isProjectOwner = (attachment.workflow_submissions as any)?.projects?.owner_id === user.id
    
    if (!isUploader && !isSubmitter && !isProjectOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([attachment.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('workflow_attachments')
      .delete()
      .eq('id', attachment_id)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}