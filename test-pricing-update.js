// Test updated pricing response
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testPricing(query) {
  console.log(`\n📝 질문: "${query}"`);
  
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
    console.log(data2.reply);
    
    // Check for key elements
    const checks = {
      '시간당': data2.reply.includes('시간당'),
      '50만원': data2.reply.includes('50만원'),
      '1-2시간 또는 1시간에서 2시간': data2.reply.includes('1시간에서 2시간') || data2.reply.includes('1-2시간'),
      '맞춤형': data2.reply.includes('맞춤형'),
      '여러 회차': data2.reply.includes('여러 회차') || data2.reply.includes('나누어'),
      '연구자': data2.reply.includes('연구자'),
      '자료': data2.reply.includes('자료')
    };
    
    console.log('\n✅ 체크리스트:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`   ${value ? '✓' : '✗'} ${key}`);
    });
    
    const passCount = Object.values(checks).filter(v => v).length;
    if (passCount >= 5) {
      console.log(`\n🎉 SUCCESS: ${passCount}/7 요소 포함`);
    } else {
      console.log(`\n⚠️ WARNING: ${passCount}/7 요소만 포함`);
    }
  }
}

async function runTests() {
  console.log('🎯 세미나 가격 응답 테스트');
  console.log('=' .repeat(50));
  
  await testPricing('AI 세미나 얼마야?');
  await new Promise(r => setTimeout(r, 1500));
  
  await testPricing('세미나 비용이 어떻게 되나요?');
  await new Promise(r => setTimeout(r, 1500));
  
  await testPricing('강연료가 궁금합니다');
}

runTests().catch(console.error);