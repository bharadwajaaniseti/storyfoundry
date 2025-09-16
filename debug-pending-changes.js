// Debug script for pending changes system
// Run this in browser console on the project page

class PendingChangesDebugger {
  constructor() {
    this.projectId = window.location.pathname.split('/').pop()
    console.log('🔍 Debugging project:', this.projectId)
  }

  async checkUserRole() {
    console.log('\n=== USER ROLE CHECK ===')
    
    try {
      // Check current user
      const supabase = window.supabase || (await import('/lib/auth')).createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Current user:', user?.id)
      
      // Check project ownership
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id, title')
        .eq('id', this.projectId)
        .single()
      
      console.log('🏠 Project owner:', project?.owner_id)
      console.log('📝 Project title:', project?.title)
      console.log('👑 Is owner?', project?.owner_id === user?.id)
      
      // Check collaborator status
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', this.projectId)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single()
      
      console.log('🤝 Collaborator record:', collaborator)
      console.log('🎭 Role:', collaborator?.role)
      
      return {
        userId: user?.id,
        projectOwnerId: project?.owner_id,
        isOwner: project?.owner_id === user?.id,
        collaborator,
        role: collaborator?.role
      }
    } catch (error) {
      console.error('❌ Error checking user role:', error)
      return null
    }
  }

  async checkTriggers() {
    console.log('\n=== TRIGGER CHECK ===')
    
    try {
      const supabase = window.supabase || (await import('/lib/auth')).createSupabaseClient()
      
      // Check if triggers exist
      const { data: triggers } = await supabase
        .rpc('sql', { 
          query: `
            SELECT 
              trigger_name, 
              event_manipulation, 
              event_object_table, 
              action_statement 
            FROM information_schema.triggers 
            WHERE trigger_name LIKE '%pending_changes%'
          `
        })
      
      console.log('🔧 Triggers found:', triggers)
      
      // Check if function exists
      const { data: functions } = await supabase
        .rpc('sql', {
          query: `
            SELECT proname 
            FROM pg_proc 
            WHERE proname = 'create_pending_change'
          `
        })
      
      console.log('⚙️ Function exists:', functions?.length > 0)
      
    } catch (error) {
      console.error('❌ Error checking triggers:', error)
    }
  }

  async checkPendingChanges() {
    console.log('\n=== PENDING CHANGES CHECK ===')
    
    try {
      const supabase = window.supabase || (await import('/lib/auth')).createSupabaseClient()
      
      // Check pending changes table
      const { data: pendingChanges, error: pendingError } = await supabase
        .from('pending_changes')
        .select('*')
        .eq('project_id', this.projectId)
        .order('created_at', { ascending: false })
      
      console.log('📋 Pending changes:', pendingChanges)
      console.log('❌ Pending changes error:', pendingError)
      
      // Check change batches
      const { data: batches, error: batchError } = await supabase
        .from('change_batches')
        .select('*')
        .eq('project_id', this.projectId)
        .order('created_at', { ascending: false })
      
      console.log('📦 Change batches:', batches)
      console.log('❌ Batch error:', batchError)
      
      return { pendingChanges, batches }
    } catch (error) {
      console.error('❌ Error checking pending changes:', error)
      return null
    }
  }

  async testDirectUpdate() {
    console.log('\n=== DIRECT UPDATE TEST ===')
    
    try {
      const supabase = window.supabase || (await import('/lib/auth')).createSupabaseClient()
      
      // Find a test chapter
      const { data: chapters } = await supabase
        .from('project_chapters')
        .select('*')
        .eq('project_id', this.projectId)
        .limit(1)
      
      if (!chapters || chapters.length === 0) {
        console.log('❌ No chapters found to test with')
        return
      }
      
      const testChapter = chapters[0]
      console.log('📖 Test chapter:', testChapter.id, testChapter.title)
      
      // Try updating it
      const { data, error } = await supabase
        .from('project_chapters')
        .update({ 
          title: testChapter.title + ' (test)',
          updated_at: new Date().toISOString()
        })
        .eq('id', testChapter.id)
        .select()
      
      console.log('✅ Update result:', data)
      console.log('❌ Update error:', error)
      
      // Check if pending change was created
      setTimeout(async () => {
        await this.checkPendingChanges()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error in direct update test:', error)
    }
  }

  async runFullDebug() {
    console.log('🚀 Starting full pending changes debug...\n')
    
    const userInfo = await this.checkUserRole()
    await this.checkTriggers()
    const pendingData = await this.checkPendingChanges()
    
    console.log('\n=== SUMMARY ===')
    console.log('User is owner:', userInfo?.isOwner)
    console.log('User is editor:', userInfo?.role === 'editor')
    console.log('Pending changes count:', pendingData?.pendingChanges?.length || 0)
    console.log('Change batches count:', pendingData?.batches?.length || 0)
    
    if (userInfo?.isOwner) {
      console.log('⚠️ You are the project owner - changes go directly, no pending changes created')
      console.log('💡 To test pending changes, you need to be logged in as an editor collaborator')
    } else if (userInfo?.role) {
      console.log('✅ You are a collaborator - changes should create pending records')
      console.log('🔍 Run testDirectUpdate() to test trigger firing')
    }
    
    return userInfo
  }
}

// Make it available globally
window.PendingChangesDebugger = PendingChangesDebugger

// Auto-run
const pDebugger = new PendingChangesDebugger()
pDebugger.runFullDebug().then((userInfo) => {
  console.log('\n💡 Next steps:')
  console.log('1. Check the summary above')
  console.log('2. If you are owner, test with an editor account')
  console.log('3. If you are editor, run: pDebugger.testDirectUpdate()')
  console.log('4. Check browser network tab for API errors')
})

console.log('🐛 Pending Changes Debugger loaded!')
console.log('Usage: pDebugger.runFullDebug() or pDebugger.testDirectUpdate()')