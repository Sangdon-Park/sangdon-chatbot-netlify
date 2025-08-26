// Production Site Test Suite
const fetch = require('node-fetch');

// Production URL
const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Comprehensive test cases
const TEST_CASES = [
  // 세미나 비용 관련
  {
    id: 'fee-1',
    query: 'AI 세미나 얼마야?',
    shouldContain: ['50만원', '500000'],
    shouldNotContain: ['5만원', '50000'],
    category: '세미나 비용'
  },
  {
    id: 'fee-2',
    query: '강연료 얼마 받아?',
    shouldContain: ['50만원', '500000'],
    shouldNotContain: ['5만원', '50000'],
    category: '세미나 비용'
  },
  {
    id: 'fee-3',
    query: '세미나 비용이 어떻게 돼?',
    shouldContain: ['50만원', '500000'],
    shouldNotContain: ['5만원', '50000'],
    category: '세미나 비용'
  },
  
  // 세미나 개수
  {
    id: 'count-1',
    query: '세미나 몇 번 했어?',
    shouldContain: ['9', '아홉'],
    category: '세미나 개수'
  },
  {
    id: 'count-2',
    query: '초청강연 총 몇 개야?',
    shouldContain: ['9', '아홉'],
    category: '세미나 개수'
  },
  
  // 특정 대학 세미나
  {
    id: 'univ-1',
    query: 'KAIST에서 세미나 했어?',
    shouldContain: ['KAIST', '디지털', '트윈'],
    category: '대학별 세미나'
  },
  {
    id: 'univ-2',
    query: '부경대에서 강연했어?',
    shouldContain: ['부경대', 'AI Agent'],
    category: '대학별 세미나'
  },
  {
    id: 'univ-3',
    query: '포항공대 세미나는?',
    shouldContain: ['포항공대', '분산'],
    category: '대학별 세미나'
  },
  
  // 논문 관련
  {
    id: 'paper-1',
    query: '논문 몇 편 썼어?',
    shouldContain: ['25'],
    category: '논문 개수'
  },
  {
    id: 'paper-2',
    query: '황강욱 교수님과 쓴 논문은?',
    shouldContain: ['황강욱'],
    category: '공동연구'
  },
  {
    id: 'paper-3',
    query: '최준균 교수님과 몇 편 썼어?',
    shouldContain: ['최준균'],
    category: '공동연구'
  },
  
  // 최근 활동
  {
    id: 'recent-1',
    query: '최근 세미나는 뭐야?',
    shouldContain: ['2025', '부경대'],
    category: '최근 활동'
  },
  {
    id: 'recent-2',
    query: '2024년에 세미나 했어?',
    shouldContain: ['2024'],
    category: '연도별 활동'
  },
  
  // 일반 대화
  {
    id: 'chat-1',
    query: '안녕하세요',
    shouldNotContain: ['논문', '세미나'],
    category: '인사'
  },
  {
    id: 'chat-2',
    query: '감사합니다',
    shouldNotContain: ['논문', '세미나'],
    category: '인사'
  }
];

// Test runner
async function runTest(testCase) {
  console.log(`\n[${testCase.id}] ${testCase.category}: "${testCase.query}"`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Intent classification
    const step1Response = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.query,
        step: 1
      })
    });
    
    if (!step1Response.ok) {
      console.error(`❌ Step 1 failed: ${step1Response.status}`);
      return false;
    }
    
    const step1Data = await step1Response.json();
    console.log(`Step 1: Action=${step1Data.action}, Query="${step1Data.query || ''}"`);
    
    // If it's a SEARCH, proceed to Step 2
    if (step1Data.action === 'SEARCH') {
      const step2Response = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testCase.query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || testCase.query
        })
      });
      
      if (!step2Response.ok) {
        console.error(`❌ Step 2 failed: ${step2Response.status}`);
        return false;
      }
      
      const step2Data = await step2Response.json();
      const reply = step2Data.reply || '';
      console.log(`\nReply: ${reply}`);
      
      // Check search results
      if (step2Data.searchResults && step2Data.searchResults.length > 0) {
        console.log(`\nSearch Results (${step2Data.searchResults.length}):`);
        step2Data.searchResults.slice(0, 3).forEach(r => console.log(`  - ${r}`));
      }
      
      // Validate response
      let passed = true;
      
      // Check shouldContain
      if (testCase.shouldContain) {
        for (const keyword of testCase.shouldContain) {
          const found = reply.toLowerCase().includes(keyword.toLowerCase()) ||
                       (step2Data.searchResults && 
                        step2Data.searchResults.some(r => r.toLowerCase().includes(keyword.toLowerCase())));
          if (found) {
            console.log(`✅ Contains "${keyword}"`);
          } else {
            console.log(`❌ Missing "${keyword}"`);
            passed = false;
          }
        }
      }
      
      // Check shouldNotContain
      if (testCase.shouldNotContain) {
        for (const keyword of testCase.shouldNotContain) {
          const found = reply.toLowerCase().includes(keyword.toLowerCase());
          if (!found) {
            console.log(`✅ Does not contain "${keyword}"`);
          } else {
            console.log(`❌ Should not contain "${keyword}"`);
            passed = false;
          }
        }
      }
      
      return passed;
      
    } else if (step1Data.action === 'CHAT') {
      const reply = step1Data.initialMessage || '';
      console.log(`\nReply: ${reply}`);
      
      // Validate CHAT response
      let passed = true;
      if (testCase.shouldNotContain) {
        for (const keyword of testCase.shouldNotContain) {
          const found = reply.toLowerCase().includes(keyword.toLowerCase());
          if (!found) {
            console.log(`✅ Does not contain "${keyword}"`);
          } else {
            console.log(`❌ Should not contain "${keyword}"`);
            passed = false;
          }
        }
      }
      return passed;
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Testing Production Site');
  console.log('URL:', PROD_URL);
  console.log('='.repeat(80));
  
  const results = [];
  const startTime = Date.now();
  
  for (const testCase of TEST_CASES) {
    const passed = await runTest(testCase);
    results.push({
      ...testCase,
      passed
    });
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Duration: ${duration}s`);
  
  // Group results by category
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { passed: 0, failed: 0 };
    }
    if (r.passed) {
      byCategory[r.category].passed++;
    } else {
      byCategory[r.category].failed++;
    }
  });
  
  console.log('\nBy Category:');
  Object.entries(byCategory).forEach(([cat, stats]) => {
    const icon = stats.failed === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${cat}: ${stats.passed}/${stats.passed + stats.failed} passed`);
  });
  
  // List failed tests
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [${r.id}] ${r.category}: "${r.query}"`);
    });
  }
  
  console.log('\n' + (passed === TEST_CASES.length ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
  
  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    url: PROD_URL,
    summary: {
      total: TEST_CASES.length,
      passed,
      failed,
      duration: `${duration}s`
    },
    byCategory,
    results: results.map(r => ({
      id: r.id,
      category: r.category,
      query: r.query,
      passed: r.passed
    }))
  };
  
  require('fs').writeFileSync(
    'test-results.json',
    JSON.stringify(report, null, 2)
  );
  console.log('\n📄 Results saved to test-results.json');
}

// Run tests
runAllTests().catch(console.error);