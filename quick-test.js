// Quick test for critical cases
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

const CRITICAL_TESTS = [
  { query: '세미나 몇 번 했어?', shouldHave: '9', shouldNotHave: '25' },
  { query: '초청강연 총 몇 개야?', shouldHave: '9', shouldNotHave: '25' },
  { query: '논문 몇 편 썼어?', shouldHave: '25', shouldNotHave: '9' },
  { query: 'AI 세미나 얼마야?', shouldHave: '50만원', shouldNotHave: '5만원' },
  { query: '세미나 시간은?', shouldHave: '1시간 30분', shouldNotHave: null },
  { query: '최준균 교수님과 논문?', shouldHave: '최준균', shouldNotHave: null },
  { query: 'KAIST 세미나?', shouldHave: 'KAIST', shouldNotHave: null },
];

async function testQuery(test) {
  try {
    // Step 1
    const step1 = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.query, step: 1 })
    });
    const step1Data = await step1.json();
    
    let finalText = '';
    if (step1Data.action === 'SEARCH') {
      // Step 2
      const step2 = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || test.query
        })
      });
      const step2Data = await step2.json();
      finalText = (step2Data.reply || '') + ' ' + (step2Data.searchResults || []).join(' ');
    } else {
      finalText = step1Data.initialMessage || '';
    }
    
    const hasRequired = test.shouldHave ? finalText.includes(test.shouldHave) : true;
    const hasProhibited = test.shouldNotHave ? finalText.includes(test.shouldNotHave) : false;
    const passed = hasRequired && !hasProhibited;
    
    return {
      query: test.query,
      passed,
      response: finalText.substring(0, 100),
      hasRequired,
      hasProhibited
    };
  } catch (error) {
    return {
      query: test.query,
      passed: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Quick Critical Tests\n');
  
  let passCount = 0;
  for (const test of CRITICAL_TESTS) {
    const result = await testQuery(test);
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} "${test.query}"`);
    
    if (!result.passed) {
      if (!result.hasRequired) {
        console.log(`   Missing: "${test.shouldHave}"`);
      }
      if (result.hasProhibited) {
        console.log(`   Has prohibited: "${test.shouldNotHave}"`);
      }
      console.log(`   Response: ${result.response}...`);
    } else {
      passCount++;
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n${passCount}/${CRITICAL_TESTS.length} tests passed (${Math.round(passCount/CRITICAL_TESTS.length*100)}%)`);
}

runTests();