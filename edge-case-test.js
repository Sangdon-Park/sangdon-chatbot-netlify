// 엣지 케이스 테스트 - 까다로운 질문들
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message, history = []) {
  try {
    // Step 1: Get initial response
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        history,
        step: 1 
      })
    });
    
    if (!response1.ok) {
      return `Error ${response1.status}: ${response1.statusText}`;
    }
    
    const data1 = await response1.json();
    
    // Step 2: Get final response
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          step: 2,
          action: data1.action,
          query: data1.query
        })
      });
      
      if (!response2.ok) {
        return `Error ${response2.status}: ${response2.statusText}`;
      }
      
      const data2 = await response2.json();
      return data2.reply || 'No reply';
    }
    
    return data1.initialMessage || 'No reply';
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function runTests() {
  console.log('🔍 엣지 케이스 테스트 시작');
  console.log('==================================================\n');

  const edgeCases = [
    {
      title: "오타/비속어 포함",
      tests: [
        { q: "세미나 시발 얼마야", expect: ["50만원", "시간당"] },
        { q: "쎄미나 몇번 했엉", expect: ["13"] },
        { q: "논문 몇편썼냐고", expect: ["25"] }
      ]
    },
    {
      title: "짧은 질문",
      tests: [
        { q: "얼마?", history: [{role: 'user', content: '세미나 신청하려는데'}], expect: ["50만원"] },
        { q: "언제?", history: [{role: 'user', content: '고려대 세미나'}], expect: ["7월"] },
        { q: "몇개?", history: [{role: 'user', content: '논문'}], expect: ["25"] }
      ]
    },
    {
      title: "애매한 질문",
      tests: [
        { q: "비싸지 않아?", expect: ["50만원", "시간당"] },
        { q: "많이 했네", history: [{role: 'user', content: '세미나 13회'}], expect: ["13", "초청"] },
        { q: "괜찮은가?", history: [{role: 'user', content: 'AI 세미나'}], expect: ["AI", "세미나"] }
      ]
    },
    {
      title: "복합 질문",
      tests: [
        { q: "세미나 얼마고 몇 번 했어?", expect: ["50만원", "13"] },
        { q: "논문은 몇 편이고 세미나는 몇 번?", expect: ["25", "13"] },
        { q: "고려대랑 카이스트 언제 갔어?", expect: ["고려대", "KAIST"] }
      ]
    },
    {
      title: "잘못된 가정",
      tests: [
        { q: "하버드 세미나는 언제였어?", expect: ["하버드", "진행", "않"] },
        { q: "100편 논문 중에 최고는?", expect: ["25편"] },
        { q: "무료 세미나도 하시나요?", expect: ["50만원", "시간당"] }
      ]
    },
    {
      title: "영어 질문",
      tests: [
        { q: "How much for seminar?", expect: ["50", "만원"] },
        { q: "How many papers?", expect: ["25"] },
        { q: "Contact?", expect: ["chaos@sayberrygames.com"] }
      ]
    },
    {
      title: "반말/존댓말 섞기",
      tests: [
        { q: "세미나 해주세요 얼마야", expect: ["50만원", "chaos@sayberrygames.com"] },
        { q: "논문 보여줘요", expect: ["논문"] },
        { q: "언제 할 수 있어요?", expect: ["chaos@sayberrygames.com"] }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const category of edgeCases) {
    console.log(`📋 ${category.title}`);
    console.log('--------------------------------------------------');
    
    for (const test of category.tests) {
      totalTests++;
      const response = await chat(test.q, test.history || []);
      
      let passed = true;
      const missing = [];
      for (const keyword of test.expect) {
        if (!response.toLowerCase().includes(keyword.toLowerCase())) {
          passed = false;
          missing.push(keyword);
        }
      }
      
      if (passed) {
        passedTests++;
        console.log(`✅ "${test.q}"`);
      } else {
        console.log(`❌ "${test.q}"`);
        console.log(`   누락: ${missing.join(', ')}`);
        console.log(`   응답: ${response.substring(0, 100)}...`);
      }
    }
    console.log();
  }

  console.log('==================================================');
  console.log(`📊 결과: ${passedTests}/${totalTests} 통과 (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests < totalTests * 0.8) {
    console.log('⚠️ 80% 미만 통과 - 프롬프트 개선 필요');
  } else if (passedTests < totalTests) {
    console.log('⚠️ 일부 실패 - 추가 개선 가능');
  } else {
    console.log('🎉 모든 테스트 통과!');
  }
}

runTests().catch(console.error);