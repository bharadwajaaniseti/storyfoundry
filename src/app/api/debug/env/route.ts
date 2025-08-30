import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or with special header
  const isDev = process.env.NODE_ENV === 'development'
  const hasDebugKey = request.headers.get('x-debug-key') === 'storyfoundry-debug-2025'
  
  if (!isDev && !hasDebugKey) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    timestamp: new Date().toISOString(),
    headers: {
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    }
  }

  return NextResponse.json(envCheck)
}
