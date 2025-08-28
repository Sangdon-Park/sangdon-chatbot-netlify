// LOCAL QUICK TEST - Test key functions locally
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testSingle(message) {
  console.log(`\n🔍 Testing: "${message}"`);
  
  try {
    // Step 1
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 })
    });
    
    if (!response1.ok) {
      console.log('  ❌ Step 1 failed:', response1.status);
      return;
    }
    
    const data1 = await response1.json();
    console.log('  Action:', data1.action);
    console.log('  Query:', data1.query || '(none)');
    
    if (!data1.needsSecondStep) {
      console.log('  Response:', data1.initialMessage || '(empty)');
      return;
    }
    
    // Step 2
    const response2 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        step: 2,
        action: data1.action,
        query: data1.query
      })
    });
    
    if (!response2.ok) {
      console.log('  ❌ Step 2 failed:', response2.status);
      return;
    }
    
    const data2 = await response2.json();
    const reply = data2.reply || '(empty)';
    console.log('  Response:', reply.substring(0, 150) + (reply.length > 150 ? '...' : ''));
    
    // Analyze response
    const respLower = reply.toLowerCase();
    console.log('\n  Analysis:');
    console.log(`    Has "13"? ${respLower.includes('13') ? '✅' : '❌'}`);
    console.log(`    Has "25"? ${respLower.includes('25') ? '✅' : '❌'}`);
    console.log(`    Has "50만원"? ${respLower.includes('50만원') ? '✅' : '❌'}`);
    console.log(`    Has email? ${respLower.includes('chaos@sayberrygames.com') ? '✅' : '❌'}`);
    console.log(`    Starts with "네"? ${respLower.startsWith('네') ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🔥 LOCAL QUICK TEST\n');
  
  // Test critical cases
  const tests = [
    '세미나 몇 번?',
    '논문 몇 편?',
    '얼마?',
    '연락처?',
    '세미나 얼마고 몇 번?',
    '세미나 13회 맞아?',
    '논문 25편 맞죠?'
  ];
  
  for (const test of tests) {
    await testSingle(test);
    await new Promise(r => setTimeout(r, 2000)); // 2 second delay
  }
  
  console.log('\n✅ Test complete');
}

runTests().catch(console.error);