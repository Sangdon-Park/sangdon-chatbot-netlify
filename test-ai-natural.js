// Test AI handling with improved prompts (no hardcoding)
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testQuery(query, expectedElements) {
  console.log(`\n📝 질문: "${query}"`);
  console.log('=' .repeat(50));
  
  // Step 1
  const res1 = await fetch(PROD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, step: 1 })
  });
  const data1 = await res1.json();
  
  // Step 2
  if (data1.action === 'SEARCH') {
    const res2 = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        step: 2,
        action: data1.action,
        query: data1.query || query
      })
    });
    const data2 = await res2.json();
    
    console.log('\n💬 응답:');
    console.log(data2.reply.substring(0, 400) + (data2.reply.length > 400 ? '...' : ''));
    
    // Check expected elements
    console.log('\n✅ 체크:');
    const results = {};
    for (const element of expectedElements) {
      const found = data2.reply.includes(element);
      results[element] = found;
      console.log(`   ${found ? '✓' : '✗'} "${element}"`);
    }
    
    const passCount = Object.values(results).filter(v => v).length;
    const success = passCount >= expectedElements.length * 0.7; // 70% threshold
    
    console.log(`\n${success ? '✅' : '❌'} ${passCount}/${expectedElements.length} 요소 포함`);
    return success;
  }
  return false;
}

async function runTests() {
  console.log('🎯 AI 자연스러운 응답 테스트 (하드코딩 없음)');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      query: 'AI 세미나에 대해 궁금합니다',
      expected: ['AI', '50만원', 'chaos@sayberrygames.com', '맞춤형']
    },
    {
      query: '세미나 신청하고 싶은데',
      expected: ['chaos@sayberrygames.com', '연락', '신청']
    },
    {
      query: 'AI 세미나 얼마야?',
      expected: ['50만원', '시간당', '1-2시간']
    },
    {
      query: '세미나 몇 번 했어?',
      expected: ['13']
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testQuery(test.query, test.expected);
    if (success) successCount++;
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 결과: ${successCount}/${tests.length} 통과`);
  
  if (successCount === tests.length) {
    console.log('🎉 AI가 프롬프트만으로 올바르게 응답합니다!');
  } else {
    console.log('⚠️ 일부 응답이 부적절합니다. 프롬프트 개선 필요.');
  }
}

runTests().catch(console.error);