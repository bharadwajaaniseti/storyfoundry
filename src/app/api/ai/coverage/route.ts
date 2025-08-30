import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

// This would integrate with OpenAI, Claude, or other AI providers
// For now, we'll create a mock implementation

const AI_SUGGESTIONS = {
  character_development: [
    "Consider adding a mentor figure to guide your protagonist",
    "Your antagonist could benefit from a more compelling backstory",
    "The supporting characters feel underdeveloped - try giving them individual goals",
    "Consider adding a character who challenges your protagonist's beliefs"
  ],
  plot_structure: [
    "Your inciting incident could happen earlier to hook readers faster",
    "Consider adding more conflict in the second act",
    "The climax feels rushed - try building more tension beforehand",
    "Your resolution could benefit from showing long-term consequences"
  ],
  dialogue: [
    "Some dialogue feels exposition-heavy - try making it more natural",
    "Each character should have a distinct voice and speaking pattern",
    "Consider using subtext to add depth to conversations",
    "Your dialogue tags could be more varied and descriptive"
  ],
  pacing: [
    "The opening scenes move too slowly - consider starting in media res",
    "Action sequences could benefit from shorter, punchier sentences",
    "Try alternating between fast and slow scenes for better rhythm",
    "Some descriptive passages interrupt the flow - consider trimming"
  ]
}

const GENRE_SPECIFIC_TIPS = {
  thriller: [
    "Increase tension by withholding information from readers",
    "Use short chapters to maintain momentum",
    "Every scene should either advance the plot or reveal character"
  ],
  romance: [
    "Build romantic tension through meaningful obstacles",
    "Show attraction through actions, not just thoughts",
    "Create chemistry through conflict and shared values"
  ],
  horror: [
    "Build dread through atmosphere before revealing the threat",
    "Use everyday settings to create unsettling contrasts",
    "Fear of the unknown is often more effective than graphic content"
  ],
  comedy: [
    "Timing is crucial - set up jokes with proper pacing",
    "Character-based humor feels more authentic than situational",
    "Subvert expectations to create comedic moments"
  ],
  'sci-fi': [
    "Ground fantastical elements in relatable human experiences",
    "Explore the social implications of your technology",
    "Show how scientific advances affect daily life"
  ],
  fantasy: [
    "Establish clear rules for your magic system",
    "Create a believable world with its own history and culture",
    "Use familiar elements to help readers navigate new concepts"
  ]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, projectId, analysisType = 'general' } = body

    if (!content) {
      return Response.json(
        { error: 'Content is required for analysis' },
        { status: 400 }
      )
    }

    // Verify user owns the project
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id, genre, format')
        .eq('id', projectId)
        .single()

      if (!project || project.owner_id !== user.id) {
        return Response.json(
          { error: 'Project not found or access denied' },
          { status: 403 }
        )
      }
    }

    // Simple content analysis
    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length
    const sentenceCount = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length
    const avgWordsPerSentence = wordCount > 0 ? Math.round(wordCount / sentenceCount) : 0
    
    // Character analysis
    const charactersDetected = extractCharacterNames(content)
    const dialoguePercentage = calculateDialoguePercentage(content)
    
    // Generate suggestions based on analysis type
    let suggestions: string[] = []
    
    switch (analysisType) {
      case 'character':
        suggestions = getRandomSuggestions(AI_SUGGESTIONS.character_development, 3)
        break
      case 'plot':
        suggestions = getRandomSuggestions(AI_SUGGESTIONS.plot_structure, 3)
        break
      case 'dialogue':
        suggestions = getRandomSuggestions(AI_SUGGESTIONS.dialogue, 3)
        break
      case 'pacing':
        suggestions = getRandomSuggestions(AI_SUGGESTIONS.pacing, 3)
        break
      default:
        // General analysis - mix of different types
        suggestions = [
          ...getRandomSuggestions(AI_SUGGESTIONS.character_development, 1),
          ...getRandomSuggestions(AI_SUGGESTIONS.plot_structure, 1),
          ...getRandomSuggestions(AI_SUGGESTIONS.dialogue, 1)
        ]
    }

    // Add genre-specific suggestions if we have project info
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('genre')
        .eq('id', projectId)
        .single()

      if (project?.genre) {
        const genreKey = project.genre.toLowerCase().replace('-', '_')
        const genreTips = GENRE_SPECIFIC_TIPS[genreKey as keyof typeof GENRE_SPECIFIC_TIPS]
        if (genreTips) {
          suggestions.push(...getRandomSuggestions(genreTips, 1))
        }
      }
    }

    const analysis = {
      content_stats: {
        word_count: wordCount,
        sentence_count: sentenceCount,
        avg_words_per_sentence: avgWordsPerSentence,
        characters_detected: charactersDetected.length,
        dialogue_percentage: dialoguePercentage
      },
      characters: charactersDetected,
      suggestions,
      overall_score: calculateOverallScore(wordCount, sentenceCount, dialoguePercentage),
      areas_for_improvement: identifyImprovementAreas(wordCount, avgWordsPerSentence, dialoguePercentage)
    }

    return Response.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('AI analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    )
  }
}

function extractCharacterNames(content: string): string[] {
  // Simple character detection - look for capitalized words that appear multiple times
  // In a real implementation, this would use NLP
  const words = content.match(/\b[A-Z][a-z]+\b/g) || []
  const wordCounts: { [key: string]: number } = {}
  
  words.forEach(word => {
    if (word.length > 2 && !['The', 'And', 'But', 'For', 'Nor', 'Or', 'So', 'Yet'].includes(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }
  })
  
  return Object.entries(wordCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
}

function calculateDialoguePercentage(content: string): number {
  const dialogueMatches = content.match(/"[^"]*"/g) || []
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length
  const totalWords = content.split(/\s+/).length
  
  return totalWords > 0 ? Math.round((dialogueWords / totalWords) * 100) : 0
}

function getRandomSuggestions(suggestions: string[], count: number): string[] {
  const shuffled = [...suggestions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function calculateOverallScore(wordCount: number, sentenceCount: number, dialoguePercentage: number): number {
  let score = 50 // Base score
  
  // Bonus for adequate word count
  if (wordCount > 500) score += 10
  if (wordCount > 2000) score += 10
  
  // Bonus for sentence variety
  if (sentenceCount > 10) score += 10
  
  // Bonus for dialogue balance
  if (dialoguePercentage > 10 && dialoguePercentage < 60) score += 10
  
  // Bonus for good sentence length variety
  const avgSentenceLength = wordCount / sentenceCount
  if (avgSentenceLength > 8 && avgSentenceLength < 25) score += 10
  
  return Math.min(score, 100)
}

function identifyImprovementAreas(wordCount: number, avgWordsPerSentence: number, dialoguePercentage: number): string[] {
  const areas: string[] = []
  
  if (wordCount < 500) {
    areas.push('Content length - consider expanding your scenes')
  }
  
  if (avgWordsPerSentence > 30) {
    areas.push('Sentence length - try breaking up long sentences')
  }
  
  if (avgWordsPerSentence < 8) {
    areas.push('Sentence variety - mix short and longer sentences')
  }
  
  if (dialoguePercentage < 5) {
    areas.push('Dialogue - consider adding character conversations')
  }
  
  if (dialoguePercentage > 70) {
    areas.push('Narrative balance - add more description and action')
  }
  
  return areas
}
