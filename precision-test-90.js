// 정밀 테스트 - 90% 이상 통과 목표
// 각 테스트는 명확한 의도를 가짐

const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message, history = []) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 })
    });
    
    if (!response1.ok) return `Error ${response1.status}`;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, history, step: 2,
          action: data1.action, query: data1.query
        })
      });
      
      if (!response2.ok) return `Error ${response2.status}`;
      const data2 = await response2.json();
      return data2.reply || 'No reply';
    }
    
    return data1.initialMessage || 'No reply';
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function runTests() {
  console.log('🎯 정밀 테스트 - 90% 이상 통과 목표');
  console.log('==================================================\n');

  const testCategories = [
    {
      name: '💰 비용 관련 (Cost)',
      intent: '세미나 비용이 정확히 50만원임을 확인',
      tests: [
        { q: "AI 세미나 얼마야?", must: ["50만원"], mustNot: ["25"] },
        { q: "세미나 비용이 어떻게 되나요?", must: ["50만원"], mustNot: ["25"] },
        { q: "1회당 얼마죠?", must: ["50만원"], mustNot: ["25"] },
        { q: "강연료 얼마 받아?", must: ["50만원"], mustNot: ["25"] },
        { q: "얼마?", history: [{role: 'user', content: 'AI 세미나'}], must: ["50만원"] },
        { q: "비용은?", must: ["50만원"] },
        { q: "가격이 어떻게 돼?", must: ["50만원"] },
        { q: "How much?", must: ["50만원"] }
      ]
    },
    {
      name: '🔢 개수 관련 (Count)',
      intent: '세미나 13회, 논문 25편 정확히 구분',
      tests: [
        { q: "세미나 몇 번 했어?", must: ["13"], mustNot: ["25"] },
        { q: "논문 몇 편 썼어?", must: ["25"], mustNot: ["13"] },
        { q: "초청강연 횟수는?", must: ["13"], mustNot: ["25"] },
        { q: "국제저널 논문 개수?", must: ["25"], mustNot: ["13"] },
        { q: "총 몇 번의 세미나?", must: ["13"], mustNot: ["25"] },
        { q: "논문 총 몇 편?", must: ["25"], mustNot: ["13"] },
        { q: "세미나 13회 맞아?", must: ["13", "맞"], mustNot: ["25"] },
        { q: "논문 25편 맞죠?", must: ["25", "맞"], mustNot: ["13"] }
      ]
    },
    {
      name: '📧 연락처 (Contact)',
      intent: '이메일 주소 정확히 제공',
      tests: [
        { q: "세미나 신청하고 싶은데", must: ["chaos@sayberrygames.com"] },
        { q: "신청은 어떻게?", must: ["chaos@sayberrygames.com"] },
        { q: "연락처 알려줘", must: ["chaos@sayberrygames.com"] },
        { q: "이메일 주소?", must: ["chaos@sayberrygames.com"] },
        { q: "연락처?", must: ["chaos@sayberrygames.com"] },
        { q: "Contact?", must: ["chaos@sayberrygames.com"] },
        { q: "어디로 연락?", must: ["chaos@sayberrygames.com"] }
      ]
    },
    {
      name: '📅 날짜 관련 (Date)',
      intent: '년도 없이 월/일만 답변',
      tests: [
        { q: "고려대 세미나 언제?", must: ["7월"], mustNot: ["2025", "25", "13"] },
        { q: "경상국립대는 언제?", must: ["8월"], mustNot: ["2025", "13"] },
        { q: "고려대 세미나는 언제야?", must: ["7월"], mustNot: ["2025"] },
        { q: "경상국립대 세미나 날짜는?", must: ["8월", "25일"], mustNot: ["2025년"] },
        { q: "KAIST는?", must: ["2024", "2025"], mustNot: ["13"] }
      ]
    },
    {
      name: '🔀 복합 질문 (Multiple)',
      intent: '여러 질문 모두 답변',
      tests: [
        { q: "세미나 얼마고 몇 번 했어?", must: ["50만원", "13"], mustNot: ["25편"] },
        { q: "논문은 몇 편이고 세미나는 몇 번?", must: ["25", "13"] },
        { q: "비용이랑 연락처 알려줘", must: ["50만원", "chaos@sayberrygames.com"] },
        { q: "가격하고 시간은?", must: ["50만원", "시간"] },
        { q: "세미나 13회 논문 25편 맞지?", must: ["13", "25", "맞"] }
      ]
    },
    {
      name: '💬 짧은 문맥 질문 (Context)',
      intent: '이전 대화 참고하여 정확히 답변',
      tests: [
        { 
          q: "얼마?", 
          history: [{role: 'user', content: 'AI 세미나 관련'}], 
          must: ["50만원"] 
        },
        { 
          q: "몇번?", 
          history: [{role: 'user', content: '세미나 진행한거'}], 
          must: ["13"] 
        },
        { 
          q: "몇개?", 
          history: [{role: 'user', content: '논문'}], 
          must: ["25"] 
        },
        { 
          q: "언제?", 
          history: [{role: 'user', content: '고려대'}], 
          must: ["7월"], 
          mustNot: ["2025"] 
        },
        { 
          q: "시간은?", 
          history: [{role: 'user', content: '세미나'}], 
          must: ["시간"] 
        }
      ]
    },
    {
      name: '📝 일반 문의 (General)',
      intent: 'AI 세미나 전체 정보 제공',
      tests: [
        { 
          q: "AI 세미나에 대해 궁금합니다", 
          must: ["AI", "50만원", "chaos@sayberrygames.com"] 
        },
        { 
          q: "AI 세미나에 대해 알려줘", 
          must: ["AI", "50만원", "chaos@sayberrygames.com"] 
        },
        { 
          q: "세미나 정보 좀", 
          must: ["AI", "50만원"] 
        }
      ]
    },
    {
      name: '🔤 오타/변형 (Typos)',
      intent: '오타도 정확히 인식',
      tests: [
        { q: "쎄미나 얼마야", must: ["50만원"] },
        { q: "쎄미나 몇번?", must: ["13"], mustNot: ["25"] },
        { q: "논문몇편", must: ["25"], mustNot: ["13"] },
        { q: "연락처좀", must: ["chaos@sayberrygames.com"] },
        { q: "세미나몇회", must: ["13"] }
      ]
    },
    {
      name: '🌏 영어 질문 (English)',
      intent: '영어 질문도 정확히 답변',
      tests: [
        { q: "How much for seminar?", must: ["50만원"] },
        { q: "How many papers?", must: ["25"] },
        { q: "How many seminars?", must: ["13"] },
        { q: "What's your email?", must: ["chaos@sayberrygames.com"] },
        { q: "Contact info?", must: ["chaos@sayberrygames.com"] }
      ]
    },
    {
      name: '✅ 검증 질문 (Validation)',
      intent: '정보 확인 질문',
      tests: [
        { q: "세미나 13회 맞아?", must: ["13", "맞"], mustNot: ["25"] },
        { q: "논문 25편 맞죠?", must: ["25", "맞"], mustNot: ["13"] },
        { q: "시간당 50만원 맞나요?", must: ["50만원", "맞"] },
        { q: "13회 25편 맞지?", must: ["13", "25", "맞"] }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];

  for (const category of testCategories) {
    console.log(`\n${category.name}`);
    console.log(`의도: ${category.intent}`);
    console.log('='.repeat(60));
    
    let categoryPass = 0;
    let categoryFail = 0;
    
    for (const test of category.tests) {
      totalTests++;
      const response = await chat(test.q, test.history || []);
      const responseLower = response.toLowerCase();
      
      let passed = true;
      const issues = [];
      
      // Must have check
      if (test.must) {
        for (const keyword of test.must) {
          if (!responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`누락: "${keyword}"`);
          }
        }
      }
      
      // Must not have check
      if (test.mustNot) {
        for (const keyword of test.mustNot) {
          if (responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`금지어: "${keyword}"`);
          }
        }
      }
      
      if (passed) {
        passedTests++;
        categoryPass++;
        console.log(`  ✅ "${test.q}"`);
      } else {
        categoryFail++;
        failedTests.push({
          category: category.name,
          question: test.q,
          issues: issues,
          response: response.substring(0, 80)
        });
        console.log(`  ❌ "${test.q}"`);
        issues.forEach(issue => console.log(`     ${issue}`));
      }
    }
    
    const categoryRate = Math.round(categoryPass/(categoryPass+categoryFail)*100);
    console.log(`  📊 ${categoryPass}/${categoryPass+categoryFail} (${categoryRate}%)`);
  }

  // 최종 결과
  console.log('\n' + '='.repeat(70));
  console.log('📈 최종 결과');
  console.log('='.repeat(70));
  
  const passRate = Math.round(passedTests/totalTests*100);
  console.log(`총 테스트: ${totalTests}`);
  console.log(`통과: ${passedTests}`);
  console.log(`실패: ${totalTests - passedTests}`);
  console.log(`통과율: ${passRate}%`);
  
  if (passRate >= 90) {
    console.log('\n🎉🎉🎉 목표 달성! 90% 이상 통과! 🎉🎉🎉');
  } else if (passRate >= 80) {
    console.log('\n⚠️ 거의 다 왔습니다! 조금만 더 개선하면 90% 달성 가능!');
  } else {
    console.log('\n❌ 추가 개선 필요. 목표: 90% 이상');
  }
  
  // 실패 요약
  if (failedTests.length > 0 && failedTests.length <= 10) {
    console.log('\n실패한 테스트:');
    failedTests.forEach(f => {
      console.log(`  • ${f.question}: ${f.issues.join(', ')}`);
    });
  }
  
  // JSON 결과 저장
  const fs = require('fs');
  fs.writeFileSync('precision-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passRate,
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    details: failedTests
  }, null, 2));
  
  console.log('\n상세 결과: precision-test-results.json');
}

console.log('⏱️ 정밀 테스트 시작...\n');
runTests().catch(console.error);