require('dotenv').config({ path: '.env.local' })

async function testApproval() {
  try {
    console.log('🚀 Testing approval API...')
    
    const projectId = 'd92db81b-76c9-4a60-87fa-38efd528f7f8'
    const pendingChangeId = 'cc575150-51d1-4058-980d-7a8e141a5609'
    
    // Test data for approval
    const approvalData = {
      pendingChangeId: pendingChangeId,
      decision: 'approve',
      feedbackNotes: 'Approved via automated test'
    }
    
    const response = await fetch(`http://localhost:3001/api/projects/${projectId}/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(approvalData)
    })
    
    console.log('📡 Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Approval successful:', result)
    } else {
      const errorText = await response.text()
      console.log('❌ Approval failed:', response.status, errorText)
    }
    
  } catch (error) {
    console.error('❌ Error testing approval:', error)
  }
}

// Wait a moment for server to start, then test
setTimeout(testApproval, 3000)