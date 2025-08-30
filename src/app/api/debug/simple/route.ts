import { NextResponse } from 'next/server'

export async function GET() {
  // Simple debug endpoint without headers
  const debug = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'MISSING',
    // Show first/last few chars of keys to verify they're correct
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...',
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...',
  }

  return NextResponse.json(debug)
}
