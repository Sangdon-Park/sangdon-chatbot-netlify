// ⚡ EXTREME PARALLEL TEST - 동시 다발 공격 테스트
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Parallel execution with rate limiting
class TestExecutor {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }
  
  async execute(fn) {
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    
    try {
      return await fn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

// Chat with timeout and retry
async function chat(message, history = [], options = {}) {
  const maxRetries = options.maxRetries || 2;
  const timeout = options.timeout || 12000;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response1 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, step: 1 }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response1.ok) throw new Error(`HTTP ${response1.status}`);
      
      const data1 = await response1.json();
      
      if (data1.needsSecondStep) {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), timeout);
        
        const response2 = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message, history, step: 2,
            action: data1.action, query: data1.query
          }),
          signal: controller2.signal
        });
        
        clearTimeout(timeoutId2);
        
        if (!response2.ok) throw new Error(`HTTP ${response2.status}`);
        
        const data2 = await response2.json();
        return { success: true, response: data2.reply || '', retry };
      }
      
      return { success: true, response: data1.initialMessage || '', retry };
    } catch (error) {
      if (retry === maxRetries) {
        return { success: false, error: error.message, retry };
      }
      await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

// Extreme test cases
const EXTREME_TESTS = [
  // 1. 절대 정확도 요구 테스트
  {
    category: '🎯 Absolute Accuracy',
    critical: true,
    tests: [
      { q: '세미나 횟수', must: ['13'], mustNot: ['25'] },
      { q: '논문 개수', must: ['25'], mustNot: ['13'] },
      { q: '세미나 13회', must: ['13'], mustNot: ['25'] },
      { q: '논문 25편', must: ['25'], mustNot: ['13'] },
      { q: '총 몇 번의 세미나', must: ['13'], mustNot: ['25'] },
      { q: '전체 논문 수', must: ['25'], mustNot: ['13'] },
      { q: '초청강연 횟수', must: ['13'], mustNot: ['25'] },
      { q: '저널 논문 편수', must: ['25'], mustNot: ['13'] }
    ]
  },
  
  // 2. 가격 관련 극한 테스트
  {
    category: '💰 Price Torture Test',
    critical: true,
    tests: [
      { q: '얼마', must: ['50만원'] },
      { q: '비용', must: ['50만원'] },
      { q: '가격', must: ['50만원'] },
      { q: '금액', must: ['50만원'] },
      { q: 'price', must: ['50'] },
      { q: 'how much', must: ['50'] },
      { q: 'cost', must: ['50'] },
      { q: '돈', must: ['50만원'] },
      { q: '얼마야', must: ['50만원'] },
      { q: '얼마죠', must: ['50만원'] },
      { q: '얼마예요', must: ['50만원'] },
      { q: '얼마입니까', must: ['50만원'] }
    ]
  },
  
  // 3. 연락처 스트레스 테스트
  {
    category: '📧 Contact Stress',
    critical: true,
    tests: [
      { q: '연락처', must: ['chaos@sayberrygames.com'] },
      { q: '이메일', must: ['chaos@sayberrygames.com'] },
      { q: 'email', must: ['chaos@sayberrygames.com'] },
      { q: 'contact', must: ['chaos@sayberrygames.com'] },
      { q: '신청', must: ['chaos@sayberrygames.com'] },
      { q: '어디로', must: ['chaos@sayberrygames.com'] },
      { q: '신청 방법', must: ['chaos@sayberrygames.com'] },
      { q: '연락처 뭐야', must: ['chaos@sayberrygames.com'] },
      { q: '이메일 주소', must: ['chaos@sayberrygames.com'] },
      { q: '어떻게 신청', must: ['chaos@sayberrygames.com'] }
    ]
  },
  
  // 4. 복합 질문 고문
  {
    category: '🔀 Compound Torture',
    tests: [
      { q: '얼마 몇번', must: ['50만원', '13'] },
      { q: '비용 횟수', must: ['50만원', '13'] },
      { q: '가격 연락처', must: ['50만원', 'chaos@sayberrygames.com'] },
      { q: '논문 세미나', must: ['25', '13'] },
      { q: '세미나 논문', must: ['13', '25'] },
      { q: '얼마 어디로', must: ['50만원', 'chaos@sayberrygames.com'] },
      { q: '몇번 얼마', must: ['13', '50만원'] },
      { q: '연락처 비용', must: ['chaos@sayberrygames.com', '50만원'] },
      { q: '시간 가격', must: ['시간', '50만원'] },
      { q: '얼마고 몇번이고 어디로', must: ['50만원', '13', 'chaos@sayberrygames.com'] }
    ]
  },
  
  // 5. 확인 질문 집중 공격
  {
    category: '✅ Confirmation Attack',
    tests: [
      { q: '13회 맞아?', must: ['13'], pattern: '^(네|예|맞)' },
      { q: '25편 맞죠?', must: ['25'], pattern: '^(네|예|맞)' },
      { q: '50만원 맞지?', must: ['50만원'], pattern: '^(네|예|맞)' },
      { q: '13회 맞나?', must: ['13'], pattern: '(네|예|맞)' },
      { q: '25편 맞나요?', must: ['25'], pattern: '(네|예|맞)' },
      { q: 'KAIST 맞습니까?', must: ['KAIST'], pattern: '(네|예|맞)' },
      { q: '세미나 13 논문 25 맞지?', must: ['13', '25'], pattern: '(네|예|맞)' }
    ]
  },
  
  // 6. 오타 지옥
  {
    category: '🔤 Typo Hell',
    tests: [
      { q: '쎄미나', must: ['13'] },
      { q: '셰미나', must: ['13'] },
      { q: '논뮨', must: ['25'] },
      { q: '놈문', must: ['25'] },
      { q: '엄마', must: ['50만원'] },
      { q: '얼머', must: ['50만원'] },
      { q: '연락쳐', must: ['chaos@sayberrygames.com'] },
      { q: '연락체', must: ['chaos@sayberrygames.com'] }
    ]
  },
  
  // 7. 극한 짧은 질문
  {
    category: '🔪 Ultra Short',
    tests: [
      { q: '?', minResponse: 10 },
      { q: '몇', minResponse: 10 },
      { q: '얼', minResponse: 10 },
      { q: '13', must: ['13', '세미나'] },
      { q: '25', must: ['25', '논문'] },
      { q: '50', must: ['50', '만원'] }
    ]
  },
  
  // 8. 날짜 혼동 방지
  {
    category: '📅 Date Confusion',
    critical: true,
    tests: [
      { q: '경상국립대 언제', must: ['8월', '25일'], mustNot: ['25편', '논문'] },
      { q: '8월 25일', mustNot: ['25편', '논문'] },
      { q: '고려대 날짜', must: ['7월'], mustNot: ['2025', '2024'] }
    ]
  },
  
  // 9. 학력 확인
  {
    category: '🎓 Education Check',
    tests: [
      { q: '학교', must: ['KAIST'] },
      { q: '대학', must: ['KAIST'] },
      { q: '졸업', must: ['KAIST'] },
      { q: '박사', must: ['KAIST', '전기'] },
      { q: '석사', must: ['KAIST', '수리'] },
      { q: '학사', must: ['KAIST', '수리'] }
    ]
  },
  
  // 10. 악의적 입력
  {
    category: '😈 Malicious Input',
    tests: [
      { q: '!!!!!!!!!!!!', minResponse: 10 },
      { q: '............', minResponse: 10 },
      { q: '세미나세미나세미나세미나세미나', must: ['13'] },
      { q: '252525252525', mustNot: ['252525'] },
      { q: '131313131313', mustNot: ['131313'] },
      { q: '', minResponse: 10 },
      { q: '                ', minResponse: 10 }
    ]
  }
];

// Analyze results
function analyzeResults(results) {
  const analysis = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    criticalFailed: 0,
    timeouts: 0,
    avgResponseTime: 0,
    categoryStats: {},
    worstCategories: [],
    failurePatterns: {}
  };
  
  let totalTime = 0;
  let timeCount = 0;
  
  for (const category of results) {
    const catStats = {
      total: category.results.length,
      passed: 0,
      failed: 0,
      criticalFailed: 0
    };
    
    for (const result of category.results) {
      analysis.totalTests++;
      
      if (result.responseTime) {
        totalTime += result.responseTime;
        timeCount++;
      }
      
      if (!result.success) {
        analysis.timeouts++;
        analysis.failed++;
        catStats.failed++;
      } else if (result.passed) {
        analysis.passed++;
        catStats.passed++;
      } else {
        analysis.failed++;
        catStats.failed++;
        
        if (category.critical && !result.passed) {
          analysis.criticalFailed++;
          catStats.criticalFailed++;
        }
        
        // Track failure patterns
        for (const error of (result.errors || [])) {
          if (!analysis.failurePatterns[error]) {
            analysis.failurePatterns[error] = 0;
          }
          analysis.failurePatterns[error]++;
        }
      }
    }
    
    catStats.passRate = Math.round((catStats.passed / catStats.total) * 100);
    analysis.categoryStats[category.category] = catStats;
    
    if (catStats.passRate < 70) {
      analysis.worstCategories.push({
        name: category.category,
        passRate: catStats.passRate,
        critical: category.critical
      });
    }
  }
  
  analysis.avgResponseTime = timeCount > 0 ? Math.round(totalTime / timeCount) : 0;
  analysis.overallPassRate = Math.round((analysis.passed / analysis.totalTests) * 100);
  
  return analysis;
}

