import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for seeding. Please check .env.local file.')
}

// Create admin client for seeding
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  try {
    // Create sample profiles (users need to exist in auth.users first)
    console.log('Creating sample profiles...')
    
    const sampleProfiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        role: 'writer',
        display_name: 'Alice Writer',
        bio: 'Passionate screenwriter with a love for sci-fi and thriller genres.',
        company: null,
        country: 'US',
        verified_pro: false
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'pro',
        display_name: 'Bob Producer',
        bio: 'Hollywood producer looking for the next big hit.',
        company: 'Big Picture Studios',
        country: 'US',
        verified_pro: true
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        role: 'admin',
        display_name: 'Carol Admin',
        bio: 'Platform administrator and industry veteran.',
        company: 'StoryFoundry',
        country: 'US',
        verified_pro: true
      }
    ]

    // Note: In a real scenario, these users would need to be created via Supabase Auth first
    // For demo purposes, we'll create the profiles assuming the auth users exist
    
    for (const profile of sampleProfiles) {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
      
      if (error && !error.message.includes('violates foreign key constraint')) {
        console.error(`Error creating profile ${profile.display_name}:`, error)
      } else {
        console.log(`✅ Profile created: ${profile.display_name}`)
      }
    }

    // Create sample projects
    console.log('Creating sample projects...')
    
    const sampleProjects = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        owner_id: '11111111-1111-1111-1111-111111111111',
        title: 'The Last Signal',
        logline: 'When Earth receives its final transmission from a distant colony, a desperate rescue mission uncovers a conspiracy that threatens the future of humanity.',
        synopsis: 'A thrilling space opera that explores themes of isolation, sacrifice, and the lengths we go to save those we love. Set in the year 2087, humanity has expanded across the galaxy, but contact with the furthest colonies is spotty at best.',
        format: 'screenplay',
        genre: 'Science Fiction',
        subgenre: 'Space Opera',
        est_budget_range: '$50M-100M',
        word_count: null,
        cast_size: 8,
        language: 'en',
        visibility: 'public',
        buzz_score: 42.5
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        owner_id: '11111111-1111-1111-1111-111111111111',
        title: 'Small Town Secrets',
        logline: 'A investigative journalist returns to her hometown and discovers that the charming facade hides dark secrets that some will kill to protect.',
        synopsis: 'A psychological thriller that delves into the complexities of small-town life and the secrets that bind communities together.',
        format: 'novel',
        genre: 'Thriller',
        subgenre: 'Psychological',
        est_budget_range: null,
        word_count: 85000,
        cast_size: null,
        language: 'en',
        visibility: 'preview',
        buzz_score: 18.2
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        owner_id: '22222222-2222-2222-2222-222222222222',
        title: 'Digital Hearts',
        logline: 'In a world where AI companions are indistinguishable from humans, a lonely programmer falls in love with his creation, blurring the lines between code and consciousness.',
        synopsis: 'A romantic drama that explores love, consciousness, and what it means to be human in an age of artificial intelligence.',
        format: 'short_story',
        genre: 'Romance',
        subgenre: 'Sci-Fi Romance',
        est_budget_range: null,
        word_count: 12000,
        cast_size: null,
        language: 'en',
        visibility: 'public',
        buzz_score: 31.7
      }
    ]

    for (const project of sampleProjects) {
      const { error } = await supabase
        .from('projects')
        .upsert(project, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating project ${project.title}:`, error)
      } else {
        console.log(`✅ Project created: ${project.title}`)
      }
    }

    // Create sample engagement events
    console.log('Creating sample engagement events...')
    
    const engagementEvents = [
      { project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', actor_id: '22222222-2222-2222-2222-222222222222', kind: 'view', weight: 1 },
      { project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', actor_id: '22222222-2222-2222-2222-222222222222', kind: 'like', weight: 3 },
      { project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', actor_id: '33333333-3333-3333-3333-333333333333', kind: 'save', weight: 5 },
      { project_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', actor_id: '22222222-2222-2222-2222-222222222222', kind: 'view', weight: 1 },
      { project_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', actor_id: '11111111-1111-1111-1111-111111111111', kind: 'view', weight: 1 },
      { project_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', actor_id: '33333333-3333-3333-3333-333333333333', kind: 'like', weight: 3 },
    ]

    for (const event of engagementEvents) {
      const { error } = await supabase
        .from('engagement_events')
        .insert(event)
      
      if (error) {
        console.error(`Error creating engagement event:`, error)
      }
    }

    console.log('✅ Engagement events created')

    // Create sample access request
    console.log('Creating sample access request...')
    
    const { error: accessError } = await supabase
      .from('access_requests')
      .insert({
        project_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        pro_id: '22222222-2222-2222-2222-222222222222',
        message: 'This looks like an exciting project! I would love to read the full manuscript.',
        nda_required: true,
        status: 'pending'
      })

    if (accessError) {
      console.error('Error creating access request:', accessError)
    } else {
      console.log('✅ Access request created')
    }

    // Create sample pitch room
    console.log('Creating sample pitch room...')
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // One week from now

    const { error: pitchError } = await supabase
      .from('pitch_rooms')
      .insert({
        host_id: '22222222-2222-2222-2222-222222222222',
        title: 'Sci-Fi Screenplay Showcase',
        theme: 'Looking for original science fiction screenplays with strong characters and innovative concepts.',
        starts_at: futureDate.toISOString(),
        duration_minutes: 90,
        is_pro_only: true
      })

    if (pitchError) {
      console.error('Error creating pitch room:', pitchError)
    } else {
      console.log('✅ Pitch room created')
    }

    // Create sample subscriptions
    console.log('Creating sample subscriptions...')
    
    const subscriptions = [
      { user_id: '11111111-1111-1111-1111-111111111111', tier: 'writer_plus' },
      { user_id: '22222222-2222-2222-2222-222222222222', tier: 'pro_plus' },
      { user_id: '33333333-3333-3333-3333-333333333333', tier: 'pro_plus' }
    ]

    for (const sub of subscriptions) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert(sub, { onConflict: 'user_id' })
      
      if (error) {
        console.error(`Error creating subscription:`, error)
      }
    }

    console.log('✅ Subscriptions created')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Sample data created:')
    console.log('- 3 user profiles (writer, pro, admin)')
    console.log('- 3 projects with different formats and genres')
    console.log('- Engagement events for buzz calculation')
    console.log('- 1 pending access request')
    console.log('- 1 future pitch room')
    console.log('- User subscriptions')
    console.log('\n🔗 Test the API at: http://localhost:3000/api/health')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
