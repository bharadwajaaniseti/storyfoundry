// Debug script for formatting issues
// Run this in the browser console to test the formatting functionality

console.log('🔍 Debugging formatting functionality...');

// Test 1: Check if FormattingToolbar buttons exist
const formatButtons = document.querySelectorAll('[title*="Bold"], [title*="Italic"], [title*="Heading"]');
console.log(`✅ Found ${formatButtons.length} formatting buttons`);

// Test 2: Check if textareas exist
const overviewTextarea = document.querySelector('textarea[placeholder*="Type here to add notes"]');
const historyTextarea = document.querySelector('textarea[value*="history"], textarea:nth-of-type(2)');
console.log('✅ Overview textarea:', overviewTextarea ? 'Found' : 'Not found');
console.log('✅ History textarea:', historyTextarea ? 'Found' : 'Not found');

// Test 3: Simulate bold button click
const boldButton = Array.from(formatButtons).find(btn => btn.getAttribute('title') === 'Bold');
if (boldButton) {
    console.log('✅ Bold button found');
    
    // Add click event listener to see what happens
    boldButton.addEventListener('click', (e) => {
        console.log('🖱️ Bold button clicked!');
        console.log('Event:', e);
        console.log('Target:', e.target);
    });
    
    console.log('💡 Try clicking the bold button now and check the console output');
} else {
    console.log('❌ Bold button not found');
}

// Test 4: Check current text selection
function checkSelection() {
    const activeTextarea = document.activeElement;
    if (activeTextarea && activeTextarea.tagName === 'TEXTAREA') {
        console.log('📝 Active textarea:', activeTextarea);
        console.log('📍 Selection start:', activeTextarea.selectionStart);
        console.log('📍 Selection end:', activeTextarea.selectionEnd);
        console.log('📄 Selected text:', activeTextarea.value.substring(activeTextarea.selectionStart, activeTextarea.selectionEnd));
        console.log('📄 Current value length:', activeTextarea.value.length);
    } else {
        console.log('❌ No textarea is currently focused');
    }
}

// Add helper function to check selection
window.checkSelection = checkSelection;
console.log('💡 Run checkSelection() after clicking in a textarea to see selection info');