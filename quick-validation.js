// ⚡ QUICK VALIDATION TEST - 핵심 기능 빠른 검증
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 }),
      timeout: 10000
    });
    
    if (!response1.ok) return null;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, step: 2,
          action: data1.action, 
          query: data1.query
        }),
        timeout: 10000
      });
      
      if (!response2.ok) return null;
      const data2 = await response2.json();
      return data2.reply;
    }
    
    return data1.initialMessage;
  } catch (error) {
    return null;
  }
}

// 핵심 테스트 케이스만
const CRITICAL_TESTS = [
  // 기본 정확도
  { q: '세미나 몇 번?', must: ['13'], mustNot: ['25'], name: 'Seminar Count' },
  { q: '논문 몇 편?', must: ['25'], mustNot: ['13'], name: 'Paper Count' },
  { q: '얼마?', must: ['50만원'], name: 'Price Short' },
  { q: '연락처?', must: ['chaos@sayberrygames.com'], name: 'Contact Short' },
  
  // 복합 질문
  { q: '세미나 얼마고 몇 번?', must: ['50만원', '13'], name: 'Compound Price+Count' },
  { q: '비용이랑 연락처?', must: ['50만원', 'chaos@sayberrygames.com'], name: 'Compound Price+Email' },
  
  // 확인 질문
  { q: '세미나 13회 맞아?', must: ['13'], shouldStart: ['네', '맞'], name: 'Confirmation 13' },
  { q: '논문 25편 맞죠?', must: ['25'], shouldStart: ['네', '맞'], name: 'Confirmation 25' },
  
  // 날짜 혼동 방지
  { q: '경상국립대 8월 25일인데', mustNot: ['25편', '논문'], name: 'Date Not Papers' },
  
  // 학력
  { q: '어디 졸업?', must: ['KAIST'], name: 'Education' }
];

async function runQuickTest() {
  console.log('⚡ QUICK VALIDATION TEST\n');
  console.log('Testing 10 critical functions...\n');
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const test of CRITICAL_TESTS) {
    process.stdout.write(`Testing: ${test.name.padEnd(20)} ... `);
    
    const response = await chat(test.q);
    
    if (!response) {
      console.log('❌ NO RESPONSE');
      failed++;
      failures.push({ test: test.name, issue: 'No response' });
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }
    
    const respLower = response.toLowerCase();
    let success = true;
    const issues = [];
    
    // Check required keywords
    if (test.must) {
      for (const keyword of test.must) {
        if (!respLower.includes(keyword.toLowerCase())) {
          success = false;
          issues.push(`Missing: "${keyword}"`);
        }
      }
    }
    
    // Check forbidden keywords
    if (test.mustNot) {
      for (const keyword of test.mustNot) {
        if (respLower.includes(keyword.toLowerCase())) {
          success = false;
          issues.push(`Has forbidden: "${keyword}"`);
        }
      }
    }
    
    // Check if should start with certain words
    if (test.shouldStart) {
      let startsCorrectly = false;
      for (const start of test.shouldStart) {
        if (respLower.startsWith(start.toLowerCase())) {
          startsCorrectly = true;
          break;
        }
      }
      if (!startsCorrectly) {
        success = false;
        issues.push(`Should start with: ${test.shouldStart.join(' or ')}`);
      }
    }
    
    if (success) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      console.log(`    Issues: ${issues.join(', ')}`);
      console.log(`    Response: "${response.substring(0, 80)}..."`);
      failed++;
      failures.push({ test: test.name, issues, response: response.substring(0, 100) });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  const passRate = Math.round((passed / CRITICAL_TESTS.length) * 100);
  
  console.log(`Results: ${passed}/${CRITICAL_TESTS.length} passed (${passRate}%)\n`);
  
  if (passRate === 100) {
    console.log('🏆 PERFECT! All critical tests passed!');
  } else if (passRate >= 90) {
    console.log('🎉 Excellent! Almost perfect.');
  } else if (passRate >= 80) {
    console.log('✨ Good, but needs minor fixes.');
  } else if (passRate >= 70) {
    console.log('⚠️ Acceptable, but issues remain.');
  } else {
    console.log('❌ Major problems detected!');
  }
  
  if (failures.length > 0) {
    console.log('\n🔴 Failed Tests:');
    for (const failure of failures) {
      console.log(`  - ${failure.test}: ${failure.issues ? failure.issues.join(', ') : failure.issue}`);
    }
  }
  
  return passRate;
}

// Run test
console.log('Starting quick validation...\n');
runQuickTest()
  .then(passRate => {
    if (passRate < 70) {
      console.log('\n⚠️ Critical issues detected. Run full test suite for details.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });