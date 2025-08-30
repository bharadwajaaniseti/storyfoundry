import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  try {
    // Test both clients
    const results: any = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      tests: {}
    }

    // Test anon client
    try {
      const supabaseAnon = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        }
      )

      const { data, error } = await supabaseAnon.from('profiles').select('id').limit(1)
      results.tests.anonClient = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (e) {
      results.tests.anonClient = {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // Test service role client
    try {
      const supabaseService = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        }
      )

      const { data, error } = await supabaseService.from('profiles').select('id').limit(1)
      results.tests.serviceClient = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      }
    } catch (e) {
      results.tests.serviceClient = {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
