// Local test
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8889/.netlify/functions/chat-ai-driven';

async function testQuery(query) {
  try {
    // Step 1
    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, step: 1, history: [] })
    });
    const step1 = await res1.json();
    
    if (step1.needsSecondStep) {
      // Step 2
      const res2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query, 
          step: 2, 
          history: [],
          action: step1.action,
          query: step1.query || ''
        })
      });
      const step2 = await res2.json();
      return { 
        query, 
        action: step1.action,
        response: step2.reply || ''
      };
    } else {
      return { 
        query, 
        action: 'CHAT',
        response: step1.initialMessage || ''
      };
    }
  } catch (error) {
    return { query, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 LOCAL TEST - Testing AI improvements\n');
  
  const tests = [
    // Critical tests
    { q: '연락처?', check: 'chaos@sayberrygames.com' },
    { q: '세미나 13회 맞아?', check: '네' },
    { q: '세미나 얼마고 몇 번?', check: ['50만원', '13'] },
  ];
  
  for (const test of tests) {
    const result = await testQuery(test.q);
    
    if (result.error) {
      console.log(`❌ "${test.q}" - Error: ${result.error}`);
      continue;
    }
    
    const response = result.response.toLowerCase();
    let success = false;
    
    if (Array.isArray(test.check)) {
      success = test.check.every(c => response.includes(c.toLowerCase()));
    } else if (test.check === '네') {
      success = result.response.startsWith(test.check);
    } else {
      success = response.includes(test.check.toLowerCase());
    }
    
    if (success) {
      console.log(`✅ "${test.q}" [${result.action}]`);
    } else {
      console.log(`❌ "${test.q}" [${result.action}]`);
      console.log(`   Response: "${result.response.substring(0, 80)}..."`);
    }
  }
}

runTests().catch(console.error);