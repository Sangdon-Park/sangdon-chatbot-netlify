// Test seminar application response
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testApplication(query) {
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
    
    // Check if it properly handles application
    const isGood = data2.reply.includes('chaos@sayberrygames.com') && 
                   !data2.reply.includes('어떤 세미나를 신청');
    
    if (isGood) {
      console.log('\n✅ SUCCESS: 이메일 제공하고 과거 세미나 언급 안 함');
    } else {
      console.log('\n❌ FAIL: 여전히 과거 세미나를 보여주거나 이메일이 없음');
    }
    
    return isGood;
  }
  return false;
}

async function runTests() {
  console.log('🎯 세미나 신청 응답 테스트');
  console.log('=' .repeat(50));
  
  const tests = [
    '세미나 신청하고 싶은데',
    'AI 세미나 신청하고 싶습니다',
    '세미나 문의하고 싶어요',
    '세미나 요청 방법이 궁금합니다'
  ];
  
  let passCount = 0;
  for (const test of tests) {
    const passed = await testApplication(test);
    if (passed) passCount++;
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 결과: ${passCount}/${tests.length} 통과`);
  
  if (passCount === tests.length) {
    console.log('🎉 모든 신청 요청이 올바르게 처리됩니다!');
  } else {
    console.log('⚠️ 일부 신청 요청이 제대로 처리되지 않습니다.');
  }
}

runTests().catch(console.error);