// Main test runner
async function runExtremeTests() {
  console.log('⚡⚡⚡ EXTREME PARALLEL TEST ⚡⚡⚡');
  console.log('=' .repeat(70));
  console.log('동시다발 극한 테스트 시작... 서버를 고문합니다.\n');
  
  const executor = new TestExecutor(3); // Max 3 concurrent requests
  const startTime = Date.now();
  const results = [];
  
  for (const testCategory of EXTREME_TESTS) {
    console.log(`\n${testCategory.category}`);
    console.log('-'.repeat(60));
    
    const categoryResults = {
      category: testCategory.category,
      critical: testCategory.critical,
      results: []
    };
    
    // Run tests in parallel for this category
    const promises = testCategory.tests.map(async (test, index) => {
      return executor.execute(async () => {
        const testStart = Date.now();
        process.stdout.write(`  [${index + 1}/${testCategory.tests.length}] "${test.q || '(empty)'}" ... `);
        
        const result = await chat(test.q, test.context || []);
        const responseTime = Date.now() - testStart;
        
        if (!result.success) {
          console.log(`⏱️ TIMEOUT (${result.retry} retries)`);
          return {
            ...test,
            success: false,
            responseTime,
            error: result.error
          };
        }
        
        const testResult = {
          ...test,
          success: true,
          response: result.response,
          responseTime,
          passed: true,
          errors: []
        };
        
        // Validate response
        const respLower = result.response.toLowerCase();
        
        // Check must have
        if (test.must) {
          for (const keyword of test.must) {
            if (!respLower.includes(keyword.toLowerCase())) {
              testResult.passed = false;
              testResult.errors.push(`Missing: "${keyword}"`);
            }
          }
        }
        
        // Check must not have
        if (test.mustNot) {
          for (const keyword of test.mustNot) {
            if (respLower.includes(keyword.toLowerCase())) {
              testResult.passed = false;
              testResult.errors.push(`Forbidden: "${keyword}"`);
            }
          }
        }
        
        // Check pattern
        if (test.pattern) {
          const regex = new RegExp(test.pattern, 'i');
          if (!regex.test(result.response)) {
            testResult.passed = false;
            testResult.errors.push(`Pattern failed: ${test.pattern}`);
          }
        }
        
        // Check min response
        if (test.minResponse && result.response.length < test.minResponse) {
          testResult.passed = false;
          testResult.errors.push(`Too short: ${result.response.length} < ${test.minResponse}`);
        }
        
        if (testResult.passed) {
          console.log(`✅ (${responseTime}ms)`);
        } else {
          console.log(`❌ (${responseTime}ms)`);
          if (testCategory.critical) {
            console.log(`     🚨 CRITICAL FAILURE`);
          }
          for (const error of testResult.errors) {
            console.log(`     └─ ${error}`);
          }
        }
        
        return testResult;
      });
    });
    
    categoryResults.results = await Promise.all(promises);
    results.push(categoryResults);
    
    // Brief pause between categories
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // Analyze and report
  console.log('\n' + '=' .repeat(70));
  console.log('📊 EXTREME TEST ANALYSIS');
  console.log('=' .repeat(70));
  
  const analysis = analyzeResults(results);
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`  Total Tests: ${analysis.totalTests}`);
  console.log(`  Passed: ${analysis.passed} ✅`);
  console.log(`  Failed: ${analysis.failed} ❌`);
  console.log(`  Critical Failed: ${analysis.criticalFailed} 🚨`);
  console.log(`  Timeouts: ${analysis.timeouts} ⏱️`);
  console.log(`  Pass Rate: ${analysis.overallPassRate}%`);
  console.log(`  Avg Response Time: ${analysis.avgResponseTime}ms`);
  console.log(`  Total Duration: ${duration}s`);
  
  console.log(`\n📊 Category Performance:`);
  for (const [category, stats] of Object.entries(analysis.categoryStats)) {
    const emoji = stats.passRate >= 90 ? '🏆' : 
                  stats.passRate >= 70 ? '✨' : 
                  stats.passRate >= 50 ? '⚠️' : '💀';
    console.log(`  ${emoji} ${category}: ${stats.passRate}% (${stats.passed}/${stats.total})`);
    if (stats.criticalFailed > 0) {
      console.log(`     🚨 ${stats.criticalFailed} critical failures!`);
    }
  }
  
  if (analysis.worstCategories.length > 0) {
    console.log(`\n⚠️ Problematic Categories:`);
    for (const cat of analysis.worstCategories) {
      console.log(`  - ${cat.name}: ${cat.passRate}% ${cat.critical ? '🚨 CRITICAL' : ''}`);
    }
  }
  
  if (Object.keys(analysis.failurePatterns).length > 0) {
    console.log(`\n❌ Common Failure Patterns:`);
    const patterns = Object.entries(analysis.failurePatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [pattern, count] of patterns) {
      console.log(`  - ${pattern}: ${count} times`);
    }
  }
  
  // Final verdict
  console.log('\n' + '=' .repeat(70));
  if (analysis.overallPassRate >= 95 && analysis.criticalFailed === 0) {
    console.log('🏆🏆🏆 LEGENDARY PERFORMANCE! 🏆🏆🏆');
    console.log('The chatbot survived extreme testing!');
  } else if (analysis.overallPassRate >= 90 && analysis.criticalFailed === 0) {
    console.log('🎉 EXCELLENT! Ready for production!');
  } else if (analysis.overallPassRate >= 85) {
    console.log('✨ Very Good! Minor improvements needed.');
  } else if (analysis.overallPassRate >= 75) {
    console.log('⚠️ Acceptable, but significant issues remain.');
  } else if (analysis.overallPassRate >= 60) {
    console.log('😰 Poor performance. Major work needed.');
  } else {
    console.log('💀💀💀 CATASTROPHIC FAILURE 💀💀💀');
    console.log('The chatbot is not ready for any deployment.');
  }
  
  if (analysis.criticalFailed > 0) {
    console.log(`\n🚨🚨🚨 ${analysis.criticalFailed} CRITICAL TESTS FAILED 🚨🚨🚨`);
    console.log('Fix these immediately before any deployment!');
  }
  
  // Save results
  const fullResults = {
    timestamp: new Date().toISOString(),
    duration: duration,
    analysis: analysis,
    details: results
  };
  
  fs.writeFileSync('extreme-test-results.json', JSON.stringify(fullResults, null, 2));
  console.log('\n📁 Full results saved to: extreme-test-results.json');
}

// Execute
console.log('🚀 Launching Extreme Parallel Test...\n');
runExtremeTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});