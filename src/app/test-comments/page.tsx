'use client'

import ChapterComments from '@/components/chapter-comments'

export default function TestCommentsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Chapter Comments Test</h1>
      <ChapterComments chapterId="test-chapter-123" />
    </div>
  )
}
