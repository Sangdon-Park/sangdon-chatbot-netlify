// Performance Test Suite with Real-World Questions
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Realistic test cases that people might actually ask
const REALISTIC_TESTS = [
  // === 인사 및 소개 ===
  { category: '인사', query: '안녕하세요 박상돈 교수님', expectType: 'greeting' },
  { category: '인사', query: '자기소개 해주세요', expectType: 'intro' },
  { category: '인사', query: '뭐하는 사람이야?', expectType: 'intro' },
  
  // === 경력 및 배경 ===
  { category: '경력', query: '어디서 일해?', expectType: 'work' },
  { category: '경력', query: '세이베리게임즈 뭐하는 회사야?', expectType: 'work' },
  { category: '경력', query: 'KAIST에서 뭐 했어?', expectType: 'work' },
  { category: '경력', query: '박사는 언제 받았어?', expectType: 'education' },
  { category: '경력', query: '전공이 뭐야?', expectType: 'education' },
  
  // === 세미나/강연 관련 실제 질문들 ===
  { category: '세미나', query: '세미나 의뢰하려면 어떻게 해야돼?', expectKeyword: '50만원' },
  { category: '세미나', query: '강연 주제는 뭐뭐 할 수 있어?', expectKeyword: 'AI' },
  { category: '세미나', query: '어느 대학에서 많이 불러?', expectKeyword: 'KAIST' },
  { category: '세미나', query: '최근에 한 세미나는?', expectKeyword: '경상국립대' },
  { category: '세미나', query: '고려대에서 뭐 발표했어?', expectKeyword: '고려대' },
  { category: '세미나', query: 'LLM 관련 세미나 한 적 있어?', expectKeyword: 'LLM' },
  { category: '세미나', query: '세미나 요청하면 어떤 내용으로 해줄 수 있어?', expectKeyword: 'AI' },
  { category: '세미나', query: '다음달에 세미나 가능해?', expectKeyword: '세미나' },
  
  // === 논문/연구 관련 실제 질문들 ===
  { category: '논문', query: '최근 논문 뭐 썼어?', expectKeyword: '2024' },
  { category: '논문', query: '엣지 컴퓨팅 관련 논문 있어?', expectKeyword: 'edge' },
  { category: '논문', query: 'IEEE에 논문 낸 거 있어?', expectKeyword: 'IEEE' },
  { category: '논문', query: '제일 자랑스러운 논문은?', expectKeyword: '논문' },
  { category: '논문', query: '박사논문 주제가 뭐였어?', expectKeyword: '에너지' },
  { category: '논문', query: 'IoT 관련 연구한 적 있어?', expectKeyword: 'IoT' },
  
  // === AI/기술 관련 질문 ===
  { category: 'AI', query: 'Claude랑 ChatGPT 중 뭐가 나아?', expectType: 'ai_opinion' },
  { category: 'AI', query: 'AI로 뭐 만들어본 거 있어?', expectKeyword: 'AI' },
  { category: 'AI', query: '바이브 코딩이 뭐야?', expectKeyword: 'vibe' },
  { category: 'AI', query: 'LLM 어떻게 활용하고 있어?', expectKeyword: 'LLM' },
  { category: 'AI', query: 'AI 캐릭터 프로젝트 설명해줘', expectKeyword: '캐릭터' },
  
  // === 협업/네트워킹 ===
  { category: '협업', query: '같이 연구하고 싶은데 연락처는?', expectKeyword: 'chaos' },
  { category: '협업', query: '누구랑 많이 연구해?', expectKeyword: '최준균' },
  { category: '협업', query: '공동연구 제안하려면?', expectType: 'contact' },
  
  // === 구체적인 정보 요청 ===
  { category: '정보', query: '세미나 몇시간이야?', expectKeyword: '1시간 30분' },
  { category: '정보', query: '강연료 얼마야?', expectKeyword: '50만원' },
  { category: '정보', query: '논문 몇편?', expectKeyword: '25' },
  { category: '정보', query: '세미나 몇번?', expectKeyword: '13' },
  
  // === 잡담/기타 ===
  { category: '잡담', query: '오늘 날씨 어때?', expectType: 'chat' },
  { category: '잡담', query: '점심 뭐 먹었어?', expectType: 'chat' },
  { category: '잡담', query: '감사합니다', expectType: 'thanks' }
];

// Performance measurement function
async function measurePerformance(test) {
  const startTime = Date.now();
  const metrics = {
    step1Time: 0,
    step2Time: 0,
    totalTime: 0,
    success: false,
    error: null
  };

  try {
    // Step 1: Intent classification
    const step1Start = Date.now();
    const step1Response = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.query, step: 1 })
    });
    metrics.step1Time = Date.now() - step1Start;

    if (!step1Response.ok) {
      throw new Error(`Step 1 failed: ${step1Response.status}`);
    }

    const step1Data = await step1Response.json();

    // Step 2 if needed
    if (step1Data.action === 'SEARCH') {
      const step2Start = Date.now();
      const step2Response = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || test.query
        })
      });
      metrics.step2Time = Date.now() - step2Start;

      if (!step2Response.ok) {
        throw new Error(`Step 2 failed: ${step2Response.status}`);
      }

      const step2Data = await step2Response.json();
      
      // Check if response contains expected keyword
      if (test.expectKeyword) {
        const responseText = (step2Data.reply || '').toLowerCase();
        const searchText = (step2Data.searchResults || []).join(' ').toLowerCase();
        const combined = responseText + ' ' + searchText;
        metrics.success = combined.includes(test.expectKeyword.toLowerCase());
      } else {
        metrics.success = true;
      }
    } else {
      // CHAT response
      metrics.success = step1Data.action === 'CHAT';
      if (test.expectKeyword) {
        const responseText = (step1Data.initialMessage || '').toLowerCase();
        metrics.success = responseText.includes(test.expectKeyword.toLowerCase());
      }
    }

    metrics.totalTime = Date.now() - startTime;
    
  } catch (error) {
    metrics.error = error.message;
    metrics.totalTime = Date.now() - startTime;
  }

  return metrics;
}

