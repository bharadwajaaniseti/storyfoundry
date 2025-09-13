require('dotenv').config({ path: '.env.local' })

// Mock Next.js environment
global.fetch = require('node-fetch')

async function testApprovalDirect() {
  try {
    console.log('🚀 Testing approval API directly...')
    
    // Import the API route
    const { POST } = require('../src/app/api/projects/[id]/approvals/route.ts')
    
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
    const pendingChangeId = 'b62e445c-933a-4874-be27-cb31bf6be52f'
    
    // Create mock request
    const mockRequest = {
      json: async () => ({
        pendingChangeId: pendingChangeId,
        decision: 'approve',
        feedbackNotes: 'Approved via direct test'
      }),
      url: `http://localhost:3001/api/projects/${projectId}/approvals`,
      headers: new Map([
        ['content-type', 'application/json']
      ])
    }
    
    // Create mock params
    const mockParams = {
      params: Promise.resolve({ id: projectId })
    }
    
    console.log('📡 Calling POST handler directly...')
    const response = await POST(mockRequest, mockParams)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Approval successful:', result)
    } else {
      const errorText = await response.text()
      console.log('❌ Approval failed:', response.status, errorText)
    }
    
  } catch (error) {
    console.error('❌ Error testing approval directly:', error)
  }
}

testApprovalDirect()