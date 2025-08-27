// Comprehensive QA Test Suite
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Critical test cases that MUST pass
const CRITICAL_TESTS = [
  {
    query: 'AI 세미나에 대해 물어볼 게 있습니다.',
    expectedKeywords: ['세미나', 'AI'],
    notExpected: ['논문', '공동연구자', '저자'],
    category: '세미나 일반'
  },
  {
    query: '1회당 얼마죠?',
    expectedKeywords: ['50만원', '1시간 30분'],
    notExpected: ['논문'],
    category: '세미나 비용',
    mustInclude: '50만원'
  },
  {
    query: 'AI 세미나 얼마야?',
    expectedKeywords: ['50만원', '1시간 30분'],
    notExpected: ['논문'],
    category: '세미나 비용 직접',
    mustInclude: '50만원'
  },
  {
    query: '세미나 강연료가 얼마인가요?',
    expectedKeywords: ['50만원'],
    notExpected: ['논문'],
    category: '강연료',
    mustInclude: '50만원'
  },
  {
    query: '세미나 몇 번 했어?',
    expectedKeywords: ['13'],
    notExpected: ['25', '논문'],
    category: '세미나 개수',
    mustInclude: '13'
  },
  {
    query: '논문 몇 편 썼어?',
    expectedKeywords: ['25'],
    notExpected: ['13', '세미나'],
    category: '논문 개수',
    mustInclude: '25'
  },
  {
    query: '고려대에서 뭐 발표했어?',
    expectedKeywords: ['고려대', '화공생명'],
    notExpected: ['예정', '할 예정'],
    category: '고려대 세미나'
  },
  {
    query: '경상국립대 세미나는 언제야?',
    expectedKeywords: ['경상국립대', '8월 25일'],
    notExpected: ['예정'],
    category: '경상국립대 세미나'
  },
  {
    query: '황강욱 교수님과 쓴 논문?',
    expectedKeywords: ['황강욱'],
    notExpected: ['세미나'],
    category: '공동연구자'
  },
  {
    query: 'KAIST에서 세미나 했어?',
    expectedKeywords: ['KAIST'],
    notExpected: ['안 했', '없'],
    category: 'KAIST 세미나'
  }
];

// Additional QA tests
const ADDITIONAL_TESTS = [
  { query: '안녕하세요', category: '인사' },
  { query: '최근 논문 뭐 썼어?', category: '논문' },
  { query: '부경대 세미나는?', category: '대학별 세미나' },
  { query: 'AI 세미나 시간은?', category: '세미나 시간' },
  { query: '세미나 비용이 어떻게 되나요?', category: '세미나 비용' },
  { query: '초청강연 횟수?', category: '초청강연' },
  { query: 'BIEN 컨퍼런스에서 뭐 발표했어?', category: 'BIEN' },
  { query: '전북대 세미나는?', category: '전북대' },
  { query: '가장 많이 논문 쓴 사람?', category: '공동연구자' }
];

async function testQuestion(test) {
  console.log(`\n📝 테스트: "${test.query}" [${test.category}]`);
  
  try {
    // Step 1
    const step1Res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.query, step: 1 })
    });
    const step1Data = await step1Res.json();
    
    // Step 2 if needed
    let reply = '';
    let searchResults = [];
    
    if (step1Data.action === 'SEARCH') {
      const step2Res = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || test.query
        })
      });
      const step2Data = await step2Res.json();
      reply = step2Data.reply || '';
      searchResults = step2Data.searchResults || [];
    } else {
      reply = step1Data.initialMessage || '';
    }
    
    // Check results
    const issues = [];
    
    // Check for must include keywords
    if (test.mustInclude && !reply.includes(test.mustInclude)) {
      issues.push(`❌ 필수 키워드 누락: "${test.mustInclude}"`);
    }
    
    // Check for expected keywords
    if (test.expectedKeywords) {
      for (const keyword of test.expectedKeywords) {
        if (!reply.toLowerCase().includes(keyword.toLowerCase())) {
          issues.push(`⚠️ 예상 키워드 누락: "${keyword}"`);
        }
      }
    }
    
    // Check for unexpected keywords
    if (test.notExpected) {
      for (const keyword of test.notExpected) {
        if (reply.toLowerCase().includes(keyword.toLowerCase())) {
          issues.push(`❌ 예상치 못한 키워드: "${keyword}"`);
        }
      }
    }
    
    // Display results
    if (searchResults.length > 0) {
      console.log('📚 검색 결과:');
      searchResults.slice(0, 3).forEach(r => console.log(`  • ${r}`));
    }
    
    console.log('💬 응답:', reply.substring(0, 150) + (reply.length > 150 ? '...' : ''));
    
    if (issues.length === 0) {
      console.log('✅ PASS');
    } else {
      console.log('❌ ISSUES:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return {
      query: test.query,
      category: test.category,
      passed: issues.length === 0,
      issues,
      reply
    };
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    return {
      query: test.query,
      category: test.category,
      passed: false,
      issues: [`Error: ${error.message}`]
    };
  }
}

async function runAllTests() {
  console.log('🎯 종합 QA 테스트 시작\n');
  console.log('=' .repeat(60));
  
  // Run critical tests
  console.log('\n🔥 CRITICAL TESTS (반드시 통과해야 함)');
  console.log('=' .repeat(60));
  
  const criticalResults = [];
  for (const test of CRITICAL_TESTS) {
    const result = await testQuestion(test);
    criticalResults.push(result);
    await new Promise(r => setTimeout(r, 1500)); // Delay to avoid rate limiting
  }
  
  // Run additional tests
  console.log('\n\n📋 ADDITIONAL TESTS');
  console.log('=' .repeat(60));
  
  const additionalResults = [];
  for (const test of ADDITIONAL_TESTS) {
    const result = await testQuestion(test);
    additionalResults.push(result);
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Summary
  console.log('\n\n' + '=' .repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('=' .repeat(60));
  
  const criticalPassed = criticalResults.filter(r => r.passed).length;
  const additionalPassed = additionalResults.filter(r => r.passed).length;
  
  console.log(`\n🔥 CRITICAL: ${criticalPassed}/${criticalResults.length} 통과`);
  if (criticalPassed < criticalResults.length) {
    console.log('실패한 CRITICAL 테스트:');
    criticalResults.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ "${r.query}" - ${r.issues.join(', ')}`);
    });
  }
  
  console.log(`\n📋 ADDITIONAL: ${additionalPassed}/${additionalResults.length} 통과`);
  
  // Overall assessment
  console.log('\n' + '=' .repeat(60));
  if (criticalPassed === criticalResults.length) {
    console.log('✅ 모든 CRITICAL 테스트 통과! 배포 가능합니다.');
  } else {
    console.log('❌ CRITICAL 테스트 실패. 수정이 필요합니다.');
  }
  
  const totalPassed = criticalPassed + additionalPassed;
  const totalTests = criticalResults.length + additionalResults.length;
  const successRate = (totalPassed / totalTests * 100).toFixed(1);
  
  console.log(`\n📈 전체 성공률: ${successRate}% (${totalPassed}/${totalTests})`);
  
  return {
    criticalResults,
    additionalResults,
    summary: {
      criticalPassed,
      criticalTotal: criticalResults.length,
      additionalPassed,
      additionalTotal: additionalResults.length,
      totalPassed,
      totalTests,
      successRate: parseFloat(successRate)
    }
  };
}

// Run tests
runAllTests()
  .then(results => {
    if (results.summary.criticalPassed < results.summary.criticalTotal) {
      process.exit(1); // Exit with error if critical tests fail
    }
  })
  .catch(console.error);