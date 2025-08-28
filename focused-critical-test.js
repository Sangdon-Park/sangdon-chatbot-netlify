// 🎯 FOCUSED CRITICAL TEST - 핵심 문제 집중 테스트
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 })
    });
    
    if (!response1.ok) return { error: `Step1 HTTP ${response1.status}` };
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
      
      if (!response2.ok) return { error: `Step2 HTTP ${response2.status}` };
      const data2 = await response2.json();
      return { response: data2.reply, action: data1.action, query: data1.query };
    }
    
    return { response: data1.initialMessage, action: data1.action };
  } catch (error) {
    return { error: error.message };
  }
}

const CRITICAL_TESTS = [
  // 문제 1: 연락처가 CHAT으로 분류되어 응답 없음
  {
    category: '❌ ISSUE 1: Contact returns empty',
    tests: [
      { q: '연락처?', must: ['chaos@sayberrygames.com'], expectedAction: 'SEARCH' },
      { q: '이메일?', must: ['chaos@sayberrygames.com'], expectedAction: 'SEARCH' },
      { q: '신청은?', must: ['chaos@sayberrygames.com'], expectedAction: 'SEARCH' },
      { q: '어디로 연락?', must: ['chaos@sayberrygames.com'], expectedAction: 'SEARCH' },
      { q: '연락처 알려줘', must: ['chaos@sayberrygames.com'], expectedAction: 'SEARCH' }
    ]
  },
  
  // 문제 2: 복합 질문에서 가격 누락
  {
    category: '❌ ISSUE 2: Compound missing price',
    tests: [
      { q: '세미나 얼마고 몇 번?', must: ['50만원', '13'], mustNot: ['25'] },
      { q: '얼마고 몇번?', must: ['50만원', '13'] },
      { q: '비용이랑 횟수?', must: ['50만원', '13'] },
      { q: '가격하고 시간?', must: ['50만원', '시간'] },
      { q: '세미나 비용 횟수?', must: ['50만원', '13'] }
    ]
  },
  
  // 문제 3: 확인 질문이 "네"로 시작 안함
  {
    category: '❌ ISSUE 3: Confirmation not starting with 네',
    tests: [
      { q: '세미나 13회 맞아?', must: ['13'], startsWith: '네' },
      { q: '논문 25편 맞죠?', must: ['25'], startsWith: '네' },
      { q: '50만원 맞지?', must: ['50만원'], startsWith: '네' },
      { q: '13회 맞나요?', must: ['13'], startsWith: '네' },
      { q: 'KAIST 맞습니까?', must: ['KAIST'], startsWith: '네' }
    ]
  },
  
  // 작동하는 것들 확인
  {
    category: '✅ Working correctly',
    tests: [
      { q: '세미나 몇 번?', must: ['13'], mustNot: ['25'] },
      { q: '논문 몇 편?', must: ['25'], mustNot: ['13'] },
      { q: '얼마?', must: ['50만원'] },
      { q: '비용?', must: ['50만원'] },
      { q: '어디 졸업?', must: ['KAIST'] }
    ]
  }
];

async function runFocusedTest() {
  console.log('🎯 FOCUSED CRITICAL TEST');
  console.log('=' .repeat(70));
  console.log('핵심 문제들을 집중적으로 테스트합니다.\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    issues: {
      contact_empty: 0,
      compound_missing_price: 0,
      confirmation_no_ne: 0
    }
  };
  
  for (const category of CRITICAL_TESTS) {
    console.log(`\n${category.category}`);
    console.log('-'.repeat(60));
    
    let categoryPassed = 0;
    let categoryFailed = 0;
    
    for (const test of category.tests) {
      results.total++;
      
      process.stdout.write(`  "${test.q}"`);
      
      const result = await chat(test.q);
      
      // Check for errors
      if (result.error) {
        console.log(` → ❌ ERROR: ${result.error}`);
        results.failed++;
        categoryFailed++;
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      
      // Log action and query for debugging
      console.log(` [${result.action}]`);
      if (result.query) {
        console.log(`     Query: "${result.query}"`);
      }
      
      const response = result.response || '';
      const respLower = response.toLowerCase();
      
      let passed = true;
      const issues = [];
      
      // Check response exists
      if (!response) {
        passed = false;
        issues.push('Empty response');
        if (test.q.includes('연락처') || test.q.includes('이메일')) {
          results.issues.contact_empty++;
        }
      }
      
      // Check must have
      if (test.must) {
        for (const keyword of test.must) {
          if (!respLower.includes(keyword.toLowerCase())) {
            passed = false;
            issues.push(`Missing: "${keyword}"`);
            
            // Track specific issues
            if (keyword === '50만원' && test.q.includes('얼마') && test.q.includes('몇')) {
              results.issues.compound_missing_price++;
            }
          }
        }
      }
      
      // Check must not have
      if (test.mustNot) {
        for (const keyword of test.mustNot) {
          if (respLower.includes(keyword.toLowerCase())) {
            passed = false;
            issues.push(`Has forbidden: "${keyword}"`);
          }
        }
      }
      
      // Check starts with
      if (test.startsWith && !respLower.startsWith(test.startsWith.toLowerCase())) {
        passed = false;
        issues.push(`Should start with: "${test.startsWith}"`);
        if (test.q.includes('맞')) {
          results.issues.confirmation_no_ne++;
        }
      }
      
      // Check expected action
      if (test.expectedAction && result.action !== test.expectedAction) {
        issues.push(`Wrong action: expected ${test.expectedAction}, got ${result.action}`);
      }
      
      if (passed) {
        console.log(`     ✅ Response: "${response.substring(0, 80)}..."`);
        results.passed++;
        categoryPassed++;
      } else {
        console.log(`     ❌ Response: "${response.substring(0, 80)}..."`);
        for (const issue of issues) {
          console.log(`     └─ ${issue}`);
        }
        results.failed++;
        categoryFailed++;
      }
      
      await new Promise(r => setTimeout(r, 1500));
    }
    
    const categoryRate = Math.round((categoryPassed / category.tests.length) * 100);
    console.log(`\n  📊 Category result: ${categoryPassed}/${category.tests.length} (${categoryRate}%)`);
  }
  
  // Final report
  const passRate = Math.round((results.passed / results.total) * 100);
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 FOCUSED TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log(`\n📈 Overall:`);
  console.log(`  Total: ${results.total}`);
  console.log(`  Passed: ${results.passed} ✅`);
  console.log(`  Failed: ${results.failed} ❌`);
  console.log(`  Pass Rate: ${passRate}%`);
  
  console.log(`\n❌ Specific Issues:`);
  console.log(`  Contact returns empty: ${results.issues.contact_empty} times`);
  console.log(`  Compound missing price: ${results.issues.compound_missing_price} times`);
  console.log(`  Confirmation missing 네: ${results.issues.confirmation_no_ne} times`);
  
  console.log('\n' + '='.repeat(70));
  if (passRate >= 90) {
    console.log('🎉 Excellent! Major issues resolved!');
  } else if (passRate >= 70) {
    console.log('✨ Good progress, but critical issues remain.');
  } else if (passRate >= 50) {
    console.log('⚠️ Significant problems detected.');
  } else {
    console.log('💀 Critical failures! Immediate fixes needed.');
  }
}

console.log('🚀 Starting Focused Critical Test...\n');
runFocusedTest().catch(console.error);