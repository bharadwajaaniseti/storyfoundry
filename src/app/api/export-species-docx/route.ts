import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, BorderStyle } from 'docx'

interface SpeciesAttributes {
  type: string
  size: string
  intelligence: string
  diet: string
  tags: string[]
  physical_traits: string[]
  abilities: string[]
  weaknesses: string[]
  habitat: string[]
  biome: string[]
  climate: string
  behavior: string
  communication: string
  temperament: string
  languages: string[]
  customs: string
  beliefs: string
  technology: string
}

interface Species {
  name: string
  description: string
  attributes: SpeciesAttributes
  tags: string[]
}

export async function POST(req: Request) {
  try {
    const species = await req.json()

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: species.name,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),

          // Type and Basic Info Table
          new Table({
            width: {
              size: 100,
              type: 'pct',
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Type')],
                    width: { size: 20, type: 'pct' }
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.type || 'N/A')]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Size')]
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.size || 'N/A')]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Intelligence')]
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.intelligence || 'N/A')]
                  })
                ]
              })
            ]
          }),

          // Description
          new Paragraph({
            text: 'Description',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: species.description || 'No description provided.',
            spacing: { after: 200 }
          }),

          // Physical Traits
          new Paragraph({
            text: 'Physical Traits',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          ...(species.attributes.physical_traits || []).map((trait: string) => 
            new Paragraph({
              bullet: {
                level: 0
              },
              text: trait
            })
          ),

          // Abilities
          new Paragraph({
            text: 'Abilities',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          ...(species.attributes.abilities || []).map((ability: string) => 
            new Paragraph({
              bullet: {
                level: 0
              },
              text: ability
            })
          ),

          // Habitat & Environment
          new Paragraph({
            text: 'Habitat & Environment',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: {
              size: 100,
              type: 'pct',
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Climate')],
                    width: { size: 30, type: 'pct' }
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.climate || 'N/A')]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Habitats')]
                  }),
                  new TableCell({
                    children: [new Paragraph((species.attributes.habitat || []).join(', ') || 'N/A')]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Biomes')]
                  }),
                  new TableCell({
                    children: [new Paragraph((species.attributes.biome || []).join(', ') || 'N/A')]
                  })
                ]
              })
            ]
          }),

          // Behavior & Social Structure
          new Paragraph({
            text: 'Behavior & Social Structure',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: {
              size: 100,
              type: 'pct',
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Temperament')],
                    width: { size: 30, type: 'pct' }
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.temperament || 'N/A')]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Communication')]
                  }),
                  new TableCell({
                    children: [new Paragraph(species.attributes.communication || 'N/A')]
                  })
                ]
              })
            ]
          }),
          new Paragraph({
            text: species.attributes.behavior || 'No behavioral information provided.',
            spacing: { before: 200 }
          }),

          // Culture & Society (if intelligent species)
          ...(species.attributes.intelligence === 'Sapient' ? [
            new Paragraph({
              text: 'Culture & Society',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Table({
              width: {
                size: 100,
                type: 'pct',
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Technology Level')],
                      width: { size: 30, type: 'pct' }
                    }),
                    new TableCell({
                      children: [new Paragraph(species.attributes.technology || 'N/A')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph('Languages')]
                    }),
                    new TableCell({
                      children: [new Paragraph((species.attributes.languages || []).join(', ') || 'N/A')]
                    })
                  ]
                })
              ]
            }),
            new Paragraph({
              text: 'Customs & Traditions',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: species.attributes.customs || 'No customs information provided.',
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: 'Beliefs & Religion',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: species.attributes.beliefs || 'No beliefs information provided.',
              spacing: { after: 200 }
            })
          ] : []),

          // Tags
          new Paragraph({
            text: 'Tags',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: (species.tags || []).map((tag: string) => `#${tag}`).join(', ') || 'No tags',
            spacing: { after: 200 }
          })
        ]
      }]
    })

    // Generate the document
    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${species.name || 'species'}.docx"`
      }
    })
  } catch (error) {
    console.error('Error generating Word document:', error)
    return new NextResponse('Error generating document', { status: 500 })
  }
}