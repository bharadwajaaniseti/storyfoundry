// Debug script to check calendar state in browser console
// Run this in the browser console when on the calendar page

console.log('🔍 Calendar State Debug')
console.log('======================')

// Check if calendar panel component is mounted
const calendarPanel = document.querySelector('[data-testid="calendar-panel"]') || 
                      document.querySelector('div:has(h3:contains("Story Calendar"))') ||
                      document.querySelector('div:contains("Story Calendar")')

console.log('Calendar panel element found:', !!calendarPanel)

// Check React state (if accessible)
try {
  // Try to find React state in the DOM
  const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]')
  console.log('React root found:', !!reactRoot)
  
  // Manual check - click the debug button if it exists
  const debugButton = document.querySelector('button:contains("Debug Calendar Systems")')
  if (debugButton) {
    console.log('Debug button found - click it manually to see calendar state')
  } else {
    console.log('Debug button not found')
  }
  
} catch (e) {
  console.log('Could not access React state:', e.message)
}

console.log('\n📝 Manual Debug Steps:')
console.log('1. Open browser dev tools (F12)')
console.log('2. Navigate to Calendar panel')
console.log('3. Click the "🐛 Debug Calendar Systems" button')
console.log('4. Check console output for calendar systems data')
console.log('5. Look for any error messages in console')

console.log('\n🔄 If calendar shows as empty:')
console.log('- Check if activeCalendarSystem is set')
console.log('- Verify calendar system data structure')
console.log('- Ensure eras and months are properly loaded')
console.log('- Check if events are being filtered correctly')