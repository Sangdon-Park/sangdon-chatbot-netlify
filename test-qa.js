// QA Test Suite for Sangdon Chatbot
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8888/.netlify/functions/chat-ai-driven';

// Test cases with expected results
const QA_TESTS = [
  {
    id: 1,
    category: '세미나/강연료',
    message: 'AI 세미나 얼마야?',
    expectedKeywords: ['50만원', '500000', '1시간 30분'],
    expectedAction: 'SEARCH',
    shouldContain: '세미나'
  },
  {
    id: 2,
    category: '세미나/강연료',
    message: '강연료 얼마 받아?',
    expectedKeywords: ['50만원', '500000', '1시간 30분'],
    expectedAction: 'SEARCH',
    shouldContain: '세미나'
  },
  {
    id: 3,
    category: '세미나 개수',
    message: '세미나 몇 번 했어?',
    expectedKeywords: ['9', '아홉', '부경대', 'KAIST'],
    expectedAction: 'SEARCH',
    shouldContain: '세미나'
  },
  {
    id: 4,
    category: '세미나 개수',
    message: '초청강연 몇 번?',
    expectedKeywords: ['9', '아홉', '세미나'],
    expectedAction: 'SEARCH',
    shouldContain: '강연'
  },
  {
    id: 5,
    category: '논문 검색',
    message: 'AI 논문 뭐 썼어?',
    expectedKeywords: ['논문', 'IEEE', 'edge computing'],
    expectedAction: 'SEARCH',
    shouldContain: '논문'
  },
  {
    id: 6,
    category: '논문 개수',
    message: '논문 몇 편이야?',
    expectedKeywords: ['25', '스물다섯', '편'],
    expectedAction: 'SEARCH',
    shouldContain: '논문'
  },
  {
    id: 7,
    category: '공동연구자',
    message: '황강욱 교수님과 쓴 논문?',
    expectedKeywords: ['황강욱', '논문'],
    expectedAction: 'SEARCH',
    shouldContain: '황강욱'
  },
  {
    id: 8,
    category: '대학 세미나',
    message: 'KAIST에서 세미나 했어?',
    expectedKeywords: ['KAIST', '세미나', 'RIPE', '디지털 트윈'],
    expectedAction: 'SEARCH',
    shouldContain: 'KAIST'
  },
  {
    id: 9,
    category: '인사',
    message: '안녕하세요',
    expectedKeywords: ['안녕', '반갑'],
    expectedAction: 'CHAT',
    shouldNotContain: '논문'
  },
  {
    id: 10,
    category: '감사',
    message: '감사합니다',
    expectedKeywords: ['천만', '별말씀', '도움'],
    expectedAction: 'CHAT',
    shouldNotContain: '논문'
  }
];

// Test function
async function runTest(test) {
  console.log(`\n[TEST ${test.id}] ${test.category}: "${test.message}"`);
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Intent Classification
    const step1Response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.message, step: 1 })
    });
    
    const step1Data = await step1Response.json();
    console.log('Step 1 Response:', JSON.stringify(step1Data, null, 2));
    
    // Check if action is correct
    const actionCorrect = step1Data.action === test.expectedAction;
    console.log(`✓ Action: ${step1Data.action} (Expected: ${test.expectedAction}) - ${actionCorrect ? '✅' : '❌'}`);
    
    // If SEARCH, proceed to Step 2
    if (step1Data.action === 'SEARCH') {
      const step2Response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: test.message, 
          step: 2,
          action: step1Data.action,
          query: step1Data.query
        })
      });
      
      const step2Data = await step2Response.json();
      console.log('Step 2 Response:', JSON.stringify(step2Data, null, 2));
      
      // Check search results
      if (step2Data.searchResults) {
        console.log('Search Results Found:', step2Data.searchResults.length);
        
        // Check if expected content is in search results
        if (test.shouldContain) {
          const hasExpectedContent = step2Data.searchResults.some(r => 
            r.toLowerCase().includes(test.shouldContain.toLowerCase())
          );
          console.log(`✓ Contains "${test.shouldContain}": ${hasExpectedContent ? '✅' : '❌'}`);
        }
      }
      
      // Check final reply
      if (step2Data.reply) {
        console.log('Final Reply:', step2Data.reply);
        
        // Check for expected keywords
        let keywordMatches = 0;
        for (const keyword of test.expectedKeywords) {
          if (step2Data.reply.toLowerCase().includes(keyword.toLowerCase())) {
            keywordMatches++;
            console.log(`✓ Contains keyword "${keyword}": ✅`);
          } else {
            console.log(`✓ Contains keyword "${keyword}": ❌`);
          }
        }
        
        // Check shouldNotContain
        if (test.shouldNotContain) {
          const doesNotContain = !step2Data.reply.toLowerCase().includes(test.shouldNotContain.toLowerCase());
          console.log(`✓ Does NOT contain "${test.shouldNotContain}": ${doesNotContain ? '✅' : '❌'}`);
        }
        
        // Overall test result
        const passed = actionCorrect && keywordMatches > 0;
        console.log(`\n🎯 TEST RESULT: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        return passed;
      }
    } else if (step1Data.action === 'CHAT') {
      // For CHAT, check initial message
      if (step1Data.initialMessage) {
        console.log('Initial Message:', step1Data.initialMessage);
        
        let keywordMatches = 0;
        for (const keyword of test.expectedKeywords) {
          if (step1Data.initialMessage.toLowerCase().includes(keyword.toLowerCase())) {
            keywordMatches++;
            console.log(`✓ Contains keyword "${keyword}": ✅`);
          }
        }
        
        const passed = actionCorrect && keywordMatches > 0;
        console.log(`\n🎯 TEST RESULT: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        return passed;
      }
    }
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting QA Test Suite');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const test of QA_TESTS) {
    const passed = await runTest(test);
    results.push({ test, passed });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${QA_TESTS.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  // List failed tests
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- Test ${r.test.id}: ${r.test.category} - "${r.test.message}"`);
    });
  }
  
  console.log('\n' + (passed === QA_TESTS.length ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
}

// Run tests
runAllTests().catch(console.error);