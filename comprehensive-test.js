// Comprehensive Test Suite - 50+ test cases
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';
const LOCAL_URL = 'http://localhost:8888/.netlify/functions/chat-ai-driven';

// Toggle between local and production
const TEST_URL = PROD_URL;

const COMPREHENSIVE_TESTS = [
  // === 세미나 비용 관련 (10 cases) ===
  { id: 'fee-1', query: 'AI 세미나 얼마야?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-2', query: '강연료 얼마 받아?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-3', query: '세미나 비용이 어떻게 돼?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-4', query: '강연 한번에 얼마?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-5', query: '초청강연료는?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-6', query: '세미나 시간은 얼마나?', expected: ['1시간 30분', '1.5시간'], category: '세미나비용' },
  { id: 'fee-7', query: '강연 시간이랑 비용은?', expected: ['50만원', '1시간 30분'], category: '세미나비용' },
  { id: 'fee-8', query: '1회 강연료?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-9', query: '세미나 페이는?', expected: ['50만원'], category: '세미나비용' },
  { id: 'fee-10', query: '강의료 얼마야?', expected: ['50만원'], category: '세미나비용' },

  // === 세미나 개수 (10 cases) ===
  { id: 'count-1', query: '세미나 몇 번 했어?', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-2', query: '초청강연 총 몇 개야?', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-3', query: '강연 횟수는?', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-4', query: '총 몇 번의 세미나?', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-5', query: '세미나 전부 몇 개?', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-6', query: '2023년부터 세미나 몇 번?', expected: ['9'], category: '세미나개수' },
  { id: 'count-7', query: '초청강연 리스트 보여줘', expected: ['9', 'KAIST', '부경대'], category: '세미나개수' },
  { id: 'count-8', query: '세미나 목록 전체', expected: ['9', 'KAIST', '부경대'], category: '세미나개수' },
  { id: 'count-9', query: '강연 전체 개수', expected: ['9'], notExpected: ['25'], category: '세미나개수' },
  { id: 'count-10', query: '세미나 통계', expected: ['9'], category: '세미나개수' },

  // === 대학별 세미나 (10 cases) ===
  { id: 'univ-1', query: 'KAIST에서 세미나 했어?', expected: ['KAIST', '디지털 트윈'], category: '대학세미나' },
  { id: 'univ-2', query: '부경대에서 강연했어?', expected: ['부경대', 'AI Agent'], category: '대학세미나' },
  { id: 'univ-3', query: '포항공대 세미나는?', expected: ['포항공대', '분산'], category: '대학세미나' },
  { id: 'univ-4', query: '충남대 세미나 뭐했어?', expected: ['충남대', 'AI교육'], category: '대학세미나' },
  { id: 'univ-5', query: '경북대 강연 주제는?', expected: ['경북대', '머신러닝'], category: '대학세미나' },
  { id: 'univ-6', query: '서강대에서 뭐 발표했어?', expected: ['서강대', '언어모델'], category: '대학세미나' },
  { id: 'univ-7', query: '성균관대 세미나?', expected: ['성균관대', 'AI', '윤리'], category: '대학세미나' },
  { id: 'univ-8', query: '연세대 강연 내용?', expected: ['연세대', '엣지컴퓨팅'], category: '대학세미나' },
  { id: 'univ-9', query: '어느 대학에서 세미나 했어?', expected: ['KAIST', '부경대'], category: '대학세미나' },
  { id: 'univ-10', query: '대학 세미나 목록', expected: ['KAIST', '부경대', '포항공대'], category: '대학세미나' },

  // === 논문 관련 (10 cases) ===
  { id: 'paper-1', query: '논문 몇 편 썼어?', expected: ['25'], notExpected: ['9'], category: '논문' },
  { id: 'paper-2', query: '총 논문 수는?', expected: ['25'], notExpected: ['9'], category: '논문' },
  { id: 'paper-3', query: '국제저널 논문 몇 개?', expected: ['25'], category: '논문' },
  { id: 'paper-4', query: 'IEEE 논문 몇 편?', expected: ['IEEE'], category: '논문' },
  { id: 'paper-5', query: '2024년 논문?', expected: ['2024', 'Real-Time'], category: '논문' },
  { id: 'paper-6', query: '최근 논문은?', expected: ['2024'], category: '논문' },
  { id: 'paper-7', query: '엣지컴퓨팅 논문?', expected: ['edge', 'computing'], category: '논문' },
  { id: 'paper-8', query: 'IoT 관련 논문?', expected: ['IoT'], category: '논문' },
  { id: 'paper-9', query: '1저자 논문 몇 편?', expected: ['1저자', '4'], category: '논문' },
  { id: 'paper-10', query: '교신저자 논문은?', expected: ['교신', '17'], category: '논문' },

  // === 공동연구자 (10 cases) ===
  { id: 'coauth-1', query: '황강욱 교수님과 쓴 논문?', expected: ['황강욱'], category: '공동연구' },
  { id: 'coauth-2', query: '최준균 교수님과 몇 편?', expected: ['최준균'], category: '공동연구' },
  { id: 'coauth-3', query: '이주형 교수님 공동연구?', expected: ['이주형'], category: '공동연구' },
  { id: 'coauth-4', query: '배소희와 쓴 논문?', expected: ['배소희'], category: '공동연구' },
  { id: 'coauth-5', query: '오현택과 공저?', expected: ['오현택'], category: '공동연구' },
  { id: 'coauth-6', query: '누구와 가장 많이 논문 썼어?', expected: ['최준균', '이주형'], category: '공동연구' },
  { id: 'coauth-7', query: '공동연구자 목록', expected: ['최준균', '이주형', '황강욱'], category: '공동연구' },
  { id: 'coauth-8', query: '한재섭과 논문?', expected: ['한재섭'], category: '공동연구' },
  { id: 'coauth-9', query: 'Yuyang Peng과 쓴 논문?', expected: ['Yuyang', 'Peng'], category: '공동연구' },
  { id: 'coauth-10', query: '주요 공동연구자는?', expected: ['최준균', '이주형'], category: '공동연구' },

  // === 연도별/시기별 (5 cases) ===
  { id: 'year-1', query: '2024년에 세미나 했어?', expected: ['2024', '5'], category: '연도별' },
  { id: 'year-2', query: '2025년 세미나?', expected: ['2025', 'KAIST', '부경대'], category: '연도별' },
  { id: 'year-3', query: '2023년 세미나는?', expected: ['2023', '포항공대', '연세대'], category: '연도별' },
  { id: 'year-4', query: '올해 세미나?', expected: ['2025'], category: '연도별' },
  { id: 'year-5', query: '작년 논문?', expected: ['2024'], category: '연도별' },

  // === 일반 대화 (5 cases) ===
  { id: 'chat-1', query: '안녕하세요', notExpected: ['논문', '세미나'], category: '인사' },
  { id: 'chat-2', query: '감사합니다', notExpected: ['논문', '세미나'], category: '인사' },
  { id: 'chat-3', query: '수고하셨습니다', notExpected: ['논문', '세미나'], category: '인사' },
  { id: 'chat-4', query: '반갑습니다', notExpected: ['논문', '세미나'], category: '인사' },
  { id: 'chat-5', query: '좋은 하루 되세요', notExpected: ['논문', '세미나'], category: '인사' },
];

// Test runner
async function runSingleTest(test) {
  try {
    // Step 1
    const step1Response = await fetch(TEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.query, step: 1 })
    });
    
    const step1Data = await step1Response.json();
    
    // Step 2 if SEARCH
    let finalResponse = '';
    let searchResults = [];
    
    if (step1Data.action === 'SEARCH') {
      const step2Response = await fetch(TEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || test.query
        })
      });
      
      const step2Data = await step2Response.json();
      finalResponse = step2Data.reply || '';
      searchResults = step2Data.searchResults || [];
    } else {
      finalResponse = step1Data.initialMessage || '';
    }
    
    // Combined text for checking
    const combinedText = finalResponse + ' ' + searchResults.join(' ');
    const combinedLower = combinedText.toLowerCase();
    
    // Check expected
    let passed = true;
    const results = { expected: [], notExpected: [] };
    
    if (test.expected) {
      for (const exp of test.expected) {
        const found = combinedLower.includes(exp.toLowerCase());
        results.expected.push({ keyword: exp, found });
        if (!found) passed = false;
      }
    }
    
    if (test.notExpected) {
      for (const notExp of test.notExpected) {
        const found = combinedLower.includes(notExp.toLowerCase());
        results.notExpected.push({ keyword: notExp, found });
        if (found) passed = false;
      }
    }
    
    return {
      ...test,
      passed,
      response: finalResponse.substring(0, 100),
      results
    };
    
  } catch (error) {
    return {
      ...test,
      passed: false,
      error: error.message
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log(`🚀 Running ${COMPREHENSIVE_TESTS.length} Comprehensive Tests`);
  console.log(`URL: ${TEST_URL}`);
  console.log('='.repeat(80));
  
  const results = [];
  let currentCategory = '';
  
  for (const test of COMPREHENSIVE_TESTS) {
    if (test.category !== currentCategory) {
      currentCategory = test.category;
      console.log(`\n📁 ${currentCategory}`);
      console.log('-'.repeat(40));
    }
    
    const result = await runSingleTest(test);
    results.push(result);
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} [${test.id}] ${test.query.substring(0, 30)}...`);
    
    if (!result.passed && result.results) {
      if (result.results.expected) {
        result.results.expected.filter(r => !r.found).forEach(r => {
          console.log(`   Missing: "${r.keyword}"`);
        });
      }
      if (result.results.notExpected) {
        result.results.notExpected.filter(r => r.found).forEach(r => {
          console.log(`   Should not have: "${r.keyword}"`);
        });
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const successRate = ((passed / results.length) * 100).toFixed(1);
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  
  // By category
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { passed: 0, failed: 0, tests: [] };
    }
    if (r.passed) {
      byCategory[r.category].passed++;
    } else {
      byCategory[r.category].failed++;
      byCategory[r.category].tests.push(r.id);
    }
  });
  
  console.log('\nBy Category:');
  Object.entries(byCategory).forEach(([cat, stats]) => {
    const catRate = ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(0);
    const icon = stats.failed === 0 ? '✅' : catRate >= 80 ? '⚠️' : '❌';
    console.log(`${icon} ${cat}: ${catRate}% (${stats.passed}/${stats.passed + stats.failed})`);
    if (stats.failed > 0) {
      console.log(`   Failed: ${stats.tests.join(', ')}`);
    }
  });
  
  // Save results
  require('fs').writeFileSync(
    'comprehensive-test-results.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      url: TEST_URL,
      summary: { total: results.length, passed, failed, successRate },
      byCategory,
      failedTests: results.filter(r => !r.passed).map(r => ({ id: r.id, query: r.query }))
    }, null, 2)
  );
  
  console.log('\n' + (successRate === '100.0' ? '🎉 PERFECT SCORE!' : successRate >= 90 ? '🏆 EXCELLENT!' : successRate >= 80 ? '👍 GOOD!' : '⚠️ NEEDS IMPROVEMENT'));
}

// Run
runAllTests().catch(console.error);