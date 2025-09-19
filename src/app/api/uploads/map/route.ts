import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and projectId required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate basic constraints (size/type) - keep light server-side validation
    const MAX = 20 * 1024 * 1024
    if (file.size > MAX) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const fileExt = (file.name.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '')
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const storagePath = `maps/${user.id}/${projectId}/${unique}`

    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(storagePath, buffer, { contentType: file.type, cacheControl: '3600' })

    if (uploadError) {
      // Log full error for server-side debugging
      try {
        console.error('Storage upload error:', JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)))
      } catch (e) {
        console.error('Storage upload error (non-serializable):', uploadError)
      }

  const message = (uploadError && (uploadError.message ?? String(uploadError))) || 'Failed to upload'
  return NextResponse.json({ error: message, details: uploadError }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from('project-assets').getPublicUrl(uploadData.path)

    return NextResponse.json({ publicUrl: publicUrl.publicUrl, path: uploadData.path })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: 'Internal' }, { status: 500 })
  }
}
