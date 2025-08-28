// Single Quick Test
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message) {
  console.log(`\n🔍 Testing: "${message}"`);
  
  try {
    // Step 1
    console.log('  Step 1: Sending initial request...');
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 }),
      timeout: 10000
    });
    
    console.log('  Step 1 Status:', response1.status);
    if (!response1.ok) {
      console.log('  ❌ Step 1 failed');
      return null;
    }
    
    const data1 = await response1.json();
    console.log('  Step 1 Action:', data1.action);
    console.log('  Step 1 Query:', data1.query);
    
    if (data1.needsSecondStep) {
      console.log('  Step 2: Sending follow-up request...');
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, 
          step: 2,
          action: data1.action, 
          query: data1.query
        }),
        timeout: 10000
      });
      
      console.log('  Step 2 Status:', response2.status);
      if (!response2.ok) {
        console.log('  ❌ Step 2 failed');
        return null;
      }
      
      const data2 = await response2.json();
      console.log('  ✅ Got reply:', data2.reply?.substring(0, 100) + '...');
      return data2.reply;
    }
    
    console.log('  ✅ Got direct reply:', data1.initialMessage?.substring(0, 100) + '...');
    return data1.initialMessage;
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    return null;
  }
}

// Test each case individually
async function testOne(q, must) {
  const response = await chat(q);
  
  if (!response) {
    console.log('  🚫 NO RESPONSE');
    return false;
  }
  
  const respLower = response.toLowerCase();
  let success = true;
  
  for (const keyword of must) {
    if (!respLower.includes(keyword.toLowerCase())) {
      console.log(`  ❌ Missing: "${keyword}"`);
      success = false;
    } else {
      console.log(`  ✓ Found: "${keyword}"`);
    }
  }
  
  return success;
}

async function main() {
  console.log('Testing critical cases one by one:\n');
  
  // Test 1: Simple contact
  await testOne("연락처?", ["chaos@sayberrygames.com"]);
  
  // Wait between tests to avoid rate limiting
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: Confirmation
  await testOne("세미나 13회 맞아?", ["13"]);
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 3: Compound
  await testOne("세미나 얼마고 몇 번?", ["50만원", "13"]);
}

main().catch(console.error);