import { createAiProvider } from '@/lib/ai/provider'
import { requireAuth } from '@/lib/auth-server'
import { handleApiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const loglineRequestSchema = z.object({
  text: z.string().min(50, 'Text must be at least 50 characters'),
  genre: z.string().optional(),
  format: z.enum(['screenplay', 'short_story', 'novel', 'treatment', 'pilot']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    const body = await request.json()
    const { text, genre, format } = loglineRequestSchema.parse(body)

    // Get AI provider
    const aiProvider = createAiProvider()

    // Generate loglines
    const result = await aiProvider.generateLoglines(text, genre, format)

    return Response.json({
      success: true,
      data: result
    })

  } catch (error) {
    return handleApiError(error)
  }
}
