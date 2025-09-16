// Test script to verify unified comment system
const fs = require('fs')

console.log('🧪 Testing Unified Comment System')
console.log('================================')

// Check if both API routes exist and what they use
const sidebarApiExists = fs.existsSync('./src/app/api/projects/[id]/comments/route.ts')
const collaboratorApiExists = fs.existsSync('./src/app/api/projects/comments/route.ts')

console.log(`📍 Sidebar comments API exists: ${sidebarApiExists}`)
console.log(`📍 Collaborator comments API exists: ${collaboratorApiExists}`)

if (sidebarApiExists) {
  const sidebarContent = fs.readFileSync('./src/app/api/projects/[id]/comments/route.ts', 'utf8')
  const usesUnifiedTable = sidebarContent.includes('collaboration_project_comments')
  console.log(`✅ Sidebar API uses unified table: ${usesUnifiedTable}`)
}

if (collaboratorApiExists) {
  const collaboratorContent = fs.readFileSync('./src/app/api/projects/comments/route.ts', 'utf8')
  const usesUnifiedTable = collaboratorContent.includes('collaboration_project_comments')
  console.log(`✅ Collaborator API uses unified table: ${usesUnifiedTable}`)
}

// Check main page implementation
const mainPageContent = fs.readFileSync('./src/app/app/projects/[id]/page.tsx', 'utf8')
const usesCollaboratorEndpoint = mainPageContent.includes("'/api/projects/comments'")
const usesSidebarEndpoint = mainPageContent.includes("'/api/projects/${projectId}/comments'")
console.log(`📍 Main page uses collaborator endpoint: ${usesCollaboratorEndpoint}`)
console.log(`� Main page uses sidebar endpoint: ${usesSidebarEndpoint}`)

// Check if both endpoints point to same table
console.log('\n🔄 Unified System Status:')
if (sidebarApiExists && collaboratorApiExists) {
  const sidebarContent = fs.readFileSync('./src/app/api/projects/[id]/comments/route.ts', 'utf8')
  const collaboratorContent = fs.readFileSync('./src/app/api/projects/comments/route.ts', 'utf8')
  
  const bothUseUnifiedTable = sidebarContent.includes('collaboration_project_comments') && 
                              collaboratorContent.includes('collaboration_project_comments')
  console.log(`✅ Both APIs use same unified table: ${bothUseUnifiedTable}`)
}