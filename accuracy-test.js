// Accuracy Test
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testQuestion(query) {
  try {
    // Step 1
    const step1Res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, step: 1 })
    });
    const step1Data = await step1Res.json();
    
    // Step 2 if needed
    if (step1Data.action === 'SEARCH') {
      const step2Res = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || query
        })
      });
      const step2Data = await step2Res.json();
      
      console.log('\n📚 관련 자료');
      if (step2Data.searchResults) {
        step2Data.searchResults.forEach(r => console.log(`[result] ${r}`));
      }
      console.log(step2Data.reply);
      return step2Data.reply;
    } else {
      console.log(step1Data.initialMessage);
      return step1Data.initialMessage;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function run() {
  console.log('🎯 정확도 테스트\n');
  
  // Test 1: AI 세미나 질문
  console.log('질문: "안녕하세요, AI 세미나에 대해 물어볼 게 있습니다."');
  const reply1 = await testQuestion('안녕하세요, AI 세미나에 대해 물어볼 게 있습니다.');
  
  // Check for issues
  if (reply1) {
    if (reply1.includes('논문')) {
      console.log('\n❌ 문제: 세미나 질문인데 논문 언급');
    }
    if (reply1.includes('공동연구자')) {
      console.log('❌ 문제: 세미나 질문인데 공동연구자 언급');
    }
    if (reply1.includes('오현택 교수')) {
      console.log('❌ 문제: 오현택은 교수가 아님');
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: 고려대 세미나
  console.log('\n\n질문: "고려대에서 뭐 발표했어?"');
  const reply2 = await testQuestion('고려대에서 뭐 발표했어?');
  
  if (reply2 && reply2.includes('예정')) {
    console.log('\n❌ 문제: 이미 지난 세미나를 예정이라고 함');
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 3: 세미나 개수
  console.log('\n\n질문: "세미나 몇 번 했어?"');
  const reply3 = await testQuestion('세미나 몇 번 했어?');
  
  if (!reply3.includes('13')) {
    console.log('\n❌ 문제: 13회가 안 나옴');
  }
  
  console.log('\n\n✅ 테스트 완료');
}

run().catch(console.error);