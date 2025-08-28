// Comprehensive local test
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8891/.netlify/functions/chat-ai-driven';

async function testQuery(query) {
  try {
    console.log(`\nTesting: "${query}"`);
    
    // Step 1
    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, step: 1, history: [] })
    });
    const step1 = await res1.json();
    console.log(`  Step 1 - Action: ${step1.action || 'unknown'}, Query: ${step1.query || 'none'}`);
    
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
      console.log(`  Step 2 - Response: "${(step2.reply || '').substring(0, 100)}..."`);
      
      return { 
        query, 
        action: step1.action,
        searchQuery: step1.query,
        response: step2.reply || '',
        searchResults: step2.searchResults
      };
    } else {
      console.log(`  CHAT Response: "${(step1.initialMessage || '').substring(0, 100)}..."`);
      return { 
        query, 
        action: 'CHAT',
        response: step1.initialMessage || ''
      };
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return { query, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 COMPREHENSIVE LOCAL TEST\n');
  console.log('=' .repeat(60));
  
  const tests = [
    // Contact queries
    '연락처?',
    '이메일 알려줘',
    '세미나 신청 어떻게?',
    
    // Confirmation queries  
    '세미나 13회 맞아?',
    '논문 25편 맞죠?',
    
    // Compound queries
    '세미나 얼마고 몇 번?',
    '비용이랑 횟수?',
    
    // Simple queries
    '세미나 몇 번 했어?',
    '논문 몇 편?',
    '얼마야?',
    
    // Greetings
    '안녕하세요',
    
    // Education
    '어디 졸업했어?',
    'KAIST 나왔어?'
  ];
  
  let searchCount = 0;
  let chatCount = 0;
  let correctResponses = 0;
  
  for (const test of tests) {
    const result = await testQuery(test);
    
    if (result.action === 'SEARCH') searchCount++;
    else if (result.action === 'CHAT') chatCount++;
    
    // Check if response is appropriate
    const response = result.response.toLowerCase();
    let isCorrect = false;
    
    if (test.includes('연락처') || test.includes('이메일') || test.includes('신청')) {
      isCorrect = response.includes('chaos@sayberrygames.com');
    } else if (test.includes('맞아') || test.includes('맞죠') || test.includes('맞지')) {
      isCorrect = result.response.startsWith('네');
    } else if (test.includes('얼마') && test.includes('몇')) {
      isCorrect = response.includes('50만원') && response.includes('13');
    } else if (test === '안녕하세요') {
      isCorrect = result.action === 'CHAT';
    } else if (test.includes('졸업') || test.includes('KAIST')) {
      isCorrect = response.includes('kaist');
    } else {
      isCorrect = result.response.length > 10; // Has some response
    }
    
    if (isCorrect) {
      console.log(`  ✅ Response seems correct`);
      correctResponses++;
    } else {
      console.log(`  ❌ Response seems incorrect`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('SUMMARY:');
  console.log(`  Total tests: ${tests.length}`);
  console.log(`  SEARCH actions: ${searchCount}`);
  console.log(`  CHAT actions: ${chatCount}`);
  console.log(`  Correct responses: ${correctResponses}/${tests.length} (${Math.round(correctResponses/tests.length*100)}%)`);
  
  if (correctResponses/tests.length >= 0.9) {
    console.log('\n🎉 SUCCESS! 90%+ accuracy achieved!');
  } else {
    console.log('\n⚠️  Needs improvement for 90% target');
  }
}

runTests().catch(console.error);