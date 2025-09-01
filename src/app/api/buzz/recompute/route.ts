import { requireRole } from '@/lib/auth-server'
import { recomputeAllBuzzScores } from '@/lib/buzz'
import { handleApiError } from '@/lib/utils'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Require writer role (since they manage content)
    await requireRole('writer')

    // Recompute all buzz scores
    const result = await recomputeAllBuzzScores()

    return Response.json({
      success: true,
      data: {
        message: 'Buzz scores recomputed successfully',
        updated: result.updated,
        errors: result.errors,
        total: result.updated + result.errors
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
