// Debug script to test role detection for a specific user and project
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Load Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugRoleDetection(projectId, userEmail) {
  console.log('=== Role Detection Debug ===')
  console.log('Project ID:', projectId)
  console.log('User Email:', userEmail)
  console.log('')

  try {
    // 1. First, try to find user in auth.users (though this might not be accessible)
    // Let's check profiles table structure first
    const { data: profileSample, error: profileSampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profileSampleError) {
      console.error('Profile Sample Error:', profileSampleError)
    } else {
      console.log('✅ Profiles table structure (sample record):')
      if (profileSample && profileSample.length > 0) {
        console.log('Columns:', Object.keys(profileSample[0]))
      }
      console.log('')
    }

    // 2. Try to find user by different approaches
    let user = null
    
    // Try by user_id if the userEmail looks like a UUID
    if (userEmail.includes('-') && userEmail.length === 36) {
      const { data: profileById, error: profileByIdError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userEmail)
      
      if (!profileByIdError && profileById && profileById.length > 0) {
        user = profileById[0]
        console.log('✅ Found user by ID')
      }
    }
    
    // If not found by ID, try other fields
    if (!user) {
      // Try searching by display_name, first_name, last_name etc
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
      
      if (!allProfilesError && allProfiles) {
        console.log(`📋 Found ${allProfiles.length} total profiles`)
        
        // Look for email-like patterns in the profiles
        user = allProfiles.find(p => 
          p.display_name?.toLowerCase().includes(userEmail.split('@')[0].toLowerCase()) ||
          p.first_name?.toLowerCase().includes(userEmail.split('@')[0].toLowerCase()) ||
          p.last_name?.toLowerCase().includes(userEmail.split('@')[0].toLowerCase())
        )
        
        if (user) {
          console.log('✅ Found user by name matching:', user.display_name || user.first_name)
        } else {
          console.log('❌ Could not find user matching:', userEmail)
          console.log('Available profiles:')
          allProfiles.forEach((p, i) => {
            console.log(`  ${i+1}. ${p.display_name || p.first_name || p.id} (ID: ${p.id})`)
          })
          return
        }
      }
    }
    
    if (!user) {
      console.log('❌ No user found')
      return
    }
    
    console.log('✅ User Profile Found:')
    console.log('- ID:', user.id)
    console.log('- Display Name:', user.display_name)
    console.log('- First Name:', user.first_name)
    console.log('- Last Name:', user.last_name)
    console.log('')

    // 2. Check project - try different approaches
    let project = null
    
    // First try direct lookup
    const { data: projectDirect, error: projectDirectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
    
    if (projectDirectError) {
      console.log('Direct project lookup error:', projectDirectError.message)
    }
    
    if (projectDirect && projectDirect.length > 0) {
      project = projectDirect[0]
    } else {
      // If direct lookup fails, try to find any project that matches the pattern
      const { data: allProjects, error: allProjectsError } = await supabase
        .from('projects')
        .select('*')
      
      if (!allProjectsError && allProjects) {
        console.log(`📋 Found ${allProjects.length} total projects`)
        project = allProjects.find(p => p.id.includes(projectId.substring(0, 8))) || allProjects[0]
        
        if (project) {
          console.log('Using project:', project.title, '(ID:', project.id + ')')
        }
      }
    }
    
    if (!project) {
      console.log('❌ No project found')
      return
    }
    
    console.log('✅ Project Found:')
    console.log('- ID:', project.id)
    console.log('- Title:', project.title)
    console.log('- Owner ID:', project.owner_id)
    console.log('- Is Owner?', project.owner_id === user.id ? '✅ YES' : '❌ NO')
    console.log('')

    // 3. Check collaboration records
    const { data: collaborations, error: collabError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
    
    if (collabError) {
      console.error('Collaboration Error:', collabError)
      return
    }
    
    console.log('🤝 Collaboration Records:')
    if (collaborations && collaborations.length > 0) {
      collaborations.forEach((collab, index) => {
        console.log(`  ${index + 1}. Role: ${collab.role}`)
        console.log(`     Status: ${collab.status}`)
        console.log(`     Created: ${collab.created_at}`)
        console.log(`     Updated: ${collab.updated_at}`)
      })
    } else {
      console.log('  ❌ No collaboration records found')
    }
    console.log('')

    // 4. Check if there are any project access records
    const { data: accessRecords, error: accessError } = await supabase
      .from('project_access_requests')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
    
    if (!accessError && accessRecords) {
      console.log('🔑 Access Request Records:')
      if (accessRecords.length > 0) {
        accessRecords.forEach((access, index) => {
          console.log(`  ${index + 1}. Status: ${access.status}`)
          console.log(`     Requested Role: ${access.requested_role}`)
          console.log(`     Created: ${access.created_at}`)
        })
      } else {
        console.log('  ❌ No access request records found')
      }
      console.log('')
    }

    // 5. Summary
    console.log('=== SUMMARY ===')
    const isOwner = project.owner_id === user.id
    const hasCollabRole = collaborations && collaborations.length > 0
    const activeCollab = collaborations?.find(c => c.status === 'active')
    
    console.log('Expected Role Detection:')
    if (isOwner) {
      console.log('✅ Should be: OWNER')
    } else if (activeCollab) {
      console.log(`✅ Should be: ${activeCollab.role.toUpperCase()}`)
    } else {
      console.log('❌ Should be: VIEWER (no active collaboration)')
    }

  } catch (error) {
    console.error('Debug Error:', error)
  }
}

// Usage: node debug-role-detection.js <project-id> <user-email>
const projectId = process.argv[2]
const userEmail = process.argv[3]

if (!projectId || !userEmail) {
  console.log('Usage: node debug-role-detection.js <project-id> <user-email>')
  console.log('Example: node debug-role-detection.js "53b039ea-92ff-4bd8-8448-4b2fbef1d0a8" "bharadwaja@example.com"')
  process.exit(1)
}

debugRoleDetection(projectId, userEmail)