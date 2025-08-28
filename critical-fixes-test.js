// Critical Fixes Validation Test
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 })
    });
    
    if (!response1.ok) return null;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, step: 2,
          action: data1.action, query: data1.query
        })
      });
      
      if (!response2.ok) return null;
      const data2 = await response2.json();
      return data2.reply;
    }
    
    return data1.initialMessage;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function test() {
  console.log('🔧 Critical Fixes Test\n');
  
  const tests = [
    // Contact issues (was 43% failure)
    { q: "연락처?", must: ["chaos@sayberrygames.com"] },
    { q: "신청은 어떻게?", must: ["chaos@sayberrygames.com"] },
    { q: "어디로 연락?", must: ["chaos@sayberrygames.com"] },
    
    // Confirmation questions
    { q: "세미나 13회 맞아?", must: ["네", "13"] },
    { q: "논문 25편 맞죠?", must: ["네", "25"] },
    { q: "시간당 50만원 맞지?", must: ["네", "50만원"] },
    
    // Compound questions (was 20% failure)
    { q: "세미나 얼마고 몇 번 했어?", must: ["50만원", "13"] },
    { q: "비용이랑 연락처 알려줘", must: ["50만원", "chaos@sayberrygames.com"] },
    { q: "가격하고 시간은?", must: ["50만원", "시간"] },
    
    // Short context questions
    { q: "얼마?", must: ["50만원"] },
    { q: "가격이 어떻게 돼?", must: ["50만원"] },
    { q: "How much?", must: ["50"] }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Testing: "${test.q}" ... `);
    const response = await chat(test.q);
    
    if (!response) {
      console.log('❌ No response');
      failed++;
      continue;
    }
    
    const respLower = response.toLowerCase();
    let success = true;
    const missing = [];
    
    for (const keyword of test.must) {
      if (!respLower.includes(keyword.toLowerCase())) {
        success = false;
        missing.push(keyword);
      }
    }
    
    if (success) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log(`❌ FAIL - Missing: ${missing.join(', ')}`);
      console.log(`   Response: ${response.substring(0, 80)}...`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed}/${tests.length} passed (${Math.round(passed/tests.length*100)}%)`);
  
  if (passed === tests.length) {
    console.log('🎉 All critical issues fixed!');
  } else if (passed >= tests.length * 0.9) {
    console.log('✨ Major improvement achieved!');
  } else {
    console.log('⚠️ More work needed');
  }
}

console.log('Starting critical fixes test...\n');
test().catch(console.error);