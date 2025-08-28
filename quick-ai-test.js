// Quick test for AI-driven improvements
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const BASE_URL = 'https://sangdon-park-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testQuery(query) {
  try {
    const cmd = `curl -s -X POST ${BASE_URL} -H "Content-Type: application/json" -d '{"message":"${query}","step":1,"history":[]}'`;
    const { stdout } = await execPromise(cmd);
    const step1 = JSON.parse(stdout);
    
    if (step1.needsSecondStep) {
      const cmd2 = `curl -s -X POST ${BASE_URL} -H "Content-Type: application/json" -d '{"message":"${query}","step":2,"history":[],"action":"${step1.action}","query":"${step1.query || ''}"}'`;
      const { stdout: stdout2 } = await execPromise(cmd2);
      const step2 = JSON.parse(stdout2);
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
    return { 
      query, 
      error: error.message 
    };
  }
}

async function runTests() {
  console.log('🚀 Quick AI Test - Testing key improvements\n');
  console.log('=' .repeat(60));
  
  const criticalTests = [
    // Contact queries
    { q: '연락처?', check: 'chaos@sayberrygames.com', type: 'contact' },
    { q: '이메일?', check: 'chaos@sayberrygames.com', type: 'contact' },
    
    // Confirmation queries
    { q: '세미나 13회 맞아?', check: '네', type: 'confirmation' },
    { q: '논문 25편 맞죠?', check: '네', type: 'confirmation' },
    
    // Compound queries
    { q: '세미나 얼마고 몇 번?', check: ['50만원', '13'], type: 'compound' },
    { q: '비용이랑 횟수?', check: ['50만원', '13'], type: 'compound' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of criticalTests) {
    const result = await testQuery(test.q);
    
    if (result.error) {
      console.log(`❌ "${test.q}"`);
      console.log(`   Error: ${result.error}`);
      failed++;
      continue;
    }
    
    let success = false;
    const response = result.response.toLowerCase();
    
    if (test.type === 'confirmation') {
      success = result.response.startsWith(test.check);
    } else if (test.type === 'compound') {
      success = test.check.every(c => response.includes(c.toLowerCase()));
    } else {
      success = response.includes(test.check.toLowerCase());
    }
    
    if (success) {
      console.log(`✅ "${test.q}" [${result.action}]`);
      passed++;
    } else {
      console.log(`❌ "${test.q}" [${result.action}]`);
      console.log(`   Response: "${result.response.substring(0, 80)}..."`);
      console.log(`   Expected: ${Array.isArray(test.check) ? test.check.join(', ') : test.check}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`Results: ${passed}/${criticalTests.length} passed (${Math.round(passed/criticalTests.length*100)}%)`);
  
  if (passed/criticalTests.length >= 0.9) {
    console.log('🎉 SUCCESS! 90%+ pass rate achieved!');
  } else {
    console.log('⚠️  Still needs improvement');
  }
}

runTests().catch(console.error);