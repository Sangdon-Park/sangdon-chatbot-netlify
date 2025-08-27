// Quick pricing test
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testPricingFlow() {
  console.log('🎯 세미나 가격 문답 테스트\n');
  
  const history = [];
  
  // First message
  console.log('Q1: "AI 세미나에 대해 물어볼 게 있습니다."');
  const res1 = await fetch(PROD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'AI 세미나에 대해 물어볼 게 있습니다.', step: 1, history })
  });
  const data1 = await res1.json();
  
  let reply1 = '';
  if (data1.action === 'SEARCH') {
    const res1b = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'AI 세미나에 대해 물어볼 게 있습니다.',
        step: 2,
        action: data1.action,
        query: data1.query,
        history
      })
    });
    const data1b = await res1b.json();
    reply1 = data1b.reply;
  } else {
    reply1 = data1.initialMessage;
  }
  
  console.log('A1:', reply1);
  history.push({ role: 'user', content: 'AI 세미나에 대해 물어볼 게 있습니다.' });
  history.push({ role: 'assistant', content: reply1 });
  
  // Second message  
  console.log('\nQ2: "1회당 얼마죠?"');
  const res2 = await fetch(PROD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '1회당 얼마죠?', step: 1, history })
  });
  const data2 = await res2.json();
  
  let reply2 = '';
  if (data2.action === 'SEARCH') {
    const res2b = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '1회당 얼마죠?',
        step: 2,
        action: data2.action,
        query: data2.query,
        history
      })
    });
    const data2b = await res2b.json();
    reply2 = data2b.reply;
  } else {
    reply2 = data2.initialMessage;
  }
  
  console.log('A2:', reply2);
  
  // Check result
  if (reply2.includes('50만원')) {
    console.log('\n✅ SUCCESS: 50만원이 정확히 나왔습니다!');
  } else {
    console.log('\n❌ FAIL: 50만원이 안 나왔습니다.');
  }
}

testPricingFlow().catch(console.error);