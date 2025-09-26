import React from 'react'
import { EncyclopediaBlock } from '@/types/encyclopedia'

// Temporary placeholder components until full implementations are created
const BlockPlaceholder = ({ type, data }: { type: string, data: any }) => (
  <div className="p-4 bg-gray-50 rounded border">
    <p className="text-sm text-gray-600">
      Block type "{type}" - placeholder implementation
    </p>
    {data && (
      <pre className="mt-2 text-xs text-gray-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    )}
  </div>
)

export function createBlock(block: EncyclopediaBlock, onUpdate: (data: any) => void): React.ReactNode {
  switch (block.type) {
    case 'richtext':
      return <BlockPlaceholder key={block.id} type="richtext" data={block.data} />
    case 'definition':
      return <BlockPlaceholder key={block.id} type="definition" data={block.data} />
    case 'keyvalue':
      return <BlockPlaceholder key={block.id} type="keyvalue" data={block.data} />
    case 'timeline':
      return <BlockPlaceholder key={block.id} type="timeline" data={block.data} />
    case 'etymology':
      return <BlockPlaceholder key={block.id} type="etymology" data={block.data} />
    case 'relationships':
      return <BlockPlaceholder key={block.id} type="relationships" data={block.data} />
    case 'gallery':
      return <BlockPlaceholder key={block.id} type="gallery" data={block.data} />
    case 'quote':
      return <BlockPlaceholder key={block.id} type="quote" data={block.data} />
    case 'callout':
      return <BlockPlaceholder key={block.id} type="callout" data={block.data} />
    default:
      return (
        <div key={block.id} className="p-4 bg-gray-50 rounded border">
          <p className="text-sm text-gray-600">
            Block type "{block.type}" not implemented yet
          </p>
        </div>
      )
  }
}