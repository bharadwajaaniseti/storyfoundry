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
        bio: 'Passionate screenwriter with a love for character-driven stories.',
        avatar_url: null,
        verified_pro: false,
        company: null,
        country: 'US'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'reader',
        display_name: 'Bob Reader',
        bio: 'Avid reader looking for the next great story.',
        avatar_url: null,
        verified_pro: true,
        company: 'Reading Enthusiasts Inc',
        country: 'US'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        role: 'writer',
        display_name: 'Carol Writer',
        bio: 'Platform administrator and industry veteran.',
        avatar_url: null,
        verified_pro: true,
        company: 'StoryFoundry',
        country: 'US'
      }
    ]    // Note: In a real scenario, these users would need to be created via Supabase Auth first
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
      { user_id: '11111111-1111-1111-1111-111111111111', tier: 'free_writer' },
      { user_id: '22222222-2222-2222-2222-222222222222', tier: 'reader_plus' },
      { user_id: '33333333-3333-3333-3333-333333333333', tier: 'writer_pro' }
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

    // Create sample chapters for novel projects
    console.log('Creating sample chapters...')
    
    const sampleChapters = [
      {
        id: 'eeee1111-1111-1111-1111-111111111111',
        project_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Small Town Secrets novel
        chapter_number: 1,
        title: 'Chapter 1: Coming Home',
        content: `The rain drummed against the windshield as Sarah McKenna drove down Main Street for the first time in fifteen years. Millbrook hadn't changed much—the same weathered storefronts, the same flickering neon sign at Murphy's Diner, the same sense of time standing still.

She pulled into the parking lot of the Millbrook Gazette, the small-town newspaper that had summoned her back with an offer she couldn't refuse. Or rather, couldn't afford to refuse. After the scandal that had ended her career at the Washington Herald, opportunities for investigative journalists were scarce.

The bell above the door chimed as she entered, and Margaret Fletcher, the editor who'd hired her over the phone, looked up from her desk. The older woman's gray hair was pulled back in a severe bun, and her reading glasses hung from a chain around her neck.

"Sarah McKenna, I presume?" Margaret stood, extending a weathered hand. "Welcome back to Millbrook."

"Thank you for the opportunity, Mrs. Fletcher." Sarah shook her hand, noting the firmness of the grip.

"It's been quite some time since you've been home, hasn't it? Your mother used to speak of you often before she passed. I'm sorry for your loss."

Sarah nodded, pushing down the familiar pang of guilt. She'd missed the funeral, caught up in a story that had ultimately destroyed her career anyway.

"Now then," Margaret continued, settling back behind her desk, "I suppose you're wondering why I was so eager to hire someone with your... experience for a position at a small-town paper."

The way she said 'experience' made Sarah's stomach tighten. Everyone knew about the scandal. The fabricated source, the retraction, the very public humiliation.

"I'm grateful for the chance to start over," Sarah said carefully.

Margaret studied her for a long moment. "Oh, my dear, I didn't hire you to start over. I hired you to finish something."`,
        word_count: 1247,
        target_word_count: 2500,
        status: 'published'
      },
      {
        id: 'eeee2222-2222-2222-2222-222222222222',
        project_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Small Town Secrets novel
        chapter_number: 2,
        title: 'Chapter 2: Old Wounds',
        content: `Margaret Fletcher's words echoed in Sarah's mind as she walked the familiar streets of Millbrook later that evening. The town looked different in the gathering dusk—shadows seemed longer, and the cheerful facades of the shops took on a more sinister quality.

She found herself standing in front of her childhood home, a modest two-story colonial that now bore a "For Sale" sign in the front yard. The new owners had painted it yellow instead of the white she remembered, but the old oak tree in the front yard was the same one she'd climbed as a child.

"Sarah? Sarah McKenna?"

She turned to see a familiar face approaching from across the street. Tom Bradley had been her high school sweetheart, and the years had been kind to him. His dark hair was now touched with silver at the temples, and he'd filled out in a way that suggested regular workouts rather than too many beers.

"Tom." She managed a smile. "I heard you were still in town."

"Sheriff now, actually." He gestured to the badge pinned to his jacket. "When I heard you were coming back, I... well, I hoped we'd run into each other."

There was an awkwardness between them that hadn't existed when they were eighteen. Too much time, too much history.

"I heard about your mother," he said softly. "I'm sorry. She was a good woman."

"Thank you." Sarah looked back at the house. "It's strange being back. Everything looks smaller somehow."

"Margaret Fletcher mentioned she hired you at the Gazette. What kind of story brought you back to Millbrook?"

Sarah turned to study his expression. In the dying light, she couldn't quite read it, but something in his tone made her cautious.

"She was vague about the details. Said she'd explain more tomorrow."

Tom nodded slowly. "Be careful, Sarah. Millbrook isn't the same place we grew up in. Some stones are better left unturned."

Before she could ask what he meant, his radio crackled to life. He listened to the dispatch, his expression growing serious.

"I have to go," he said, already moving toward his patrol car. "Sarah... if you need anything, anything at all, you call me. Okay?"

As his taillights disappeared around the corner, Sarah found herself wondering what kind of secrets a town like Millbrook could possibly be hiding.`,
        word_count: 1834,
        target_word_count: 2500,
        status: 'published'
      },
      {
        id: 'eeee3333-3333-3333-3333-333333333333',
        project_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Small Town Secrets novel
        chapter_number: 3,
        title: 'Chapter 3: The Assignment',
        content: `The next morning, Sarah arrived at the Gazette to find Margaret Fletcher already at her desk, despite the early hour. The older woman looked up from a manila folder that she quickly closed as Sarah approached.

"Punctual. I like that." Margaret gestured to the chair across from her desk. "Coffee?"

"Please." Sarah settled into the chair, noting how Margaret's fingers drummed nervously against the desk.

Margaret poured coffee from a thermos into two chipped mugs, then sat back down. For a moment, neither woman spoke.

"Twenty-five years ago," Margaret finally began, "a young woman named Rebecca Morrison disappeared from this town. She was nineteen, a freshman at the community college, and by all accounts, she was planning to transfer to a four-year university in the fall."

Sarah pulled out her notebook, a habit from her reporting days. "What were the circumstances of her disappearance?"

"That's just it—there weren't any circumstances. One day she was here, the next she wasn't. Her car was found abandoned on Highway 9, about ten miles outside of town. No signs of struggle, no note, nothing."

"Did the police investigate?"

Margaret's laugh was bitter. "The police at the time were... less than thorough. The sheriff back then was more interested in keeping things quiet than finding answers. Rebecca was labeled a runaway, case closed."

"But you don't think she ran away."

"Rebecca Morrison had a full scholarship to State University. She had a boyfriend she was planning to marry, a family who adored her, and a future mapped out ahead of her. Why would she throw all that away?"

Sarah made notes as Margaret spoke. "What makes you think this is a story worth revisiting now?"

Margaret opened the manila folder and pushed it across the desk. Inside were newspaper clippings, photographs, and what appeared to be copies of police reports.

"Because two weeks ago, construction workers building the new shopping center on the outskirts of town found human remains. The coroner's preliminary report suggests they've been there for about twenty-five years."

Sarah's pen stopped moving. "And you think it's Rebecca Morrison."

"I think it's time this town faced the truth about what happened to that girl. And I think you're the right person to find it."

Sarah studied the photographs in the folder—a young woman with dark hair and bright eyes, caught in the middle of a laugh. She looked so alive, so full of possibility.

"Why me? Why not hire a local journalist, or bring in someone from a bigger paper?"

Margaret's smile was sad. "Because, my dear, you're the only one who doesn't owe anyone in this town any favors. And after what happened in Washington, you have nothing left to lose."`,
        word_count: 1923,
        target_word_count: 2500,
        status: 'published'
      }
    ]

    for (const chapter of sampleChapters) {
      const { error } = await supabase
        .from('project_chapters')
        .upsert(chapter, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating chapter ${chapter.title}:`, error)
      } else {
        console.log(`✅ Chapter created: ${chapter.title}`)
      }
    }

    // Create sample comments for the chapters
    console.log('Creating sample comments...')
    
    const sampleComments = [
      {
        id: 'ffff1111-1111-1111-1111-111111111111',
        chapter_id: 'eeee1111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222',
        content: 'Great opening chapter! The atmosphere is perfectly set and Sarah\'s character comes through clearly. I love how you\'ve established the mystery from the very first scene.',
        comment_type: 'praise'
      },
      {
        id: 'ffff2222-2222-2222-2222-222222222222',
        chapter_id: 'eeee1111-1111-1111-1111-111111111111',
        user_id: '33333333-3333-3333-3333-333333333333',
        content: 'The pacing feels a bit slow in the middle section. Consider adding more tension when Sarah first meets Margaret. Perhaps Margaret could be more evasive about the assignment?',
        comment_type: 'suggestion'
      },
      {
        id: 'ffff3333-3333-3333-3333-333333333333',
        chapter_id: 'eeee2222-2222-2222-2222-222222222222',
        user_id: '22222222-2222-2222-2222-222222222222',
        content: 'Tom\'s warning adds great intrigue. The dialogue feels natural and the tension between them is palpable.',
        comment_type: 'general'
      }
    ]

    for (const comment of sampleComments) {
      const { error } = await supabase
        .from('chapter_comments')
        .insert(comment)
      
      if (error) {
        console.error(`Error creating comment:`, error)
      } else {
        console.log(`✅ Comment created`)
      }
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Sample data created:')
    console.log('- 3 user profiles (writer, pro, admin)')
    console.log('- 3 projects with different formats and genres')
    console.log('- 3 chapters for the novel "Small Town Secrets"')
    console.log('- 3 sample comments on the chapters')
    console.log('- Engagement events for buzz calculation')
    console.log('- 1 pending access request')
    console.log('- 1 future pitch room')
    console.log('- User subscriptions')
    console.log('\n🔗 Test the API at: http://localhost:3000/api/health')
    console.log('📖 Test chapter comments at: http://localhost:3000/novels/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/read')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
