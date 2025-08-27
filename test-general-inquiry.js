// Test general seminar inquiry
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testInquiry(query) {
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
    console.log(data2.reply.substring(0, 300) + '...');
    
    // Check what the response contains
    const checks = {
      '세미나 내용 설명': data2.reply.includes('AI 기초') || data2.reply.includes('LLM'),
      '비용 안내': data2.reply.includes('50만원'),
      '이메일 제공': data2.reply.includes('chaos@sayberrygames.com'),
      '과거 세미나 나열 안 함': !data2.reply.includes('2024년 12월 18일'),
      '맞춤형 언급': data2.reply.includes('맞춤')
    };
    
    console.log('\n✅ 체크리스트:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`   ${value ? '✓' : '✗'} ${key}`);
    });
    
    const goodCount = Object.values(checks).filter(v => v).length;
    
    if (goodCount >= 4) {
      console.log(`\n🎉 SUCCESS: ${goodCount}/5 적절한 응답`);
      return true;
    } else {
      console.log(`\n⚠️ WARNING: ${goodCount}/5만 충족`);
      return false;
    }
  }
  return false;
}

async function runTests() {
  console.log('🎯 AI 세미나 일반 문의 테스트');
  console.log('=' .repeat(50));
  
  const tests = [
    'AI 세미나에 관해 궁금합니다',
    'AI 세미나가 뭔가요?',
    'AI 세미나에 대해 알려주세요',
    'AI 세미나 소개해주세요'
  ];
  
  let passCount = 0;
  for (const test of tests) {
    const passed = await testInquiry(test);
    if (passed) passCount++;
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 최종 결과: ${passCount}/${tests.length} 통과`);
  
  if (passCount === tests.length) {
    console.log('🎉 모든 일반 문의가 올바르게 처리됩니다!');
  }
}

runTests().catch(console.error);