// Main test runner
async function runPerformanceTests() {
  console.log('🚀 Performance Test Suite');
  console.log('=' .repeat(80));
  console.log(`Testing ${REALISTIC_TESTS.length} realistic scenarios`);
  console.log(`URL: ${PROD_URL}`);
  console.log('=' .repeat(80));
  
  const results = [];
  const categoryMetrics = {};
  
  // Run tests with rate limiting
  for (const test of REALISTIC_TESTS) {
    process.stdout.write(`\n[${test.category}] "${test.query.substring(0, 40)}..."  `);
    
    const metrics = await measurePerformance(test);
    results.push({ ...test, ...metrics });
    
    // Update category metrics
    if (!categoryMetrics[test.category]) {
      categoryMetrics[test.category] = {
        count: 0,
        totalTime: 0,
        step1Total: 0,
        step2Total: 0,
        successes: 0,
        errors: 0
      };
    }
    
    const cat = categoryMetrics[test.category];
    cat.count++;
    cat.totalTime += metrics.totalTime;
    cat.step1Total += metrics.step1Time;
    cat.step2Total += metrics.step2Time;
    if (metrics.success) cat.successes++;
    if (metrics.error) cat.errors++;
    
    // Print inline result
    const icon = metrics.success ? '✅' : '❌';
    const time = `${metrics.totalTime}ms`;
    console.log(`${icon} ${time}`);
    
    if (metrics.error) {
      console.log(`   Error: ${metrics.error}`);
    } else if (!metrics.success && test.expectKeyword) {
      console.log(`   Missing: "${test.expectKeyword}"`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Summary statistics
  console.log('\n' + '=' .repeat(80));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('=' .repeat(80));
  
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / totalTests;
  const avgStep1Time = results.reduce((sum, r) => sum + r.step1Time, 0) / totalTests;
  const avgStep2Time = results.filter(r => r.step2Time > 0).reduce((sum, r) => sum + r.step2Time, 0) / 
                       results.filter(r => r.step2Time > 0).length || 0;
  
  console.log('\n📈 Overall Metrics:');
  console.log(`   Success Rate: ${((successfulTests/totalTests)*100).toFixed(1)}% (${successfulTests}/${totalTests})`);
  console.log(`   Avg Total Time: ${avgTotalTime.toFixed(0)}ms`);
  console.log(`   Avg Step 1 Time: ${avgStep1Time.toFixed(0)}ms`);
  console.log(`   Avg Step 2 Time: ${avgStep2Time.toFixed(0)}ms`);
  
  // Find slowest queries
  const slowest = results.sort((a, b) => b.totalTime - a.totalTime).slice(0, 5);
  console.log('\n🐢 Slowest Queries:');
  slowest.forEach(s => {
    console.log(`   ${s.totalTime}ms - "${s.query.substring(0, 50)}..."`);
  });
  
  // Find fastest queries
  const fastest = results.sort((a, b) => a.totalTime - b.totalTime).slice(0, 5);
  console.log('\n⚡ Fastest Queries:');
  fastest.forEach(f => {
    console.log(`   ${f.totalTime}ms - "${f.query.substring(0, 50)}..."`);
  });
  
  // Category breakdown
  console.log('\n📁 By Category:');
  Object.entries(categoryMetrics).forEach(([category, metrics]) => {
    const avgTime = metrics.totalTime / metrics.count;
    const successRate = (metrics.successes / metrics.count * 100).toFixed(0);
    console.log(`   ${category}: ${successRate}% success, avg ${avgTime.toFixed(0)}ms`);
  });
  
  // Performance bottlenecks
  console.log('\n🔥 Performance Analysis:');
  if (avgStep1Time > 1500) {
    console.log('   ⚠️ Step 1 (AI Classification) is slow: ' + avgStep1Time.toFixed(0) + 'ms');
    console.log('      → Consider caching or rule-based classification');
  }
  if (avgStep2Time > 2000) {
    console.log('   ⚠️ Step 2 (Search & Response) is slow: ' + avgStep2Time.toFixed(0) + 'ms');
    console.log('      → Consider pre-computing embeddings or reducing search scope');
  }
  if (avgTotalTime > 3500) {
    console.log('   ⚠️ Total response time exceeds 3.5s threshold');
    console.log('      → Users may experience noticeable delays');
  }
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('   1. Implement response caching for frequently asked questions');
  console.log('   2. Pre-compute and cache embeddings for all documents');
  console.log('   3. Use rule-based classification for common patterns');
  console.log('   4. Implement connection pooling for API calls');
  console.log('   5. Consider using CDN for static responses');
  
  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    url: PROD_URL,
    summary: {
      totalTests,
      successfulTests,
      successRate: ((successfulTests/totalTests)*100).toFixed(1) + '%',
      avgTotalTime: avgTotalTime.toFixed(0) + 'ms',
      avgStep1Time: avgStep1Time.toFixed(0) + 'ms',
      avgStep2Time: avgStep2Time.toFixed(0) + 'ms'
    },
    categoryMetrics,
    slowestQueries: slowest.slice(0, 10),
    fastestQueries: fastest.slice(0, 10),
    allResults: results
  };
  
  require('fs').writeFileSync(
    'performance-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to performance-report.json');
  
  return report;
}

// Run tests
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests, measurePerformance };