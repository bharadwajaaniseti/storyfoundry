'use client'

import CharacterEditor from '@/components/character-editor'

export default function TestCharacterEditor() {
  const handleSave = (character: any) => {
    console.log('Character saved:', character)
  }

  const handleCancel = () => {
    console.log('Character creation cancelled')
  }

  return (
    <div className="min-h-screen">
      <CharacterEditor
        projectId="test-project"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
