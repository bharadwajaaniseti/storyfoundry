// Simple content change detection utilities

export function generateChangeSummary(oldContent: string, newContent: string): string {
  if (!oldContent) return 'Initial content created'
  
  const oldWords = oldContent.trim().split(/\s+/).filter(word => word.length > 0)
  const newWords = newContent.trim().split(/\s+/).filter(word => word.length > 0)
  
  const wordDiff = newWords.length - oldWords.length
  const charDiff = newContent.length - oldContent.length
  
  // Calculate percentage change
  const contentSimilarity = calculateSimilarity(oldContent, newContent)
  
  if (contentSimilarity < 0.3) {
    return 'Major content rewrite'
  } else if (contentSimilarity < 0.7) {
    return 'Significant content changes'
  } else if (Math.abs(wordDiff) > 100) {
    return wordDiff > 0 ? `Added ${wordDiff} words` : `Removed ${Math.abs(wordDiff)} words`
  } else if (Math.abs(wordDiff) > 10) {
    return wordDiff > 0 ? `Minor additions (+${wordDiff} words)` : `Minor edits (${wordDiff} words)`
  } else if (charDiff > 50) {
    return 'Text formatting and minor edits'
  } else {
    return 'Minor text changes'
  }
}

export function calculateSimilarity(text1: string, text2: string): number {
  // Simple similarity calculation based on common words
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

export function detectChangeType(oldContent: string, newContent: string): {
  type: 'create' | 'minor' | 'moderate' | 'major' | 'rewrite'
  confidence: number
} {
  if (!oldContent) {
    return { type: 'create', confidence: 1.0 }
  }
  
  const similarity = calculateSimilarity(oldContent, newContent)
  const lengthRatio = newContent.length / oldContent.length
  
  if (similarity < 0.3) {
    return { type: 'rewrite', confidence: 1 - similarity }
  } else if (similarity < 0.6 || lengthRatio > 2 || lengthRatio < 0.5) {
    return { type: 'major', confidence: 1 - similarity }
  } else if (similarity < 0.8) {
    return { type: 'moderate', confidence: 1 - similarity }
  } else {
    return { type: 'minor', confidence: similarity }
  }
}

export function formatTimeDifference(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
  
  return date.toLocaleDateString()
}

export function getVersionTypeColor(type: 'create' | 'minor' | 'moderate' | 'major' | 'rewrite'): string {
  switch (type) {
    case 'create': return 'bg-blue-100 text-blue-700'
    case 'minor': return 'bg-green-100 text-green-700'
    case 'moderate': return 'bg-yellow-100 text-yellow-700'
    case 'major': return 'bg-orange-100 text-orange-700'
    case 'rewrite': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
