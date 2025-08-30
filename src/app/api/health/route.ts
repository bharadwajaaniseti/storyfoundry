import { getUser } from '@/lib/auth-server'
import { env, isSupabaseConfigured, isAIConfigured, isStripeConfigured } from '@/lib/env'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        supabase: isSupabaseConfigured(),
        ai: isAIConfigured(),
        stripe: isStripeConfigured(),
      },
      ai_provider: env.AI_PROVIDER,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.profile?.role || 'none',
      } : null
    })

  } catch (error) {
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
