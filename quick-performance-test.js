// Quick Performance Test
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

const TESTS = [
  { query: '안녕하세요', category: '인사' },
  { query: '세미나 몇 번 했어?', category: '세미나개수' },
  { query: '논문 몇 편 썼어?', category: '논문개수' },
  { query: 'AI 세미나 얼마야?', category: '세미나비용' },
  { query: '고려대에서 뭐 발표했어?', category: '세미나내용' },
  { query: '최근 논문 뭐 썼어?', category: '논문' },
  { query: '황강욱 교수님과 쓴 논문?', category: '공동연구' },
  { query: 'KAIST 세미나는?', category: '대학세미나' }
];

async function testPerformance(test) {
  const startTime = Date.now();
  try {
    // Step 1
    const step1Start = Date.now();
    const step1Res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: test.query, step: 1 })
    });
    const step1Time = Date.now() - step1Start;
    const step1Data = await step1Res.json();
    
    // Step 2 if needed
    let step2Time = 0;
    let reply = step1Data.initialMessage || '';
    
    if (step1Data.action === 'SEARCH') {
      const step2Start = Date.now();
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
      step2Time = Date.now() - step2Start;
      const step2Data = await step2Res.json();
      reply = step2Data.reply || '';
    }
    
    const totalTime = Date.now() - startTime;
    return {
      ...test,
      step1Time,
      step2Time,
      totalTime,
      reply: reply.substring(0, 100),
      success: true
    };
  } catch (error) {
    return {
      ...test,
      totalTime: Date.now() - startTime,
      error: error.message,
      success: false
    };
  }
}

async function run() {
  console.log('🚀 Quick Performance Test');
  console.log('=' .repeat(60));
  
  const results = [];
  for (const test of TESTS) {
    const result = await testPerformance(test);
    const icon = result.success ? '✅' : '❌';
    console.log(`\n${icon} "${test.query}"`);
    console.log(`   Category: ${test.category}`);
    console.log(`   Total: ${result.totalTime}ms (Step1: ${result.step1Time}ms, Step2: ${result.step2Time}ms)`);
    if (result.reply) {
      console.log(`   Reply: ${result.reply}...`);
    }
    results.push(result);
    
    // Check for timing issues
    if (result.reply) {
      if (test.query.includes('고려대') && result.reply.includes('예정')) {
        console.log(`   ⚠️ TENSE ISSUE: Using future tense for past event`);
      }
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('=' .repeat(60));
  
  const avgTotal = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
  const avgStep1 = results.reduce((sum, r) => sum + (r.step1Time || 0), 0) / results.length;
  const avgStep2 = results.filter(r => r.step2Time).reduce((sum, r) => sum + r.step2Time, 0) / 
                   results.filter(r => r.step2Time).length || 0;
  
  console.log(`Average Total: ${avgTotal.toFixed(0)}ms`);
  console.log(`Average Step 1: ${avgStep1.toFixed(0)}ms`);
  console.log(`Average Step 2: ${avgStep2.toFixed(0)}ms`);
  
  // Performance assessment
  console.log('\n📈 Performance Assessment:');
  if (avgTotal < 3000) {
    console.log('✅ EXCELLENT: Average response under 3 seconds');
  } else if (avgTotal < 5000) {
    console.log('⚠️ ACCEPTABLE: Average response 3-5 seconds');
  } else {
    console.log('❌ POOR: Average response over 5 seconds - needs improvement');
  }
  
  const improvement = ((8000 - avgTotal) / 8000 * 100).toFixed(1);
  console.log(`\n🎯 Performance improvement from baseline: ${improvement}%`);
  console.log('   (Baseline: ~8000ms average)');
  
  return results;
}

run().catch(console.error);