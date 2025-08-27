// 완벽한 종합 테스트 세트 - 모든 가능한 케이스
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message, history = []) {
  try {
    // Step 1
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 })
    });
    
    if (!response1.ok) return `Error ${response1.status}`;
    const data1 = await response1.json();
    
    // Step 2
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
  console.log('🔥 완벽한 종합 테스트 시작 (Ultimate Test Suite)');
  console.log('==================================================\n');

  const testSuites = [
    {
      name: '🎯 핵심 기능 (Core Functions)',
      tests: [
        // 세미나 비용
        { q: "AI 세미나 얼마야?", must: ["50만원", "시간당"], mustNot: ["25"] },
        { q: "1회당 얼마죠?", must: ["50만원"], mustNot: ["25"] },
        { q: "세미나 강연료가 얼마인가요?", must: ["50만원", "시간당"], mustNot: ["25"] },
        { q: "비용이 어떻게 되나요?", must: ["50만원"], mustNot: ["25"] },
        
        // 세미나 개수
        { q: "세미나 몇 번 했어?", must: ["13"], mustNot: ["25"] },
        { q: "초청강연 횟수?", must: ["13"], mustNot: ["25"] },
        { q: "총 몇 번의 세미나?", must: ["13"], mustNot: ["25"] },
        
        // 논문 개수
        { q: "논문 몇 편 썼어?", must: ["25"], mustNot: ["13"] },
        { q: "논문 총 몇 편?", must: ["25"], mustNot: ["13"] },
        { q: "국제저널 논문은?", must: ["25"], mustNot: ["13"] },
        
        // 세미나 신청
        { q: "세미나 신청하고 싶은데", must: ["chaos@sayberrygames.com"], mustNot: ["어떤 세미나"] },
        { q: "신청은 어떻게?", must: ["chaos@sayberrygames.com"], mustNot: ["어떤"] },
        { q: "연락처 알려줘", must: ["chaos@sayberrygames.com"] },
        
        // 일반 문의
        { q: "AI 세미나에 대해 궁금합니다", must: ["50만원", "chaos@sayberrygames.com", "AI"], mustNot: ["논문"] },
        { q: "AI 세미나에 대해 물어볼게 있습니다", must: ["AI", "50만원"], mustNot: ["과거 세미나 목록"] }
      ]
    },
    {
      name: '🔄 대화 문맥 (Context)',
      tests: [
        { 
          q: "얼마?", 
          history: [{role: 'user', content: 'AI 세미나에 대해 궁금해'}], 
          must: ["50만원"] 
        },
        { 
          q: "시간은?", 
          history: [{role: 'user', content: '세미나 신청하려고'}], 
          must: ["1", "2", "시간"] 
        },
        { 
          q: "언제?", 
          history: [{role: 'user', content: '고려대 세미나는?'}], 
          must: ["7월"] 
        },
        { 
          q: "몇개?", 
          history: [{role: 'user', content: '논문 관련해서'}], 
          must: ["25"] 
        },
        { 
          q: "몇번?", 
          history: [{role: 'user', content: '세미나 진행한거'}], 
          must: ["13"] 
        },
        {
          q: "그거 얼마야?",
          history: [{role: 'user', content: 'AI 세미나 하시죠?'}],
          must: ["50만원"]
        },
        {
          q: "더 자세히",
          history: [{role: 'assistant', content: '세미나는 AI 기초부터 LLM까지 다룹니다'}],
          must: ["AI", "LLM"]
        }
      ]
    },
    {
      name: '🌀 오타/변형 (Typos & Variations)',
      tests: [
        { q: "쎄미나 몇번 했어", must: ["13"], mustNot: ["25"] },
        { q: "세미나 얼마임?", must: ["50만원"] },
        { q: "논문몇편썼냐", must: ["25"], mustNot: ["13"] },
        { q: "AI세미나얼마", must: ["50만원"] },
        { q: "연락처좀", must: ["chaos@sayberrygames.com"] },
        { q: "세미나몇회", must: ["13"] },
        { q: "논문갯수", must: ["25"] }
      ]
    },
    {
      name: '💬 구어체/비속어 (Colloquial)',
      tests: [
        { q: "세미나 시발 얼마야", must: ["50만원"] },
        { q: "존나 비싸지 않아?", must: ["50만원"] },
        { q: "개많이 했네 세미나", must: ["13"] },
        { q: "논문 겁나 많이 썼네", must: ["25"] },
        { q: "얼마냐고 물어봤잖아", must: ["50만원"] },
        { q: "세미나 ㅈㄴ 많이 했네", must: ["13"] }
      ]
    },
    {
      name: '🔀 복합 질문 (Multiple Questions)',
      tests: [
        { q: "세미나 얼마고 몇 번 했어?", must: ["50만원", "13"], mustNot: ["25"] },
        { q: "논문은 몇 편이고 세미나는 몇 번?", must: ["25", "13"] },
        { q: "가격이랑 시간 알려줘", must: ["50만원", "시간"] },
        { q: "고려대랑 카이스트 언제 갔어?", must: ["고려대", "KAIST"] },
        { q: "연락처랑 비용 좀", must: ["chaos@sayberrygames.com", "50만원"] },
        { q: "세미나 13회 맞고 논문 25편 맞아?", must: ["13", "25", "맞"] }
      ]
    },
    {
      name: '❓ 애매한 질문 (Ambiguous)',
      tests: [
        { q: "비싸지 않아?", must: ["50만원"] },
        { q: "괜찮은가요?", must: ["AI", "세미나"] },
        { q: "많이 했네요", history: [{role: 'user', content: '세미나 13회'}], must: ["13"] },
        { q: "적당한 가격인가요?", must: ["50만원"] },
        { q: "어떻게 생각해?", history: [{role: 'user', content: 'AI 세미나'}], must: ["AI"] },
        { q: "그정도면 되나?", history: [{role: 'user', content: '50만원'}], must: ["50만원"] }
      ]
    },
    {
      name: '🌍 영어 질문 (English)',
      tests: [
        { q: "How much for seminar?", must: ["50"], mustNot: ["25"] },
        { q: "How many papers?", must: ["25"], mustNot: ["13"] },
        { q: "How many seminars?", must: ["13"], mustNot: ["25"] },
        { q: "Contact info?", must: ["chaos@sayberrygames.com"] },
        { q: "What's the price?", must: ["50"] },
        { q: "Email address?", must: ["chaos@sayberrygames.com"] }
      ]
    },
    {
      name: '🎓 대학별 세미나 (Universities)',
      tests: [
        { q: "고려대 세미나 언제?", must: ["7월"], mustNot: ["25"] },
        { q: "경상국립대는?", must: ["8월"], mustNot: ["25"] },
        { q: "KAIST에서 했어?", must: ["KAIST"], mustNot: ["25"] },
        { q: "부경대 세미나", must: ["부경대"], mustNot: ["25"] },
        { q: "전북대는 언제 갔어?", must: ["전북대"], mustNot: ["25"] },
        { q: "충남대에서도 했나?", must: ["충남대"], mustNot: ["25"] }
      ]
    },
    {
      name: '🔍 특수 케이스 (Special Cases)',
      tests: [
        { q: "하버드에서 세미나 했어?", must: ["하버드", "없"] },
        { q: "무료 세미나도 하나요?", must: ["50만원"] },
        { q: "100편 논문 중에 최고는?", must: ["25"] },
        { q: "세미나 25번 했죠?", must: ["13"], mustNot: ["25번"] },
        { q: "논문 13편 맞나요?", must: ["25"], mustNot: ["13편"] },
        { q: "50편 논문 썼다던데", must: ["25"] }
      ]
    },
    {
      name: '🎭 존댓말/반말 섞기 (Mixed Formality)',
      tests: [
        { q: "세미나 해주세요 얼마야", must: ["50만원", "chaos@sayberrygames.com"] },
        { q: "논문 보여주세요 몇편이야", must: ["25"] },
        { q: "언제 할 수 있어요 비용은?", must: ["50만원", "chaos@sayberrygames.com"] },
        { q: "신청하고 싶은데 얼마임", must: ["50만원", "chaos@sayberrygames.com"] },
        { q: "세미나 부탁드려 언제 가능해", must: ["chaos@sayberrygames.com"] }
      ]
    },
    {
      name: '📝 극한 짧은 질문 (Ultra Short)',
      tests: [
        { q: "얼마", must: ["50만원"] },
        { q: "몇개", history: [{role: 'user', content: '논문'}], must: ["25"] },
        { q: "언제", history: [{role: 'user', content: '고려대'}], must: ["7월"] },
        { q: "연락처", must: ["chaos@sayberrygames.com"] },
        { q: "비용", must: ["50만원"] },
        { q: "시간", must: ["시간"] }
      ]
    },
    {
      name: '🔄 연속 대화 (Continuous Dialogue)',
      tests: [
        {
          q: "비용 궁금해",
          history: [
            {role: 'user', content: 'AI 세미나에 대해 알려줘'},
            {role: 'assistant', content: 'AI 세미나는 AI 기초부터 LLM까지 다룹니다'}
          ],
          must: ["50만원"]
        },
        {
          q: "그럼 신청은?",
          history: [
            {role: 'user', content: '세미나 비용이 얼마야?'},
            {role: 'assistant', content: '시간당 50만원입니다'}
          ],
          must: ["chaos@sayberrygames.com"]
        },
        {
          q: "총 몇번?",
          history: [
            {role: 'user', content: '세미나 많이 했어?'},
            {role: 'assistant', content: '네, 여러 대학에서 진행했습니다'}
          ],
          must: ["13"]
        }
      ]
    },
    {
      name: '💣 극한 테스트 (Extreme Cases)',
      tests: [
        { q: "ㅅㅁㄴ ㅇㄹㅁ", must: ["50만원"] },  // 자음만
        { q: "세...미...나... 얼...마?", must: ["50만원"] },  // 말더듬
        { q: "세미나세미나세미나 얼마얼마얼마", must: ["50만원"] },  // 반복
        { q: "?????", history: [{role: 'user', content: '세미나 비용'}], must: ["50만원"] },
        { q: "!!!!!!", history: [{role: 'user', content: '너무 비싸'}], must: ["50만원"] },
        { q: "........", history: [{role: 'user', content: '논문 개수'}], must: ["25"] }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];

  for (const suite of testSuites) {
    console.log(`\n${suite.name}`);
    console.log('='.repeat(50));
    
    let suitePass = 0;
    let suiteFail = 0;
    
    for (const test of suite.tests) {
      totalTests++;
      const response = await chat(test.q, test.history || []);
      const responseLower = response.toLowerCase();
      
      let passed = true;
      const issues = [];
      
      // Check must have keywords
      if (test.must) {
        for (const keyword of test.must) {
          if (!responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`누락: "${keyword}"`);
          }
        }
      }
      
      // Check must not have keywords
      if (test.mustNot) {
        for (const keyword of test.mustNot) {
          if (responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`금지어 포함: "${keyword}"`);
          }
        }
      }
      
      if (passed) {
        passedTests++;
        suitePass++;
        console.log(`  ✅ "${test.q}"`);
      } else {
        suiteFail++;
        const failInfo = {
          suite: suite.name,
          question: test.q,
          issues: issues,
          response: response.substring(0, 100)
        };
        failedTests.push(failInfo);
        console.log(`  ❌ "${test.q}"`);
        issues.forEach(issue => console.log(`     ${issue}`));
      }
    }
    
    console.log(`  📊 ${suitePass}/${suitePass + suiteFail} 통과`);
  }

  // 최종 결과
  console.log('\n' + '='.repeat(70));
  console.log('📈 최종 결과 (FINAL RESULTS)');
  console.log('='.repeat(70));
  console.log(`총 테스트: ${totalTests}`);
  console.log(`통과: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`실패: ${totalTests - passedTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉🎉🎉 완벽합니다! 모든 테스트 통과! 🎉🎉🎉');
  } else if (passedTests >= totalTests * 0.95) {
    console.log('\n🎊 우수! 95% 이상 통과!');
  } else if (passedTests >= totalTests * 0.90) {
    console.log('\n✨ 양호! 90% 이상 통과!');
  } else if (passedTests >= totalTests * 0.80) {
    console.log('\n⚠️ 개선 필요! 80% 이상 통과');
  } else {
    console.log('\n❌ 심각한 문제! 80% 미만 통과');
  }
  
  // 실패한 테스트 요약
  if (failedTests.length > 0) {
    console.log('\n📋 실패한 테스트 요약:');
    console.log('='.repeat(70));
    const suiteFailures = {};
    failedTests.forEach(fail => {
      if (!suiteFailures[fail.suite]) {
        suiteFailures[fail.suite] = [];
      }
      suiteFailures[fail.suite].push(fail);
    });
    
    for (const [suite, failures] of Object.entries(suiteFailures)) {
      console.log(`\n${suite}: ${failures.length}개 실패`);
      failures.slice(0, 3).forEach(f => {
        console.log(`  • "${f.question}": ${f.issues.join(', ')}`);
      });
      if (failures.length > 3) {
        console.log(`  ... 그 외 ${failures.length - 3}개 더`);
      }
    }
  }
}

console.log('⏱️ 테스트 시작... (약 3-5분 소요)');
runTests().catch(console.error);